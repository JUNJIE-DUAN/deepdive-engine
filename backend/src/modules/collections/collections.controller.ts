import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
  UnauthorizedException,
} from "@nestjs/common";
import { CollectionsService } from "./collections.service";
import {
  CreateCollectionDto,
  UpdateCollectionDto,
  AddToCollectionDto,
  UpdateNoteDto,
} from "./dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "../../common/guards/optional-jwt-auth.guard";

/**
 * 收藏系统控制器
 *
 * 安全说明：
 * - 所有修改操作（POST/PATCH/DELETE）需要强制认证
 * - 查询操作根据公开性决定是否需要认证
 */
@Controller("collections")
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  /**
   * 创建收藏集（需要认证）
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async createCollection(
    @Request() req: any,
    @Body() dto: CreateCollectionDto,
  ) {
    if (!req.user?.id) {
      throw new UnauthorizedException("User authentication required");
    }
    return this.collectionsService.createCollection(req.user.id, dto);
  }

  /**
   * 获取用户的所有收藏集（需要认证）
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async getUserCollections(@Request() req: any) {
    if (!req.user?.id) {
      throw new UnauthorizedException("User authentication required");
    }
    return this.collectionsService.getUserCollections(req.user.id);
  }

  /**
   * 获取单个收藏集详情
   * 公开收藏集可以不登录查看，私有收藏集需要认证且验证权限
   */
  @Get(":id")
  @UseGuards(OptionalJwtAuthGuard)
  async getCollection(@Param("id") id: string, @Request() req: any) {
    const userId = req.user?.id;
    return this.collectionsService.getCollection(id, userId);
  }

  /**
   * 更新收藏集（需要认证）
   */
  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  async updateCollection(
    @Param("id") id: string,
    @Request() req: any,
    @Body() dto: UpdateCollectionDto,
  ) {
    if (!req.user?.id) {
      throw new UnauthorizedException("User authentication required");
    }
    return this.collectionsService.updateCollection(id, req.user.id, dto);
  }

  /**
   * 删除收藏集（需要认证）
   */
  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  async deleteCollection(@Param("id") id: string, @Request() req: any) {
    if (!req.user?.id) {
      throw new UnauthorizedException("User authentication required");
    }
    return this.collectionsService.deleteCollection(id, req.user.id);
  }

  /**
   * 添加资源到收藏集（需要认证）
   */
  @Post(":id/items")
  @UseGuards(JwtAuthGuard)
  async addToCollection(
    @Param("id") id: string,
    @Request() req: any,
    @Body() dto: AddToCollectionDto,
  ) {
    if (!req.user?.id) {
      throw new UnauthorizedException("User authentication required");
    }
    return this.collectionsService.addToCollection(id, req.user.id, dto);
  }

  /**
   * 从收藏集移除资源（需要认证）
   */
  @Delete(":id/items/:resourceId")
  @UseGuards(JwtAuthGuard)
  async removeFromCollection(
    @Param("id") id: string,
    @Param("resourceId") resourceId: string,
    @Request() req: any,
  ) {
    if (!req.user?.id) {
      throw new UnauthorizedException("User authentication required");
    }
    return this.collectionsService.removeFromCollection(
      id,
      resourceId,
      req.user.id,
    );
  }

  /**
   * 更新收藏项笔记（需要认证）
   */
  @Patch(":id/items/:resourceId/note")
  @UseGuards(JwtAuthGuard)
  async updateNote(
    @Param("id") id: string,
    @Param("resourceId") resourceId: string,
    @Request() req: any,
    @Body() dto: UpdateNoteDto,
  ) {
    if (!req.user?.id) {
      throw new UnauthorizedException("User authentication required");
    }
    return this.collectionsService.updateCollectionItemNote(
      id,
      resourceId,
      req.user.id,
      dto.note,
    );
  }

  /**
   * 检查资源是否已收藏（需要认证）
   */
  @Get("check/:resourceId")
  @UseGuards(JwtAuthGuard)
  async checkResource(
    @Param("resourceId") resourceId: string,
    @Request() req: any,
  ) {
    if (!req.user?.id) {
      throw new UnauthorizedException("User authentication required");
    }
    return this.collectionsService.isResourceInUserCollections(
      req.user.id,
      resourceId,
    );
  }
}
