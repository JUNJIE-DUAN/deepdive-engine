import { Controller, Get, Post, Body, Param, Query, Logger } from "@nestjs/common";
import { ImportManagerService } from "../services/import-manager.service";
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
    private readonly whitelistService: SourceWhitelistService
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
    }
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
          body.resourceType
        );

        if (whitelist && whitelist.isActive) {
          const allowedDomains = Array.isArray(whitelist.allowedDomains)
            ? whitelist.allowedDomains.filter((d): d is string => typeof d === 'string')
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
    }
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
        body.resourceType
      );

      if (whitelist && whitelist.isActive) {
        const allowedDomains = Array.isArray(whitelist.allowedDomains)
          ? whitelist.allowedDomains.filter((d): d is string => typeof d === 'string')
          : [];
        const isAllowed = this.validateDomain(
          body.sourceUrl,
          allowedDomains
        );

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
        error: error instanceof Error ? error.message : "Failed to submit import",
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
    @Query("offset") offset: string = "0"
  ) {
    try {
      const limitNum = Math.min(Math.max(1, parseInt(limit) || 50), 200);
      const offsetNum = Math.max(0, parseInt(offset) || 0);

      const result = await this.importManagerService.getImportTasks(
        resourceType,
        status as any,
        limitNum,
        offsetNum
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
      const result = await this.importManagerService.getDataQualityMetrics(
        resourceType
      );

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
