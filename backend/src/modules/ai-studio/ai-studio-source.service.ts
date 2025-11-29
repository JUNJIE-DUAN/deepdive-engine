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
   * Add a source to a project
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
   * Add multiple sources to a project
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

    const createdSources = await this.prisma.$transaction(
      sources.map((dto) =>
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
        sourceCount: { increment: sources.length },
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
   */
  async searchSources(_userId: string, dto: SearchSourcesDto) {
    const results: any[] = [];
    const sourcesToSearch = dto.sources || ["local", "web", "arxiv", "github"];

    this.logger.log(
      `Searching sources: ${sourcesToSearch.join(", ")} for query: ${dto.query}`,
    );

    // Search local database
    if (sourcesToSearch.includes("local")) {
      try {
        const localResults = await this.prisma.resource.findMany({
          where: {
            OR: [
              { title: { contains: dto.query, mode: "insensitive" } },
              { abstract: { contains: dto.query, mode: "insensitive" } },
            ],
          },
          take: 20,
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

        results.push(
          ...localResults.map((r) => ({
            ...r,
            source: "local",
            sourceType: r.type.toLowerCase(),
          })),
        );
        this.logger.log(`Local search returned ${localResults.length} results`);
      } catch (error) {
        this.logger.error("Local search failed", error);
      }
    }

    // Search internet using Tavily/Serper
    if (
      sourcesToSearch.includes("web") ||
      (dto.includeInternet && sourcesToSearch.length === 0)
    ) {
      try {
        const webResults = await this.searchService.search(dto.query, 10);
        if (webResults.success && webResults.results.length > 0) {
          results.push(
            ...webResults.results.map((r) => ({
              id: null,
              title: r.title,
              abstract: r.content,
              sourceUrl: r.url,
              source: "web",
              sourceType: "news",
              score: r.score,
            })),
          );
          this.logger.log(
            `Web search returned ${webResults.results.length} results`,
          );
        }
      } catch (error) {
        this.logger.error("Web search failed", error);
      }
    }

    // Search arXiv for academic papers
    if (sourcesToSearch.includes("arxiv")) {
      try {
        const arxivResults = await this.searchArxivDirect(dto.query, 10);
        results.push(...arxivResults);
        this.logger.log(`arXiv search returned ${arxivResults.length} results`);
      } catch (error) {
        this.logger.error("arXiv search failed", error);
      }
    }

    // Search GitHub for projects
    if (sourcesToSearch.includes("github")) {
      try {
        const githubResults = await this.searchGithubDirect(dto.query, 10);
        results.push(...githubResults);
        this.logger.log(
          `GitHub search returned ${githubResults.length} results`,
        );
      } catch (error) {
        this.logger.error("GitHub search failed", error);
      }
    }

    return {
      results,
      query: dto.query,
      mode: dto.mode || "quick",
      sourcesSearched: sourcesToSearch,
    };
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
