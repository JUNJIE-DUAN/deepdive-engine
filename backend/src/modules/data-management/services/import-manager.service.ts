import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { ResourceType, ImportTaskStatus } from "@prisma/client";
import { getErrorMessage } from "../../../common/utils/error.utils";
import {
  MetadataExtractorService,
  ParsedUrlMetadata,
} from "./metadata-extractor.service";
import { DuplicateDetectorService } from "./duplicate-detector.service";
import { ImportTaskProcessorService } from "./import-task-processor.service";

export interface ParseUrlResult {
  domain: string;
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

  constructor(
    private prisma: PrismaService,
    private metadataExtractor: MetadataExtractorService,
    private duplicateDetector: DuplicateDetectorService,
    private importTaskProcessor: ImportTaskProcessorService,
  ) {}

  /**
   * 简单解析URL，仅提取域名
   */
  async parseUrl(url: string): Promise<ParseUrlResult> {
    try {
      // 验证URL格式，只需提取域名即可
      const urlObj = new URL(url);
      const domain = urlObj.hostname || "";

      return {
        domain,
      };
    } catch (error) {
      this.logger.error(`Failed to parse URL: ${getErrorMessage(error)}`);
      throw new Error(`Invalid URL format: ${getErrorMessage(error)}`);
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
        `Created import task: ${task.id} for ${dto.resourceType} from ${sourceDomain}`,
      );
      return task;
    } catch (error) {
      this.logger.error(
        `Failed to create import task: ${getErrorMessage(error)}`,
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
    offset: number = 0,
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
        `Failed to fetch import tasks: ${getErrorMessage(error)}`,
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
        `Failed to fetch import task: ${getErrorMessage(error)}`,
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
    },
  ) {
    try {
      const now = new Date();
      const data: any = {
        status,
        updatedAt: now,
      };

      if (
        status === "SUCCESS" ||
        status === "FAILED" ||
        status === "CANCELLED"
      ) {
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

      this.logger.log(`Updated import task ${taskId} status to ${status}`);
      return task;
    } catch (error) {
      this.logger.error(
        `Failed to update import task: ${getErrorMessage(error)}`,
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
        `Failed to fetch quality metrics: ${getErrorMessage(error)}`,
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
        (m) => m.reviewStatus === "NEEDS_REVIEW",
      ).length;

      return {
        totalItems: metrics.length,
        duplicates,
        avgQuality: Math.round(avgQuality * 100) / 100,
        needsReview,
      };
    } catch (error) {
      this.logger.error(
        `Failed to calculate quality stats: ${getErrorMessage(error)}`,
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
    },
  ) {
    try {
      const existing = await this.prisma.dataQualityMetric.findFirst({
        where: {
          resourceType,
          resourceId,
        },
      });

      if (existing) {
        return await this.prisma.dataQualityMetric.updateMany({
          where: {
            resourceType,
            resourceId,
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
        `Failed to create/update quality metric: ${getErrorMessage(error)}`,
      );
      throw error;
    }
  }

  /**
   * 解析URL并提取完整的元数据（包含重复检测）
   */
  async parseUrlFull(url: string, resourceType: ResourceType) {
    try {
      // 使用MetadataExtractor服务提取元数据
      const metadata = await this.metadataExtractor.extractMetadata(url);

      // 验证元数据的有效性
      const validation = this.metadataExtractor.validateMetadata(metadata);
      if (!validation.isValid) {
        throw new BadRequestException(
          `元数据验证失败: ${validation.errors?.join("; ")}`,
        );
      }

      // 使用DuplicateDetector服务检测重复
      const duplicateDetection = await this.duplicateDetector.detectDuplicates(
        resourceType,
        metadata,
      );

      this.logger.debug(
        `Successfully parsed URL and detected duplicates: ${url}`,
      );

      return { metadata, duplicateDetection };
    } catch (error) {
      this.logger.error(`Failed to parse URL full: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  /**
   * 导入带有编辑后的元数据（用户可编辑）
   */
  async importWithMetadata(
    url: string,
    resourceType: ResourceType,
    metadata: ParsedUrlMetadata,
    _skipDuplicateWarning?: boolean,
  ) {
    try {
      // 创建ImportTask
      const importTask = await this.createImportTask({
        resourceType,
        sourceUrl: url,
        title: metadata.title,
      });

      // 将编辑后的完整元数据存储到ImportTask的metadata字段
      const updated = await this.prisma.importTask.update({
        where: { id: importTask.id },
        data: {
          metadata: metadata as any, // 存储完整的编辑后的元数据
        },
      });

      this.logger.log(`Successfully created import task: ${updated.id}`);

      // 自动处理ImportTask以创建Resource
      // 这样用户就能立即在Explore中看到导入的数据
      try {
        await this.importTaskProcessor.processPendingTasks(1);
        this.logger.log(`Auto-processed import task: ${updated.id}`);
      } catch (processingError) {
        this.logger.warn(
          `Failed to auto-process task ${updated.id}: ${getErrorMessage(processingError)}`,
        );
        // 不抛出错误，因为用户已经看到导入成功，处理可以稍后进行
      }

      return updated;
    } catch (error) {
      this.logger.error(
        `Failed to import with metadata: ${getErrorMessage(error)}`,
      );
      throw error;
    }
  }
}
