import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  Logger,
} from "@nestjs/common";
import { AdminService } from "./admin.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { AdminGuard } from "../../common/guards/admin.guard";
import { AiChatService } from "../ai/ai-chat.service";

/**
 * 管理员控制器
 * 所有接口都需要管理员权限
 */
@Controller("admin")
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    private adminService: AdminService,
    private aiChatService: AiChatService,
  ) {}

  /**
   * 获取所有用户
   * GET /api/v1/admin/users
   */
  @Get("users")
  async getUsers(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
  ) {
    this.logger.log(`Admin: Fetching users (page=${page}, search=${search})`);
    return this.adminService.getAllUsers(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      search,
    );
  }

  /**
   * 获取系统统计信息
   * GET /api/v1/admin/stats
   */
  @Get("stats")
  async getStats() {
    this.logger.log("Admin: Fetching system stats");
    return this.adminService.getSystemStats();
  }

  /**
   * 删除资源
   * DELETE /api/v1/admin/resources/:id
   */
  @Delete("resources/:id")
  async deleteResource(@Param("id") id: string) {
    this.logger.log(`Admin: Deleting resource ${id}`);
    return this.adminService.deleteResource(id);
  }

  /**
   * 批量删除资源
   * DELETE /api/v1/admin/resources
   */
  @Delete("resources")
  async deleteResources(@Body("ids") ids: string[]) {
    this.logger.log(`Admin: Batch deleting ${ids.length} resources`);
    return this.adminService.deleteResources(ids);
  }

  /**
   * 更新用户角色
   * PATCH /api/v1/admin/users/:id/role
   */
  @Patch("users/:id/role")
  async updateUserRole(
    @Param("id") id: string,
    @Body("role") role: "USER" | "ADMIN",
  ) {
    this.logger.log(`Admin: Updating user ${id} role to ${role}`);
    return this.adminService.updateUserRole(id, role);
  }

  /**
   * 禁用/启用用户
   * PATCH /api/v1/admin/users/:id/status
   */
  @Patch("users/:id/status")
  async toggleUserStatus(
    @Param("id") id: string,
    @Body("isActive") isActive: boolean,
  ) {
    this.logger.log(
      `Admin: Updating user ${id} status to ${isActive ? "active" : "inactive"}`,
    );
    return this.adminService.toggleUserStatus(id, isActive);
  }

  // ============ AI Model Management ============

  /**
   * 获取所有AI模型
   * GET /api/v1/admin/ai-models
   */
  @Get("ai-models")
  async getAIModels() {
    this.logger.log("Admin: Fetching AI models");
    return this.adminService.getAllAIModels();
  }

  /**
   * 获取单个AI模型
   * GET /api/v1/admin/ai-models/:id
   */
  @Get("ai-models/:id")
  async getAIModel(@Param("id") id: string) {
    this.logger.log(`Admin: Fetching AI model ${id}`);
    return this.adminService.getAIModel(id);
  }

  /**
   * 创建AI模型
   * POST /api/v1/admin/ai-models
   */
  @Post("ai-models")
  async createAIModel(
    @Body()
    body: {
      name: string;
      displayName: string;
      provider: string;
      modelId: string;
      icon: string;
      color: string;
      apiEndpoint: string;
      apiKey?: string;
      maxTokens?: number;
      temperature?: number;
      description?: string;
    },
  ) {
    this.logger.log(`Admin: Creating AI model ${body.name}`);
    return this.adminService.createAIModel(body);
  }

  /**
   * 更新AI模型
   * PATCH /api/v1/admin/ai-models/:id
   */
  @Patch("ai-models/:id")
  async updateAIModel(
    @Param("id") id: string,
    @Body()
    body: {
      displayName?: string;
      provider?: string;
      modelId?: string;
      icon?: string;
      color?: string;
      apiEndpoint?: string;
      apiKey?: string;
      maxTokens?: number;
      temperature?: number;
      description?: string;
      isEnabled?: boolean;
    },
  ) {
    this.logger.log(`Admin: Updating AI model ${id}`);
    return this.adminService.updateAIModel(id, body);
  }

  /**
   * 设置默认AI模型
   * POST /api/v1/admin/ai-models/:id/set-default
   */
  @Post("ai-models/:id/set-default")
  async setDefaultAIModel(@Param("id") id: string) {
    this.logger.log(`Admin: Setting default AI model ${id}`);
    return this.adminService.setDefaultAIModel(id);
  }

  /**
   * 删除AI模型
   * DELETE /api/v1/admin/ai-models/:id
   */
  @Delete("ai-models/:id")
  async deleteAIModel(@Param("id") id: string) {
    this.logger.log(`Admin: Deleting AI model ${id}`);
    return this.adminService.deleteAIModel(id);
  }

  /**
   * 测试AI模型连接
   * POST /api/v1/admin/ai-models/:id/test
   */
  @Post("ai-models/:id/test")
  async testAIModelConnection(@Param("id") id: string) {
    this.logger.log(`Admin: Testing AI model connection ${id}`);

    // 获取模型配置
    const model = await this.adminService.getAIModel(id);

    // 获取真实的 API Key（getAIModel 返回的是掩码 "***configured***"）
    const apiKey = await this.adminService.getAIModelApiKey(id);

    // 检查是否有 API Key
    if (!apiKey) {
      return {
        modelId: id,
        modelName: model.name,
        displayName: model.displayName,
        success: false,
        message: "API key is not configured for this model",
        latency: 0,
      };
    }

    // 使用数据库中的真实 API Key 测试连接
    const result = await this.aiChatService.testModelConnectionWithKey(
      model.provider,
      model.modelId,
      apiKey,
      model.apiEndpoint,
    );

    return {
      modelId: id,
      modelName: model.name,
      displayName: model.displayName,
      ...result,
    };
  }

  /**
   * 获取提供商可用的模型列表
   * POST /api/v1/admin/ai-models/fetch-available
   */
  @Post("ai-models/fetch-available")
  async fetchAvailableModels(
    @Body()
    body: {
      provider: string;
      apiKey: string;
      apiEndpoint?: string;
    },
  ) {
    this.logger.log(`Admin: Fetching available models for ${body.provider}`);
    return this.aiChatService.fetchAvailableModels(
      body.provider,
      body.apiKey,
      body.apiEndpoint,
    );
  }
}
