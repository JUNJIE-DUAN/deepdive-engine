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
import { CommentsService } from "./comments.service";
import { CreateCommentDto, UpdateCommentDto } from "./dto";

/**
 * 评论控制器
 *
 * API端点：
 * - POST /api/v1/comments - 创建评论
 * - GET /api/v1/comments/resource/:resourceId - 获取资源的评论
 * - GET /api/v1/comments/:id - 获取单个评论
 * - PATCH /api/v1/comments/:id - 更新评论
 * - DELETE /api/v1/comments/:id - 删除评论
 * - POST /api/v1/comments/:id/upvote - 点赞评论
 * - GET /api/v1/comments/resource/:resourceId/stats - 获取评论统计
 */
@Controller("comments")
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  /**
   * 创建评论
   */
  @Post()
  async createComment(@Request() req: any, @Body() dto: CreateCommentDto) {
    // TODO: 从JWT token获取userId
    const userId = req.user?.id || "557be1bd-62cb-4125-a028-5ba740b66aca";
    return this.commentsService.createComment(userId, dto);
  }

  /**
   * 获取资源的评论（树形结构）
   */
  @Get("resource/:resourceId")
  async getResourceComments(@Param("resourceId") resourceId: string) {
    return this.commentsService.getResourceComments(resourceId);
  }

  /**
   * 获取单个评论
   */
  @Get(":id")
  async getComment(@Param("id") id: string) {
    return this.commentsService.getComment(id);
  }

  /**
   * 更新评论
   */
  @Patch(":id")
  async updateComment(
    @Param("id") id: string,
    @Request() req: any,
    @Body() dto: UpdateCommentDto,
  ) {
    // TODO: 从JWT token获取userId
    const userId = req.user?.id || "557be1bd-62cb-4125-a028-5ba740b66aca";
    return this.commentsService.updateComment(id, userId, dto);
  }

  /**
   * 删除评论
   */
  @Delete(":id")
  async deleteComment(@Param("id") id: string, @Request() req: any) {
    // TODO: 从JWT token获取userId
    const userId = req.user?.id || "557be1bd-62cb-4125-a028-5ba740b66aca";
    return this.commentsService.deleteComment(id, userId);
  }

  /**
   * 点赞评论
   */
  @Post(":id/upvote")
  async upvoteComment(@Param("id") id: string) {
    return this.commentsService.upvoteComment(id);
  }

  /**
   * 获取评论统计
   */
  @Get("resource/:resourceId/stats")
  async getCommentStats(@Param("resourceId") resourceId: string) {
    return this.commentsService.getCommentStats(resourceId);
  }
}
