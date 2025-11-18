import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { ResourceType, ImportTaskStatus } from "@prisma/client";
import { getErrorMessage } from "../../../common/utils/error.utils";

export interface ParseUrlResult {
  title?: string;
  domain: string;
  description?: string;
  language?: string;
  charset?: string;
}

interface CreateImportTaskDto {
  resourceType: ResourceType;
  sourceUrl: string;
  title?: string;
  ruleId?: string;
}

/**
 * Import Manager Service
 * 负责处理URL解析、导入任务创建和管理
 */
@Injectable()
export class ImportManagerService {
  private readonly logger = new Logger(ImportManagerService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 解析URL提取元数据
   */
  async parseUrl(url: string): Promise<ParseUrlResult> {
    try {
      // 验证URL格式
      const urlObj = new URL(url);
      const domain = urlObj.hostname;

      // 尝试获取页面元数据（简单实现）
      // 在生产环境中应该使用专门的库如 cheerio、jsdom 或 open-graph-scraper
      const title = this.extractTitleFromUrl(url);
      const description = this.extractDescriptionFromUrl(url);

      return {
        title,
        domain,
        description,
        language: "en",
        charset: "utf-8",
      };
    } catch (error) {
      this.logger.error(`Failed to parse URL: ${getErrorMessage(error)}`);
      throw new Error(`Invalid URL or unable to parse: ${getErrorMessage(error)}`);
    }
  }

  /**
   * 从URL提取标题（简单实现）
   */
  private extractTitleFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      // 获取路径的最后部分作为标题
      const parts = pathname.split("/").filter((p) => p);
      const lastPart = parts[parts.length - 1] || urlObj.hostname;
      return lastPart.replace(/[-_]/g, " ");
    } catch {
      return "Untitled";
    }
  }

  /**
   * 从URL提取描述（简单实现）
   */
  private extractDescriptionFromUrl(url: string): string | undefined {
    try {
      const urlObj = new URL(url);
      const searchParams = new URLSearchParams(urlObj.search);
      const query = searchParams.get("q") || searchParams.get("search");
      if (query) {
        return `Search or content related to: ${query}`;
      }
      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * 创建导入任务
   */
  async createImportTask(dto: CreateImportTaskDto) {
    try {
      // 提取域名
      const urlObj = new URL(dto.sourceUrl);
      const sourceDomain = urlObj.hostname;

      const task = await this.prisma.importTask.create({
        data: {
          resourceType: dto.resourceType,
          sourceUrl: dto.sourceUrl,
          sourceDomain,
          status: "PENDING" as ImportTaskStatus,
          ruleId: dto.ruleId,
          metadata: {
            title: dto.title,
            createdBy: "manual_import",
            timestamp: new Date().toISOString(),
          },
        },
      });

      this.logger.log(
        `Created import task: ${task.id} for ${dto.resourceType} from ${sourceDomain}`
      );
      return task;
    } catch (error) {
      this.logger.error(
        `Failed to create import task: ${getErrorMessage(error)}`
      );
      throw error;
    }
  }

  /**
   * 获取导入任务列表
   */
  async getImportTasks(
    resourceType?: ResourceType,
    status?: ImportTaskStatus,
    limit: number = 50,
    offset: number = 0
  ) {
    try {
      const where: any = {};

      if (resourceType) {
        where.resourceType = resourceType;
      }

      if (status) {
        where.status = status;
      }

      const [tasks, total] = await Promise.all([
        this.prisma.importTask.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: limit,
          skip: offset,
        }),
        this.prisma.importTask.count({ where }),
      ]);

      return {
        data: tasks,
        total,
        limit,
        offset,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch import tasks: ${getErrorMessage(error)}`
      );
      throw error;
    }
  }

  /**
   * 获取特定导入任务
   */
  async getImportTask(taskId: string) {
    try {
      const task = await this.prisma.importTask.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        this.logger.warn(`Import task not found: ${taskId}`);
        return null;
      }

      return task;
    } catch (error) {
      this.logger.error(
        `Failed to fetch import task: ${getErrorMessage(error)}`
      );
      throw error;
    }
  }

  /**
   * 更新导入任务状态
   */
  async updateImportTaskStatus(
    taskId: string,
    status: ImportTaskStatus,
    updates?: {
      itemsProcessed?: number;
      itemsSaved?: number;
      itemsRejected?: number;
      duplicatesFound?: number;
      errorMessage?: string;
      executionTimeMs?: number;
    }
  ) {
    try {
      const now = new Date();
      const data: any = {
        status,
        updatedAt: now,
      };

      if (status === "SUCCESS" || status === "FAILED" || status === "CANCELLED") {
        data.completedAt = now;
      }

      if (status === "PROCESSING") {
        data.startedAt = now;
      }

      // 合并其他更新
      if (updates) {
        Object.assign(data, updates);
      }

      const task = await this.prisma.importTask.update({
        where: { id: taskId },
        data,
      });

      this.logger.log(
        `Updated import task ${taskId} status to ${status}`
      );
      return task;
    } catch (error) {
      this.logger.error(
        `Failed to update import task: ${getErrorMessage(error)}`
      );
      throw error;
    }
  }

  /**
   * 获取数据质量指标
   */
  async getDataQualityMetrics(resourceType?: ResourceType) {
    try {
      const where: any = {};

      if (resourceType) {
        where.resourceType = resourceType;
      }

      const [metrics, stats] = await Promise.all([
        this.prisma.dataQualityMetric.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: 100,
        }),
        this.getQualityStats(resourceType),
      ]);

      return {
        data: metrics,
        stats,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch quality metrics: ${getErrorMessage(error)}`
      );
      throw error;
    }
  }

  /**
   * 获取质量统计信息
   */
  private async getQualityStats(resourceType?: ResourceType) {
    try {
      const where: any = {};

      if (resourceType) {
        where.resourceType = resourceType;
      }

      const metrics = await this.prisma.dataQualityMetric.findMany({
        where,
      });

      if (metrics.length === 0) {
        return {
          totalItems: 0,
          duplicates: 0,
          avgQuality: 0,
          needsReview: 0,
        };
      }

      const duplicates = metrics.filter((m) => m.isDuplicate).length;
      const avgQuality =
        metrics.reduce((sum, m) => sum + m.qualityScore, 0) / metrics.length;
      const needsReview = metrics.filter(
        (m) => m.reviewStatus === "NEEDS_REVIEW"
      ).length;

      return {
        totalItems: metrics.length,
        duplicates,
        avgQuality: Math.round(avgQuality * 100) / 100,
        needsReview,
      };
    } catch (error) {
      this.logger.error(
        `Failed to calculate quality stats: ${getErrorMessage(error)}`
      );
      return {
        totalItems: 0,
        duplicates: 0,
        avgQuality: 0,
        needsReview: 0,
      };
    }
  }

  /**
   * 创建或更新数据质量指标
   */
  async createOrUpdateQualityMetric(
    resourceType: ResourceType,
    resourceId: string,
    qualityData: {
      qualityScore?: number;
      completenessScore?: number;
      relevanceScore?: number;
      duplicateScore?: number;
      isDuplicate?: boolean;
      reviewStatus?: string;
      sourceUrl?: string;
      tags?: string[];
    }
  ) {
    try {
      const existing = await this.prisma.dataQualityMetric.findUnique({
        where: {
          resourceType_resourceId: {
            resourceType,
            resourceId,
          },
        },
      });

      if (existing) {
        return await this.prisma.dataQualityMetric.update({
          where: {
            resourceType_resourceId: {
              resourceType,
              resourceId,
            },
          },
          data: {
            ...qualityData,
            updatedAt: new Date(),
          },
        });
      }

      return await this.prisma.dataQualityMetric.create({
        data: {
          resourceType,
          resourceId,
          ...qualityData,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to create/update quality metric: ${getErrorMessage(error)}`
      );
      throw error;
    }
  }
}
