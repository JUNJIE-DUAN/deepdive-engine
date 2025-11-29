import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { InputJsonValue } from "@prisma/client/runtime/library";
import { AddSourceDto, SearchSourcesDto } from "./dto";

@Injectable()
export class AiStudioSourceService {
  constructor(private readonly prisma: PrismaService) {}

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

    // Search local database
    if (!dto.sources || dto.sources.includes("local")) {
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
    }

    // For internet search, we'll call the crawler APIs in the controller
    // This service just returns local results

    return {
      results,
      query: dto.query,
      mode: dto.mode || "quick",
    };
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
