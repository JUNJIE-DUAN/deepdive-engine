import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Logger,
} from "@nestjs/common";
import { ImportManagerService } from "../services/import-manager.service";
import { ImportTaskProcessorService } from "../services/import-task-processor.service";
import { SourceWhitelistService } from "../services/source-whitelist.service";
import { ResourceType } from "@prisma/client";

/**
 * Import Manager Controller
 * 提供导入管理、URL解析和数据质量指标的API端点
 */
@Controller("data-management")
export class ImportManagerController {
  private readonly logger = new Logger(ImportManagerController.name);

  constructor(
    private readonly importManagerService: ImportManagerService,
    private readonly importTaskProcessorService: ImportTaskProcessorService,
    private readonly whitelistService: SourceWhitelistService,
  ) {}

  /**
   * 解析URL元数据
   * POST /api/v1/data-management/parse-url
   */
  @Post("parse-url")
  async parseUrl(
    @Body()
    body: {
      url: string;
      resourceType?: ResourceType;
    },
  ) {
    try {
      if (!body.url) {
        return {
          success: false,
          error: "Missing required field: url",
        };
      }

      // 如果提供了资源类型，验证URL是否在白名单中
      if (body.resourceType) {
        const whitelist = await this.whitelistService.getWhitelist(
          body.resourceType,
        );

        if (whitelist && whitelist.isActive) {
          const allowedDomains = Array.isArray(whitelist.allowedDomains)
            ? whitelist.allowedDomains.filter(
                (d): d is string => typeof d === "string",
              )
            : [];
          const isAllowed = this.validateDomain(body.url, allowedDomains);
          if (!isAllowed) {
            return {
              success: false,
              error: "URL domain not in whitelist for this resource type",
              code: "DOMAIN_NOT_WHITELISTED",
            };
          }
        }
      }

      const parseResult = await this.importManagerService.parseUrl(body.url);

      return {
        success: true,
        data: parseResult,
      };
    } catch (error) {
      this.logger.error(`Error parsing URL: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to parse URL",
      };
    }
  }

  /**
   * 提交导入请求
   * POST /api/v1/data-management/import
   */
  @Post("import")
  async submitImport(
    @Body()
    body: {
      resourceType: ResourceType;
      sourceUrl: string;
      title?: string;
      ruleId?: string;
    },
  ) {
    try {
      if (!body.resourceType || !body.sourceUrl) {
        return {
          success: false,
          error: "Missing required fields: resourceType, sourceUrl",
        };
      }

      // 验证URL在白名单中
      const whitelist = await this.whitelistService.getWhitelist(
        body.resourceType,
      );

      if (whitelist && whitelist.isActive) {
        const allowedDomains = Array.isArray(whitelist.allowedDomains)
          ? whitelist.allowedDomains.filter(
              (d): d is string => typeof d === "string",
            )
          : [];
        const isAllowed = this.validateDomain(body.sourceUrl, allowedDomains);

        if (!isAllowed) {
          return {
            success: false,
            error: "URL domain not in whitelist for this resource type",
            code: "DOMAIN_NOT_WHITELISTED",
          };
        }
      }

      // 创建导入任务
      const task = await this.importManagerService.createImportTask({
        resourceType: body.resourceType,
        sourceUrl: body.sourceUrl,
        title: body.title,
        ruleId: body.ruleId,
      });

      return {
        success: true,
        data: task,
        message: "Import task created successfully",
      };
    } catch (error) {
      this.logger.error(`Error submitting import: ${error}`);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to submit import",
      };
    }
  }

  /**
   * 获取导入任务列表
   * GET /api/v1/data-management/tasks
   */
  @Get("tasks")
  async getTasks(
    @Query("resourceType") resourceType?: ResourceType,
    @Query("status") status?: string,
    @Query("limit") limit: string = "50",
    @Query("offset") offset: string = "0",
  ) {
    try {
      const limitNum = Math.min(Math.max(1, parseInt(limit) || 50), 200);
      const offsetNum = Math.max(0, parseInt(offset) || 0);

      const result = await this.importManagerService.getImportTasks(
        resourceType,
        status as any,
        limitNum,
        offsetNum,
      );

      return {
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          limit: result.limit,
          offset: result.offset,
          hasMore: result.offset + result.limit < result.total,
        },
      };
    } catch (error) {
      this.logger.error(`Error fetching tasks: ${error}`);
      return {
        success: false,
        error: "Failed to fetch import tasks",
        data: [],
      };
    }
  }

  /**
   * 获取特定导入任务
   * GET /api/v1/data-management/tasks/:taskId
   */
  @Get("tasks/:taskId")
  async getTask(@Param("taskId") taskId: string) {
    try {
      const task = await this.importManagerService.getImportTask(taskId);

      if (!task) {
        return {
          success: false,
          error: "Import task not found",
        };
      }

      return {
        success: true,
        data: task,
      };
    } catch (error) {
      this.logger.error(`Error fetching task: ${error}`);
      return {
        success: false,
        error: "Failed to fetch import task",
      };
    }
  }

  /**
   * 获取数据质量指标
   * GET /api/v1/data-management/quality-metrics
   */
  @Get("quality-metrics")
  async getQualityMetrics(@Query("resourceType") resourceType?: ResourceType) {
    try {
      const result =
        await this.importManagerService.getDataQualityMetrics(resourceType);

      return {
        success: true,
        data: result.data,
        stats: result.stats,
      };
    } catch (error) {
      this.logger.error(`Error fetching quality metrics: ${error}`);
      return {
        success: false,
        error: "Failed to fetch quality metrics",
        data: [],
        stats: {
          totalItems: 0,
          duplicates: 0,
          avgQuality: 0,
          needsReview: 0,
        },
      };
    }
  }

  /**
   * 解析URL并提取完整的元数据（包含重复检测）
   * POST /api/v1/data-management/parse-url-full
   */
  @Post("parse-url-full")
  async parseUrlFull(
    @Body()
    body: {
      url: string;
      resourceType: ResourceType;
    },
  ) {
    try {
      if (!body.url || !body.resourceType) {
        return {
          success: false,
          error: "Missing required fields: url, resourceType",
        };
      }

      // 验证URL是否在白名单中
      const whitelist = await this.whitelistService.getWhitelist(
        body.resourceType,
      );

      if (!whitelist || !whitelist.isActive) {
        return {
          success: false,
          error: "Whitelist not found or inactive for this resource type",
        };
      }

      const allowedDomains = Array.isArray(whitelist.allowedDomains)
        ? whitelist.allowedDomains.filter(
            (d): d is string => typeof d === "string",
          )
        : [];

      const isAllowed = this.validateDomain(body.url, allowedDomains);
      if (!isAllowed) {
        return {
          success: false,
          error: "URL domain not in whitelist for this resource type",
          code: "DOMAIN_NOT_WHITELISTED",
        };
      }

      // 使用ImportManagerService的新方法
      const result = await this.importManagerService.parseUrlFull(
        body.url,
        body.resourceType,
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.logger.error(`Error parsing URL full: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to parse URL",
      };
    }
  }

  /**
   * 导入带有编辑后的元数据
   * POST /api/v1/data-management/import-with-metadata
   */
  @Post("import-with-metadata")
  async importWithMetadata(
    @Body()
    body: {
      url: string;
      resourceType: ResourceType;
      metadata: any;
      skipDuplicateWarning?: boolean;
    },
  ) {
    try {
      if (!body.url || !body.resourceType || !body.metadata) {
        return {
          success: false,
          error: "Missing required fields: url, resourceType, metadata",
        };
      }

      // 验证URL是否在白名单中
      const whitelist = await this.whitelistService.getWhitelist(
        body.resourceType,
      );

      if (!whitelist || !whitelist.isActive) {
        return {
          success: false,
          error: "Whitelist not found or inactive for this resource type",
        };
      }

      const allowedDomains = Array.isArray(whitelist.allowedDomains)
        ? whitelist.allowedDomains.filter(
            (d): d is string => typeof d === "string",
          )
        : [];

      const isAllowed = this.validateDomain(body.url, allowedDomains);
      if (!isAllowed) {
        return {
          success: false,
          error: "URL domain not in whitelist for this resource type",
          code: "DOMAIN_NOT_WHITELISTED",
        };
      }

      // 使用ImportManagerService的新方法
      const importTask = await this.importManagerService.importWithMetadata(
        body.url,
        body.resourceType,
        body.metadata,
        body.skipDuplicateWarning,
      );

      return {
        success: true,
        data: {
          taskId: importTask.id,
          status: importTask.status,
          sourceUrl: importTask.sourceUrl,
        },
      };
    } catch (error) {
      this.logger.error(`Error importing with metadata: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to import",
      };
    }
  }

  /**
   * 处理所有待处理的导入任务
   * POST /api/v1/data-management/process-pending
   *
   * 将PENDING状态的ImportTask转换为实际的Resource记录
   */
  @Post("process-pending")
  async processPendingImports(@Query("limit") limit?: string) {
    try {
      const limitNum = limit ? parseInt(limit, 10) : 50;

      const result =
        await this.importTaskProcessorService.processPendingTasks(limitNum);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.logger.error(`Error processing pending imports: ${error}`);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to process pending imports",
      };
    }
  }

  /**
   * 获取导入任务统计
   * GET /api/v1/data-management/task-stats
   *
   * 返回各种状态的ImportTask数量统计
   */
  @Get("task-stats")
  async getTaskStats() {
    try {
      const stats = await this.importTaskProcessorService.getTaskStats();

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      this.logger.error(`Error getting task stats: ${error}`);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to get task stats",
      };
    }
  }

  /**
   * 验证域名是否在白名单中
   */
  private validateDomain(url: string, allowedDomains: string[]): boolean {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;

      return allowedDomains.some((allowed) => {
        if (allowed.startsWith("*.")) {
          // 支持通配符匹配
          const suffix = allowed.substring(2);
          return domain.endsWith(suffix) || domain === suffix.substring(2);
        }
        return domain === allowed;
      });
    } catch {
      return false;
    }
  }
}
