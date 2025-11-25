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

  /**
   * Extract URLs from text content
   */
  extractUrls(text: string): string[] {
    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
    const matches = text.match(urlRegex) || [];
    // Remove trailing punctuation that might be captured
    return matches.map((url) => url.replace(/[.,;:!?)]+$/, ""));
  }

  /**
   * Fetch content from a URL and extract main text
   */
  async fetchUrlContent(url: string): Promise<{
    success: boolean;
    title?: string;
    content?: string;
    error?: string;
  }> {
    try {
      this.logger.log(`Fetching URL content: ${url}`);

      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7",
          },
          timeout: 15000,
          maxRedirects: 5,
        }),
      );

      const html = response.data;
      if (!html || typeof html !== "string") {
        return { success: false, error: "No HTML content received" };
      }

      // Extract title
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : url;

      // Extract main content - remove scripts, styles, and HTML tags
      let content = html
        // Remove script tags and content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        // Remove style tags and content
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
        // Remove HTML comments
        .replace(/<!--[\s\S]*?-->/g, "")
        // Remove all HTML tags
        .replace(/<[^>]+>/g, " ")
        // Decode HTML entities
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        // Normalize whitespace
        .replace(/\s+/g, " ")
        .trim();

      // Limit content length for AI context
      // CRITICAL FIX: Reduced from 8000 to 3000 to prevent context overflow
      if (content.length > 3000) {
        content = content.substring(0, 3000) + "...";
      }

      this.logger.log(
        `Fetched URL content: ${title} (${content.length} chars)`,
      );

      return { success: true, title, content };
    } catch (error: any) {
      const errorMessage = error.response?.status
        ? `HTTP ${error.response.status}: ${error.response.statusText}`
        : error.message;
      this.logger.error(`Failed to fetch URL ${url}: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Fetch multiple URLs and format for AI context
   */
  async fetchUrlsForContext(urls: string[]): Promise<string> {
    if (urls.length === 0) return "";

    const results: string[] = [];

    // Limit to 3 URLs to avoid context overflow
    const urlsToFetch = urls.slice(0, 3);

    for (const url of urlsToFetch) {
      const result = await this.fetchUrlContent(url);
      if (result.success && result.content) {
        results.push(
          `### ${result.title || url}\nURL: ${url}\n\n${result.content}`,
        );
      }
    }

    if (results.length === 0) return "";

    return `## Fetched Web Page Content\nThe following content was fetched from URLs mentioned in the conversation:\n\n${results.join("\n\n---\n\n")}`;
  }
}
