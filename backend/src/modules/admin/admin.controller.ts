import {
  Controller,
  Get,
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

/**
 * 管理员控制器
 * 所有接口都需要管理员权限
 */
@Controller("admin")
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(private adminService: AdminService) {}

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
}
