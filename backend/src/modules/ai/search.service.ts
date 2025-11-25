import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { PrismaService } from "../../common/prisma/prisma.service";

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score?: number;
}

export interface SearchResponse {
  success: boolean;
  results: SearchResult[];
  error?: string;
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Search for real-time information using configured search API
   */
  async search(query: string, maxResults: number = 5): Promise<SearchResponse> {
    // Get search API configuration from system settings
    const searchConfig = await this.getSearchConfig();

    if (!searchConfig.apiKey) {
      this.logger.warn("Search API key not configured");
      return {
        success: false,
        results: [],
        error: "Search API not configured",
      };
    }

    try {
      switch (searchConfig.provider) {
        case "tavily":
          return await this.searchWithTavily(
            query,
            searchConfig.apiKey,
            maxResults,
          );
        case "serper":
          return await this.searchWithSerper(
            query,
            searchConfig.apiKey,
            maxResults,
          );
        default:
          return await this.searchWithTavily(
            query,
            searchConfig.apiKey,
            maxResults,
          );
      }
    } catch (error: any) {
      this.logger.error(`Search failed: ${error.message}`);
      return {
        success: false,
        results: [],
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Get search API configuration from database, fallback to environment variables
   */
  private async getSearchConfig(): Promise<{
    provider: string;
    apiKey: string | null;
    enabled: boolean;
  }> {
    try {
      // Try to get from database first
      const settings = await this.prisma.systemSetting.findMany({
        where: {
          key: {
            in: [
              "search.provider",
              "search.enabled",
              "search.tavily.apiKey",
              "search.serper.apiKey",
            ],
          },
        },
      });

      const settingsMap: Record<string, any> = {};
      for (const s of settings) {
        try {
          settingsMap[s.key] = JSON.parse(s.value);
        } catch {
          settingsMap[s.key] = s.value;
        }
      }

      // Check if search is disabled in database
      if (
        settingsMap["search.enabled"] === false ||
        settingsMap["search.enabled"] === "false"
      ) {
        return { provider: "tavily", apiKey: null, enabled: false };
      }

      const provider = settingsMap["search.provider"] || "tavily";

      // Get API key based on provider
      let apiKey: string | null = null;
      if (provider === "tavily") {
        apiKey = settingsMap["search.tavily.apiKey"] || null;
      } else if (provider === "serper") {
        apiKey = settingsMap["search.serper.apiKey"] || null;
      }

      // If database has config, use it
      if (apiKey) {
        return { provider, apiKey, enabled: true };
      }
    } catch (error) {
      this.logger.warn(
        "Failed to get search config from database, using env vars",
      );
    }

    // Fallback to environment variables
    const tavilyKey = process.env.TAVILY_API_KEY;
    const serperKey = process.env.SERPER_API_KEY;

    if (tavilyKey) {
      return { provider: "tavily", apiKey: tavilyKey, enabled: true };
    }
    if (serperKey) {
      return { provider: "serper", apiKey: serperKey, enabled: true };
    }

    return { provider: "tavily", apiKey: null, enabled: true };
  }

  /**
   * Search using Tavily API
   * https://tavily.com/
   */
  private async searchWithTavily(
    query: string,
    apiKey: string,
    maxResults: number,
  ): Promise<SearchResponse> {
    this.logger.log(`Searching with Tavily: "${query}"`);

    const response = await firstValueFrom(
      this.httpService.post(
        "https://api.tavily.com/search",
        {
          api_key: apiKey,
          query,
          max_results: maxResults,
          search_depth: "basic",
          include_answer: false,
          include_raw_content: false,
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 30000,
        },
      ),
    );

    const results: SearchResult[] = (response.data.results || []).map(
      (r: any) => ({
        title: r.title,
        url: r.url,
        content: r.content,
        score: r.score,
      }),
    );

    this.logger.log(`Tavily returned ${results.length} results`);
    return { success: true, results };
  }

  /**
   * Search using Serper API (Google Search)
   * https://serper.dev/
   */
  private async searchWithSerper(
    query: string,
    apiKey: string,
    maxResults: number,
  ): Promise<SearchResponse> {
    this.logger.log(`Searching with Serper: "${query}"`);

    const response = await firstValueFrom(
      this.httpService.post(
        "https://google.serper.dev/search",
        {
          q: query,
          num: maxResults,
        },
        {
          headers: {
            "X-API-KEY": apiKey,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        },
      ),
    );

    const results: SearchResult[] = (response.data.organic || []).map(
      (r: any) => ({
        title: r.title,
        url: r.link,
        content: r.snippet,
      }),
    );

    this.logger.log(`Serper returned ${results.length} results`);
    return { success: true, results };
  }

  /**
   * Format search results for AI context injection
   */
  formatResultsForContext(results: SearchResult[]): string {
    if (results.length === 0) return "";

    const formatted = results
      .map(
        (r, i) => `${i + 1}. **${r.title}**\n   URL: ${r.url}\n   ${r.content}`,
      )
      .join("\n\n");

    return `## Web Search Results\nRecent information from the web:\n\n${formatted}`;
  }
}
