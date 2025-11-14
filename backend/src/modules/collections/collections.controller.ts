import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Request,
} from "@nestjs/common";
import { CollectionsService } from "./collections.service";
import {
  CreateCollectionDto,
  UpdateCollectionDto,
  AddToCollectionDto,
  UpdateNoteDto,
} from "./dto";
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * 收藏系统控制器
 */
@Controller("collections")
// @UseGuards(JwtAuthGuard) // TODO: Enable when auth is ready
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  /**
   * 创建收藏集
   */
  @Post()
  async createCollection(
    @Request() req: any,
    @Body() dto: CreateCollectionDto,
  ) {
    // TODO: Get userId from JWT token
    const userId = req.user?.id || "557be1bd-62cb-4125-a028-5ba740b66aca";
    return this.collectionsService.createCollection(userId, dto);
  }

  /**
   * 获取用户的所有收藏集
   */
  @Get()
  async getUserCollections(@Request() req: any) {
    // TODO: Get userId from JWT token
    const userId = req.user?.id || "557be1bd-62cb-4125-a028-5ba740b66aca";
    return this.collectionsService.getUserCollections(userId);
  }

  /**
   * 获取单个收藏集详情
   */
  @Get(":id")
  async getCollection(@Param("id") id: string, @Request() req: any) {
    const userId = req.user?.id;
    return this.collectionsService.getCollection(id, userId);
  }

  /**
   * 更新收藏集
   */
  @Patch(":id")
  async updateCollection(
    @Param("id") id: string,
    @Request() req: any,
    @Body() dto: UpdateCollectionDto,
  ) {
    const userId = req.user?.id || "557be1bd-62cb-4125-a028-5ba740b66aca";
    return this.collectionsService.updateCollection(id, userId, dto);
  }

  /**
   * 删除收藏集
   */
  @Delete(":id")
  async deleteCollection(@Param("id") id: string, @Request() req: any) {
    const userId = req.user?.id || "557be1bd-62cb-4125-a028-5ba740b66aca";
    return this.collectionsService.deleteCollection(id, userId);
  }

  /**
   * 添加资源到收藏集
   */
  @Post(":id/items")
  async addToCollection(
    @Param("id") id: string,
    @Request() req: any,
    @Body() dto: AddToCollectionDto,
  ) {
    const userId = req.user?.id || "557be1bd-62cb-4125-a028-5ba740b66aca";
    return this.collectionsService.addToCollection(id, userId, dto);
  }

  /**
   * 从收藏集移除资源
   */
  @Delete(":id/items/:resourceId")
  async removeFromCollection(
    @Param("id") id: string,
    @Param("resourceId") resourceId: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id || "557be1bd-62cb-4125-a028-5ba740b66aca";
    return this.collectionsService.removeFromCollection(id, resourceId, userId);
  }

  /**
   * 更新收藏项笔记
   */
  @Patch(":id/items/:resourceId/note")
  async updateNote(
    @Param("id") id: string,
    @Param("resourceId") resourceId: string,
    @Request() req: any,
    @Body() dto: UpdateNoteDto,
  ) {
    const userId = req.user?.id || "557be1bd-62cb-4125-a028-5ba740b66aca";
    return this.collectionsService.updateCollectionItemNote(
      id,
      resourceId,
      userId,
      dto.note,
    );
  }

  /**
   * 检查资源是否已收藏
   */
  @Get("check/:resourceId")
  async checkResource(
    @Param("resourceId") resourceId: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id || "557be1bd-62cb-4125-a028-5ba740b66aca";
    return this.collectionsService.isResourceInUserCollections(
      userId,
      resourceId,
    );
  }
}
