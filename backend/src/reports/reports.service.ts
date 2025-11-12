import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../common/prisma/prisma.service";
import { GenerateReportDto } from "./dto/generate-report.dto";
import axios from "axios";

interface ReportSection {
  title: string;
  content: string;
}

interface AIReportResponse {
  title: string;
  summary: string;
  sections: ReportSection[];
  metadata?: Record<string, any>;
}

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 生成报告
   */
  async generateReport(dto: GenerateReportDto) {
    const templateId = dto.templateId ?? dto.template;

    if (!templateId) {
      throw new BadRequestException("templateId is required");
    }

    const template = await this.prisma.reportTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new BadRequestException("Invalid templateId");
    }

    if (dto.taskId) {
      return this.generateReportFromWorkspaceTask(dto, template);
    }

    if (!dto.resourceIds || dto.resourceIds.length < 2 || dto.resourceIds.length > 10) {
      throw new BadRequestException("Please select 2-10 resources");
    }

    return this.generateReportFromResources(dto, template);
  }

  /**
   * 与资源对话
   */
  async chatWithResources(dto: any) {
    try {
      const aiServiceUrl =
        process.env.AI_SERVICE_URL || "http://localhost:5000";

      const response = await axios.post(`${aiServiceUrl}/api/v1/ai/chat`, dto, {
        timeout: 60000, // 1 minute timeout
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new BadRequestException(
          `AI chat failed: ${error.response?.data?.detail || error.message}`,
        );
      }
      throw error;
    }
  }

  /**
   * 获取单个报告
   */
  async findOne(id: string, userId?: string) {
    const report = await this.prisma.report.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!report) {
      throw new NotFoundException("Report not found");
    }

    // 如果提供了userId，验证权限
    if (userId && report.userId !== userId) {
      throw new NotFoundException("Report not found");
    }

    // 获取关联的资源
    let resources: any[] = [];
    if (Array.isArray(report.resourceIds) && report.resourceIds.length > 0) {
      resources = await this.prisma.resource.findMany({
        where: {
          id: {
            in: report.resourceIds as string[],
          },
        },
        select: {
          id: true,
          type: true,
          title: true,
          abstract: true,
          authors: true,
          publishedAt: true,
          thumbnailUrl: true,
          sourceUrl: true,
          pdfUrl: true,
          tags: true,
        },
      });
    }

    return {
      ...report,
      resources,
    };
  }

  /**
   * 获取用户的所有报告
   */
  async findByUser(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          template: true,
          templateName: true,
          templateIcon: true,
          summary: true,
          resourceCount: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.report.count({
        where: { userId },
      }),
    ]);

    return {
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 删除报告
   */
  async delete(id: string, userId: string) {
    const report = await this.prisma.report.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!report) {
      throw new NotFoundException("Report not found");
    }

    if (report.userId !== userId) {
      throw new BadRequestException("Unauthorized");
    }

    await this.prisma.report.delete({
      where: { id },
    });

    return { message: "Report deleted successfully" };
}

  private async generateReportFromResources(
    dto: GenerateReportDto,
    template: { id: string; name: string; category: string; promptConfig: any; version: number },
  ) {
    const resources = await this.prisma.resource.findMany({
      where: {
        id: { in: dto.resourceIds as string[] },
      },
      select: {
        id: true,
        type: true,
        title: true,
        abstract: true,
        authors: true,
        publishedAt: true,
        tags: true,
        pdfUrl: true,
        sourceUrl: true,
      },
    });

    if (resources.length !== (dto.resourceIds as string[]).length) {
      throw new BadRequestException("Some resources not found");
    }

    const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:5000";
    const model = dto.model ?? 'gpt-4';

    let aiReport: AIReportResponse;
    try {
      const response = await axios.post(
        `${aiServiceUrl}/api/v1/ai/generate-report`,
        {
          resources: resources.map((r) => ({
            id: r.id,
            title: r.title,
            abstract: r.abstract,
            authors: r.authors,
            published_date: r.publishedAt,
            tags: r.tags,
            type: r.type,
          })),
          template: template.category,
          model,
        },
        { timeout: 120000 },
      );

      aiReport = response.data;
    } catch (error) {
      console.error("AI service error:", error);
      throw new BadRequestException("Failed to generate report. Please try again.");
    }

    return this.prisma.report.create({
      data: {
        userId: dto.userId,
        title: dto.title ?? aiReport.title,
        template: template.id,
        templateName: template.name,
        templateIcon: this.getTemplateIcon(template.category),
        summary: aiReport.summary,
        sections: aiReport.sections as any,
        resourceIds: dto.resourceIds as any,
        resourceCount: dto.resourceIds?.length ?? 0,
        metadata: {
          model,
          generatedAt: new Date().toISOString(),
          templateVersion: template.version,
          ...aiReport.metadata,
        } as any,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  private async generateReportFromWorkspaceTask(
    dto: GenerateReportDto,
    template: { id: string; name: string; version: number; category: string },
  ) {
    const task = await this.prisma.workspaceTask.findUnique({
      where: { id: dto.taskId as string },
      include: {
        workspace: {
          select: {
            id: true,
            userId: true,
            resources: {
              select: {
                resourceId: true,
              },
            },
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException("Workspace task not found");
    }
    if (task.workspace.userId !== dto.userId) {
      throw new ForbiddenException("Unauthorized to access workspace task");
    }
    if (!task.result) {
      throw new BadRequestException("任务尚未完成或没有有效结果");
    }

    const resourceIds = task.workspace.resources.map((item) => item.resourceId);

    const sections = this.buildSectionsFromResult(task.result);
    const summary = this.extractSummary(task.result, dto.notes);

    return this.prisma.report.create({
      data: {
        userId: dto.userId,
        title: dto.title ?? template.name,
        template: template.id,
        templateName: template.name,
        templateIcon: this.getTemplateIcon(template.category),
        summary,
        sections,
        resourceIds: resourceIds as any,
        resourceCount: resourceIds.length,
        metadata: {
          model: task.model,
          generatedAt: new Date().toISOString(),
          templateVersion: template.version,
          workspaceId: task.workspaceId,
          taskId: task.id,
          rawResult: task.result,
        } as any,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  private buildSectionsFromResult(result: any): Prisma.InputJsonValue {
    if (result && Array.isArray(result.sections)) {
      const valid = result.sections.every(
        (section: any) =>
          typeof section === "object" &&
          typeof section.title === "string" &&
          typeof section.content === "string",
      );
      if (valid) {
        return result.sections as Prisma.InputJsonValue;
      }
    }

    return [
      {
        title: "AI Output",
        content: `\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``,
      },
    ] as Prisma.InputJsonValue;
  }

  private extractSummary(result: any, fallback?: string): string {
    if (result && typeof result.summary === "string") {
      return result.summary;
    }
    if (result && typeof result.overview === "string") {
      return result.overview;
    }
    return fallback ?? "AI 自动生成的报告摘要";
  }

  private getTemplateIcon(category: string): string {
    switch (category) {
      case "comparison":
        return "📊";
      case "summary":
        return "📘";
      case "insights":
        return "💡";
      case "relationship":
        return "🔗";
      default:
        return "🧩";
    }
  }
}
