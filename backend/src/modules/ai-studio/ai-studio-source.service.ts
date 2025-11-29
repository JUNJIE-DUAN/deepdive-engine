import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { InputJsonValue } from "@prisma/client/runtime/library";
import { SearchService } from "../ai/search.service";
import { AddSourceDto, SearchSourcesDto } from "./dto";

@Injectable()
export class AiStudioSourceService {
  private readonly logger = new Logger(AiStudioSourceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly searchService: SearchService,
  ) {}

  /**
   * Add a source to a project (with deduplication)
   */
  async addSource(userId: string, projectId: string, dto: AddSourceDto) {
    // Verify project ownership
    const project = await this.prisma.researchProject.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    if (project.userId !== userId) {
      throw new ForbiddenException("Access denied");
    }

    // Check for duplicates by title or sourceUrl
    const existingSource = await this.findDuplicateSource(
      projectId,
      dto.title,
      dto.sourceUrl,
      dto.resourceId,
    );

    if (existingSource) {
      this.logger.log(
        `Source already exists in project: ${existingSource.title}`,
      );
      // Return existing source instead of creating duplicate
      return existingSource;
    }

    const source = await this.prisma.researchProjectSource.create({
      data: {
        projectId,
        title: dto.title,
        sourceType: dto.sourceType,
        sourceUrl: dto.sourceUrl,
        abstract: dto.abstract,
        content: dto.content,
        authors: dto.authors,
        publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : null,
        metadata: (dto.metadata || {}) as unknown as InputJsonValue,
        resourceId: dto.resourceId,
        analysisStatus: "PENDING",
      },
    });

    // Update source count
    await this.prisma.researchProject.update({
      where: { id: projectId },
      data: {
        sourceCount: { increment: 1 },
      },
    });

    return source;
  }

  /**
   * Find duplicate source in project by title, URL, or resourceId
   */
  private async findDuplicateSource(
    projectId: string,
    title: string,
    sourceUrl?: string | null,
    resourceId?: string | null,
  ) {
    const conditions: any[] = [];

    // Check by exact title match (case-insensitive)
    if (title) {
      conditions.push({ title: { equals: title, mode: "insensitive" } });
    }

    // Check by sourceUrl if provided
    if (sourceUrl) {
      conditions.push({
        sourceUrl: { equals: sourceUrl, mode: "insensitive" },
      });
    }

    // Check by resourceId if provided
    if (resourceId) {
      conditions.push({ resourceId: resourceId });
    }

    if (conditions.length === 0) {
      return null;
    }

    return this.prisma.researchProjectSource.findFirst({
      where: {
        projectId,
        OR: conditions,
      },
    });
  }

  /**
   * Add multiple sources to a project (with deduplication)
   */
  async addSources(userId: string, projectId: string, sources: AddSourceDto[]) {
    // Verify project ownership
    const project = await this.prisma.researchProject.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    if (project.userId !== userId) {
      throw new ForbiddenException("Access denied");
    }

    // Filter out duplicates
    const uniqueSources: AddSourceDto[] = [];
    for (const dto of sources) {
      const existingSource = await this.findDuplicateSource(
        projectId,
        dto.title,
        dto.sourceUrl,
        dto.resourceId,
      );
      if (!existingSource) {
        // Also check for duplicates within the batch
        const isDuplicateInBatch = uniqueSources.some(
          (s) =>
            s.title.toLowerCase() === dto.title.toLowerCase() ||
            (s.sourceUrl && s.sourceUrl === dto.sourceUrl) ||
            (s.resourceId && s.resourceId === dto.resourceId),
        );
        if (!isDuplicateInBatch) {
          uniqueSources.push(dto);
        }
      }
    }

    if (uniqueSources.length === 0) {
      this.logger.log("All sources already exist in project, skipping");
      return [];
    }

    this.logger.log(
      `Adding ${uniqueSources.length} unique sources (${sources.length - uniqueSources.length} duplicates skipped)`,
    );

    const createdSources = await this.prisma.$transaction(
      uniqueSources.map((dto) =>
        this.prisma.researchProjectSource.create({
          data: {
            projectId,
            title: dto.title,
            sourceType: dto.sourceType,
            sourceUrl: dto.sourceUrl,
            abstract: dto.abstract,
            content: dto.content,
            authors: dto.authors,
            publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : null,
            metadata: (dto.metadata || {}) as unknown as InputJsonValue,
            resourceId: dto.resourceId,
            analysisStatus: "PENDING",
          },
        }),
      ),
    );

    // Update source count
    await this.prisma.researchProject.update({
      where: { id: projectId },
      data: {
        sourceCount: { increment: uniqueSources.length },
      },
    });

    return createdSources;
  }

  /**
   * Get all sources for a project
   */
  async getSources(userId: string, projectId: string) {
    // Verify project ownership
    const project = await this.prisma.researchProject.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    if (project.userId !== userId) {
      throw new ForbiddenException("Access denied");
    }

    return this.prisma.researchProjectSource.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get a single source
   */
  async getSource(userId: string, projectId: string, sourceId: string) {
    const project = await this.prisma.researchProject.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    if (project.userId !== userId) {
      throw new ForbiddenException("Access denied");
    }

    const source = await this.prisma.researchProjectSource.findUnique({
      where: { id: sourceId },
    });

    if (!source || source.projectId !== projectId) {
      throw new NotFoundException("Source not found");
    }

    return source;
  }

  /**
   * Remove a source from a project
   */
  async removeSource(userId: string, projectId: string, sourceId: string) {
    const project = await this.prisma.researchProject.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    if (project.userId !== userId) {
      throw new ForbiddenException("Access denied");
    }

    const source = await this.prisma.researchProjectSource.findUnique({
      where: { id: sourceId },
    });

    if (!source || source.projectId !== projectId) {
      throw new NotFoundException("Source not found");
    }

    await this.prisma.researchProjectSource.delete({
      where: { id: sourceId },
    });

    // Update source count
    await this.prisma.researchProject.update({
      where: { id: projectId },
      data: {
        sourceCount: { decrement: 1 },
      },
    });

    return { success: true };
  }

  /**
   * Search for sources (from local DB or internet)
   * Supports two modes:
   * - quick: Fast parallel search across selected sources
   * - deep: Multi-round iterative search with AI-guided refinement
   */
  async searchSources(_userId: string, dto: SearchSourcesDto) {
    const mode = dto.mode || "quick";
    const sourcesToSearch = dto.sources || ["local", "web", "arxiv", "github"];

    this.logger.log(
      `[${mode.toUpperCase()}] Searching sources: ${sourcesToSearch.join(", ")} for query: ${dto.query}`,
    );

    if (mode === "deep") {
      return this.deepResearch(dto.query, sourcesToSearch);
    }

    return this.quickSearch(dto.query, sourcesToSearch);
  }

  /**
   * Quick Search: Fast parallel search across multiple sources
   * Returns results in seconds with basic relevance sorting
   */
  private async quickSearch(query: string, sourcesToSearch: string[]) {
    const startTime = Date.now();
    const results: any[] = [];
    const searchPromises: Promise<any[]>[] = [];
    const errors: string[] = [];

    // Launch all searches in parallel for speed
    if (sourcesToSearch.includes("local")) {
      searchPromises.push(
        this.searchLocalDB(query, 10).catch((e) => {
          errors.push(`local: ${e.message}`);
          return [];
        }),
      );
    }

    if (sourcesToSearch.includes("web")) {
      searchPromises.push(
        this.searchWeb(query, 10).catch((e) => {
          errors.push(`web: ${e.message}`);
          return [];
        }),
      );
    }

    if (sourcesToSearch.includes("arxiv")) {
      searchPromises.push(
        this.searchArxivDirect(query, 10).catch((e) => {
          errors.push(`arxiv: ${e.message}`);
          return [];
        }),
      );
    }

    if (sourcesToSearch.includes("github")) {
      searchPromises.push(
        this.searchGithubDirect(query, 10).catch((e) => {
          errors.push(`github: ${e.message}`);
          return [];
        }),
      );
    }

    // Wait for all searches to complete
    const allResults = await Promise.all(searchPromises);
    allResults.forEach((r) => results.push(...r));

    const duration = Date.now() - startTime;
    this.logger.log(
      `Quick search completed in ${duration}ms with ${results.length} results`,
    );

    return {
      results,
      query,
      mode: "quick" as const,
      sourcesSearched: sourcesToSearch,
      stats: {
        totalResults: results.length,
        durationMs: duration,
        errors: errors.length > 0 ? errors : undefined,
      },
    };
  }

  /**
   * Deep Research: Multi-round iterative search with comprehensive coverage
   *
   * Based on industry best practices (Perplexity, NotebookLM):
   * 1. Initial broad search across all sources
   * 2. Analyze results to identify key themes/subtopics
   * 3. Conduct follow-up searches for each subtopic
   * 4. Deduplicate and rank by relevance
   * 5. Return comprehensive results with metadata
   */
  private async deepResearch(query: string, sourcesToSearch: string[]) {
    const startTime = Date.now();
    const allResults: any[] = [];
    const searchHistory: string[] = [query];
    const errors: string[] = [];

    this.logger.log(`Starting deep research for: ${query}`);

    // Round 1: Initial broad search
    this.logger.log("Deep research round 1: Initial search");
    const round1Results = await this.quickSearch(query, sourcesToSearch);
    allResults.push(...round1Results.results);

    // Round 2: Generate related queries based on initial results
    const relatedQueries = this.generateRelatedQueries(
      query,
      round1Results.results,
    );
    this.logger.log(
      `Deep research round 2: ${relatedQueries.length} related queries`,
    );

    for (const relatedQuery of relatedQueries.slice(0, 3)) {
      if (searchHistory.includes(relatedQuery)) continue;
      searchHistory.push(relatedQuery);

      try {
        const relatedResults = await this.quickSearch(
          relatedQuery,
          sourcesToSearch,
        );
        // Add results that aren't duplicates
        for (const result of relatedResults.results) {
          if (!this.isDuplicate(result, allResults)) {
            allResults.push({ ...result, relatedQuery });
          }
        }
      } catch (error: any) {
        errors.push(`related search "${relatedQuery}": ${error.message}`);
      }
    }

    // Round 3: Academic deep dive (if arxiv is in sources)
    if (sourcesToSearch.includes("arxiv")) {
      this.logger.log("Deep research round 3: Academic deep dive");
      const academicQueries = this.generateAcademicQueries(query);

      for (const academicQuery of academicQueries.slice(0, 2)) {
        if (searchHistory.includes(academicQuery)) continue;
        searchHistory.push(academicQuery);

        try {
          const arxivResults = await this.searchArxivDirect(academicQuery, 15);
          for (const result of arxivResults) {
            if (!this.isDuplicate(result, allResults)) {
              allResults.push({ ...result, relatedQuery: academicQuery });
            }
          }
        } catch (error: any) {
          errors.push(`arxiv deep search: ${error.message}`);
        }
      }
    }

    // Deduplicate and sort by relevance
    const deduplicatedResults = this.deduplicateResults(allResults);
    const rankedResults = this.rankByRelevance(deduplicatedResults, query);

    const duration = Date.now() - startTime;
    this.logger.log(
      `Deep research completed in ${duration}ms with ${rankedResults.length} unique results`,
    );

    return {
      results: rankedResults,
      query,
      mode: "deep" as const,
      sourcesSearched: sourcesToSearch,
      stats: {
        totalResults: rankedResults.length,
        searchRounds: searchHistory.length,
        queriesExecuted: searchHistory,
        durationMs: duration,
        errors: errors.length > 0 ? errors : undefined,
      },
    };
  }

  /**
   * Search local database
   */
  private async searchLocalDB(query: string, limit: number): Promise<any[]> {
    const results = await this.prisma.resource.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { abstract: { contains: query, mode: "insensitive" } },
        ],
      },
      take: limit,
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        type: true,
        title: true,
        abstract: true,
        sourceUrl: true,
        publishedAt: true,
        authors: true,
        qualityScore: true,
        citationCount: true,
      },
    });

    this.logger.log(`Local search returned ${results.length} results`);
    return results.map((r) => ({
      ...r,
      source: "local",
      sourceType: r.type.toLowerCase(),
    }));
  }

  /**
   * Search web using Tavily/Serper
   */
  private async searchWeb(query: string, limit: number): Promise<any[]> {
    const webResults = await this.searchService.search(query, limit);
    if (!webResults.success || !webResults.results.length) {
      return [];
    }

    this.logger.log(`Web search returned ${webResults.results.length} results`);
    return webResults.results.map((r) => ({
      id: null,
      title: r.title,
      abstract: r.content,
      sourceUrl: r.url,
      source: "web",
      sourceType: "news",
      score: r.score,
    }));
  }

  /**
   * Generate related queries based on initial results
   */
  private generateRelatedQueries(query: string, results: any[]): string[] {
    const queries: string[] = [];
    const words = query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3);

    // Extract key terms from results
    const termCounts = new Map<string, number>();
    for (const result of results.slice(0, 10)) {
      const text =
        `${result.title || ""} ${result.abstract || ""}`.toLowerCase();
      const resultWords = text.split(/\s+/).filter((w) => w.length > 4);
      for (const word of resultWords) {
        if (!words.includes(word) && /^[a-z]+$/i.test(word)) {
          termCounts.set(word, (termCounts.get(word) || 0) + 1);
        }
      }
    }

    // Get top terms and create queries
    const topTerms = [...termCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([term]) => term);

    for (const term of topTerms) {
      queries.push(`${query} ${term}`);
    }

    // Add variations
    queries.push(`${query} latest research`);
    queries.push(`${query} comparison`);
    queries.push(`${query} implementation`);

    return queries;
  }

  /**
   * Generate academic-focused queries
   */
  private generateAcademicQueries(query: string): string[] {
    return [
      `${query} survey`,
      `${query} benchmark`,
      `${query} state of the art`,
      `${query} novel approach`,
    ];
  }

  /**
   * Check if result is a duplicate
   */
  private isDuplicate(result: any, existingResults: any[]): boolean {
    const url = result.sourceUrl?.toLowerCase();
    const title = result.title?.toLowerCase();

    return existingResults.some((existing) => {
      if (url && existing.sourceUrl?.toLowerCase() === url) return true;
      if (title && existing.title?.toLowerCase() === title) return true;
      return false;
    });
  }

  /**
   * Deduplicate results by URL and title
   */
  private deduplicateResults(results: any[]): any[] {
    const seen = new Set<string>();
    return results.filter((result) => {
      const key =
        result.sourceUrl?.toLowerCase() || result.title?.toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Rank results by relevance to query
   */
  private rankByRelevance(results: any[], query: string): any[] {
    const queryTerms = query.toLowerCase().split(/\s+/);

    return results
      .map((result) => {
        const text =
          `${result.title || ""} ${result.abstract || ""}`.toLowerCase();
        let relevanceScore = 0;

        // Score based on term matches
        for (const term of queryTerms) {
          if (text.includes(term)) relevanceScore += 10;
          if (result.title?.toLowerCase().includes(term)) relevanceScore += 20;
        }

        // Bonus for academic papers
        if (result.source === "arxiv") relevanceScore += 5;

        // Bonus for existing score
        if (result.score) relevanceScore += result.score * 10;

        return { ...result, relevanceScore };
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Search arXiv directly and return formatted results
   */
  private async searchArxivDirect(
    query: string,
    maxResults: number,
  ): Promise<any[]> {
    const axios = await import("axios");
    const xml2js = await import("xml2js");

    const response = await axios.default.get(
      "http://export.arxiv.org/api/query",
      {
        params: {
          search_query: `all:${query}`,
          start: 0,
          max_results: maxResults,
          sortBy: "relevance",
          sortOrder: "descending",
        },
        timeout: 10000,
      },
    );

    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(response.data);

    if (!result.feed || !result.feed.entry) {
      return [];
    }

    const entries = Array.isArray(result.feed.entry)
      ? result.feed.entry
      : [result.feed.entry];

    return entries.map((entry: any) => {
      const authors = entry.author
        ? Array.isArray(entry.author)
          ? entry.author.map((a: any) => a.name)
          : [entry.author.name]
        : [];

      const pdfLink = entry.link
        ? Array.isArray(entry.link)
          ? entry.link.find((l: any) => l.$.title === "pdf")
          : entry.link.$.title === "pdf"
            ? entry.link
            : null
        : null;

      return {
        id: null,
        title: entry.title?.replace(/\s+/g, " ").trim(),
        abstract: entry.summary?.replace(/\s+/g, " ").trim(),
        sourceUrl: pdfLink?.$?.href || entry.id,
        authors,
        publishedAt: entry.published,
        source: "arxiv",
        sourceType: "paper",
        categories: entry.category
          ? Array.isArray(entry.category)
            ? entry.category.map((c: any) => c.$.term)
            : [entry.category.$.term]
          : [],
      };
    });
  }

  /**
   * Search GitHub directly and return formatted results
   */
  private async searchGithubDirect(
    query: string,
    maxResults: number,
  ): Promise<any[]> {
    const axios = await import("axios");

    const response = await axios.default.get(
      "https://api.github.com/search/repositories",
      {
        params: {
          q: query,
          sort: "stars",
          order: "desc",
          per_page: maxResults,
        },
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "DeepDive-Engine",
        },
        timeout: 10000,
      },
    );

    return (response.data.items || []).map((repo: any) => ({
      id: null,
      title: repo.full_name,
      abstract: repo.description,
      sourceUrl: repo.html_url,
      source: "github",
      sourceType: "github",
      metadata: {
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        language: repo.language,
        topics: repo.topics,
      },
    }));
  }

  /**
   * Update source analysis status
   */
  async updateSourceAnalysis(
    sourceId: string,
    status: "PENDING" | "ANALYZING" | "COMPLETED" | "FAILED",
    aiSummary?: string,
    keyInsights?: any,
  ) {
    return this.prisma.researchProjectSource.update({
      where: { id: sourceId },
      data: {
        analysisStatus: status,
        ...(aiSummary && { aiSummary }),
        ...(keyInsights && { keyInsights }),
      },
    });
  }
}
