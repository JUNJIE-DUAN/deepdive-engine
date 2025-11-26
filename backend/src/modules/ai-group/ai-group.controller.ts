import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Logger,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { AiGroupService } from "./ai-group.service";
import { AiGroupGateway } from "./ai-group.gateway";
import {
  CreateTopicDto,
  UpdateTopicDto,
  AddMemberDto,
  AddMembersDto,
  UpdateMemberDto,
  AddAIMemberDto,
  UpdateAIMemberDto,
  SendMessageDto,
  AddResourceDto,
  GenerateSummaryDto,
} from "./dto";
import { TopicType, MentionType } from "@prisma/client";

@Controller("topics")
@UseGuards(JwtAuthGuard)
export class AiGroupController {
  private readonly logger = new Logger(AiGroupController.name);

  constructor(
    private readonly aiGroupService: AiGroupService,
    private readonly aiGroupGateway: AiGroupGateway,
  ) {}

  // ==================== Topic CRUD ====================

  @Post()
  async createTopic(@Request() req: any, @Body() dto: CreateTopicDto) {
    return this.aiGroupService.createTopic(req.user.id, dto);
  }

  @Get()
  async getTopics(
    @Request() req: any,
    @Query("type") type?: TopicType,
    @Query("search") search?: string,
  ) {
    return this.aiGroupService.getTopics(req.user.id, { type, search });
  }

  @Get(":topicId")
  async getTopicById(@Request() req: any, @Param("topicId") topicId: string) {
    return this.aiGroupService.getTopicById(topicId, req.user.id);
  }

  @Patch(":topicId")
  async updateTopic(
    @Request() req: any,
    @Param("topicId") topicId: string,
    @Body() dto: UpdateTopicDto,
  ) {
    return this.aiGroupService.updateTopic(topicId, req.user.id, dto);
  }

  @Post(":topicId/archive")
  async archiveTopic(@Request() req: any, @Param("topicId") topicId: string) {
    return this.aiGroupService.archiveTopic(topicId, req.user.id);
  }

  @Delete(":topicId")
  async deleteTopic(@Request() req: any, @Param("topicId") topicId: string) {
    return this.aiGroupService.deleteTopic(topicId, req.user.id);
  }

  // ==================== Member Management ====================

  @Get(":topicId/members")
  async getMembers(@Request() req: any, @Param("topicId") topicId: string) {
    const topic = await this.aiGroupService.getTopicById(topicId, req.user.id);
    return topic.members;
  }

  @Post(":topicId/members")
  async addMember(
    @Request() req: any,
    @Param("topicId") topicId: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.aiGroupService.addMember(topicId, req.user.id, dto);
  }

  @Post(":topicId/members/invite")
  async addMemberByEmail(
    @Request() req: any,
    @Param("topicId") topicId: string,
    @Body() dto: { email: string; role?: string },
  ) {
    return this.aiGroupService.addMemberByEmail(
      topicId,
      req.user.id,
      dto.email,
      dto.role as any,
    );
  }

  @Post(":topicId/members/batch")
  async addMembers(
    @Request() req: any,
    @Param("topicId") topicId: string,
    @Body() dto: AddMembersDto,
  ) {
    return this.aiGroupService.addMembers(topicId, req.user.id, dto);
  }

  @Patch(":topicId/members/:memberId")
  async updateMember(
    @Request() req: any,
    @Param("topicId") topicId: string,
    @Param("memberId") memberId: string,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.aiGroupService.updateMember(
      topicId,
      req.user.id,
      memberId,
      dto,
    );
  }

  @Delete(":topicId/members/:memberId")
  async removeMember(
    @Request() req: any,
    @Param("topicId") topicId: string,
    @Param("memberId") memberId: string,
  ) {
    return this.aiGroupService.removeMember(topicId, req.user.id, memberId);
  }

  @Post(":topicId/leave")
  async leaveTopic(@Request() req: any, @Param("topicId") topicId: string) {
    return this.aiGroupService.leaveTopic(topicId, req.user.id);
  }

  // ==================== AI Member Management ====================

  @Get(":topicId/ai-members")
  async getAIMembers(@Request() req: any, @Param("topicId") topicId: string) {
    const topic = await this.aiGroupService.getTopicById(topicId, req.user.id);
    return topic.aiMembers;
  }

  @Post(":topicId/ai-members")
  async addAIMember(
    @Request() req: any,
    @Param("topicId") topicId: string,
    @Body() dto: AddAIMemberDto,
  ) {
    return this.aiGroupService.addAIMember(topicId, req.user.id, dto);
  }

  @Patch(":topicId/ai-members/:aiMemberId")
  async updateAIMember(
    @Request() req: any,
    @Param("topicId") topicId: string,
    @Param("aiMemberId") aiMemberId: string,
    @Body() dto: UpdateAIMemberDto,
  ) {
    return this.aiGroupService.updateAIMember(
      topicId,
      req.user.id,
      aiMemberId,
      dto,
    );
  }

  @Delete(":topicId/ai-members/:aiMemberId")
  async removeAIMember(
    @Request() req: any,
    @Param("topicId") topicId: string,
    @Param("aiMemberId") aiMemberId: string,
  ) {
    return this.aiGroupService.removeAIMember(topicId, req.user.id, aiMemberId);
  }

  // ==================== Messages ====================

  @Get(":topicId/messages")
  async getMessages(
    @Request() req: any,
    @Param("topicId") topicId: string,
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string,
  ) {
    return this.aiGroupService.getMessages(topicId, req.user.id, {
      cursor,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post(":topicId/messages")
  async sendMessage(
    @Request() req: any,
    @Param("topicId") topicId: string,
    @Body() dto: SendMessageDto,
  ) {
    const message = await this.aiGroupService.sendMessage(
      topicId,
      req.user.id,
      dto,
    );

    if (!message) {
      return null;
    }

    // 通过 WebSocket 广播新消息给所有房间成员
    this.logger.log(`Broadcasting message ${message.id} to topic ${topicId}`);
    this.aiGroupGateway.emitToTopic(topicId, "message:new", message);

    // DEBUG: Log received mentions from frontend
    this.logger.log(
      `[Mentions Debug] Received message with mentions: ${JSON.stringify(dto.mentions || [])}`,
    );

    // 处理 mentions - 向被@的用户发送通知
    if (dto.mentions && dto.mentions.length > 0) {
      this.logger.log(
        `[Mentions Debug] Processing ${dto.mentions.length} mention(s)`,
      );

      // 收集需要响应的 AI 成员 ID（去重）
      const aiMemberIdsToRespond = new Set<string>();

      for (const mention of dto.mentions) {
        this.logger.log(
          `[Mentions Debug] Processing mention: type=${mention.mentionType}, aiMemberId=${mention.aiMemberId}, userId=${mention.userId}`,
        );
        if (mention.mentionType === MentionType.AI && mention.aiMemberId) {
          // @单个AI
          this.logger.log(
            `[Mentions Debug] Adding AI member to respond: ${mention.aiMemberId}`,
          );
          aiMemberIdsToRespond.add(mention.aiMemberId);
        } else if (mention.mentionType === MentionType.ALL_AI) {
          // @All AIs：获取 topic 的所有 AI 成员
          this.logger.log(`@All AIs triggered in topic ${topicId}`);
          const topic = await this.aiGroupService.getTopicById(
            topicId,
            req.user.id,
          );
          if (topic.aiMembers) {
            for (const ai of topic.aiMembers) {
              aiMemberIdsToRespond.add(ai.id);
            }
          }
        } else if (mention.mentionType === MentionType.USER && mention.userId) {
          // @真人用户：向被@用户发送通知
          this.logger.log(
            `User ${req.user.id} mentioned user ${mention.userId} in topic ${topicId}`,
          );
          this.aiGroupGateway.emitToUser(mention.userId, "mention:new", {
            topicId,
            messageId: message.id,
            fromUserId: req.user.id,
            content:
              message.content.length > 100
                ? message.content.substring(0, 100) + "..."
                : message.content,
            timestamp: message.createdAt,
          });
        }
      }

      // 触发所有需要响应的 AI
      for (const aiMemberId of aiMemberIdsToRespond) {
        this.logger.log(`Triggering AI response for ${aiMemberId}`);
        // 通知正在输入
        this.aiGroupGateway.emitToTopic(topicId, "ai:typing", {
          topicId,
          aiMemberId,
        });
        // 生成AI响应（异步）
        this.generateAIResponseInBackground(topicId, req.user.id, aiMemberId);
      }
    }

    return message;
  }

  // 后台生成 AI 响应
  private async generateAIResponseInBackground(
    topicId: string,
    userId: string,
    aiMemberId: string,
  ) {
    const AI_TIMEOUT_MS = 120000; // 2 minutes timeout

    this.logger.log(
      `[AI Response] Starting generation for topic=${topicId}, aiMemberId=${aiMemberId}`,
    );

    try {
      // Wrap the AI call with a timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error("AI response generation timed out")),
          AI_TIMEOUT_MS,
        );
      });

      const aiMessage = await Promise.race([
        this.aiGroupService.generateAIResponse(topicId, userId, aiMemberId, []),
        timeoutPromise,
      ]);

      this.logger.log(
        `[AI Response] Success for topic=${topicId}, messageId=${aiMessage.id}`,
      );
      this.logger.log(
        `[AI Response Debug] Broadcasting message, content length: ${aiMessage.content?.length || 0}`,
      );
      this.logger.log(
        `[AI Response Debug] Content preview: ${aiMessage.content?.substring(0, 100)}...`,
      );

      // 广播AI响应
      this.aiGroupGateway.emitToTopic(topicId, "ai:response", {
        aiMemberId,
        messageId: aiMessage.id,
      });
      this.aiGroupGateway.emitToTopic(topicId, "message:new", aiMessage);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(
        `[AI Response] Error for topic=${topicId}, aiMemberId=${aiMemberId}: ${errorMessage}`,
      );
      // Always emit error to clear typing indicator
      this.aiGroupGateway.emitToTopic(topicId, "ai:error", {
        aiMemberId,
        error: errorMessage,
      });
    }
  }

  @Delete(":topicId/messages/:messageId")
  async deleteMessage(
    @Request() req: any,
    @Param("topicId") topicId: string,
    @Param("messageId") messageId: string,
  ) {
    return this.aiGroupService.deleteMessage(topicId, req.user.id, messageId);
  }

  @Post(":topicId/messages/:messageId/reactions")
  async addReaction(
    @Request() req: any,
    @Param("topicId") topicId: string,
    @Param("messageId") messageId: string,
    @Body("emoji") emoji: string,
  ) {
    return this.aiGroupService.addReaction(
      topicId,
      req.user.id,
      messageId,
      emoji,
    );
  }

  @Delete(":topicId/messages/:messageId/reactions/:emoji")
  async removeReaction(
    @Request() req: any,
    @Param("topicId") topicId: string,
    @Param("messageId") messageId: string,
    @Param("emoji") emoji: string,
  ) {
    return this.aiGroupService.removeReaction(
      topicId,
      req.user.id,
      messageId,
      emoji,
    );
  }

  @Post(":topicId/read")
  async markAsRead(
    @Request() req: any,
    @Param("topicId") topicId: string,
    @Body("messageId") messageId?: string,
  ) {
    return this.aiGroupService.markAsRead(topicId, req.user.id, messageId);
  }

  // ==================== AI Response ====================

  @Post(":topicId/ai/generate")
  async generateAIResponse(
    @Request() req: any,
    @Param("topicId") topicId: string,
    @Body("aiMemberId") aiMemberId: string,
    @Body("contextMessageIds") contextMessageIds?: string[],
  ) {
    return this.aiGroupService.generateAIResponse(
      topicId,
      req.user.id,
      aiMemberId,
      contextMessageIds || [],
    );
  }

  // ==================== Resources ====================

  @Get(":topicId/resources")
  async getResources(@Request() req: any, @Param("topicId") topicId: string) {
    return this.aiGroupService.getResources(topicId, req.user.id);
  }

  @Post(":topicId/resources")
  async addResource(
    @Request() req: any,
    @Param("topicId") topicId: string,
    @Body() dto: AddResourceDto,
  ) {
    return this.aiGroupService.addResource(topicId, req.user.id, dto);
  }

  @Delete(":topicId/resources/:resourceId")
  async removeResource(
    @Request() req: any,
    @Param("topicId") topicId: string,
    @Param("resourceId") resourceId: string,
  ) {
    return this.aiGroupService.removeResource(topicId, req.user.id, resourceId);
  }

  // ==================== Summaries ====================

  @Get(":topicId/summaries")
  async getSummaries(@Request() req: any, @Param("topicId") topicId: string) {
    return this.aiGroupService.getSummaries(topicId, req.user.id);
  }

  @Post(":topicId/summaries")
  async generateSummary(
    @Request() req: any,
    @Param("topicId") topicId: string,
    @Body() dto: GenerateSummaryDto,
  ) {
    return this.aiGroupService.generateSummary(topicId, req.user.id, dto);
  }

  @Delete(":topicId/summaries/:summaryId")
  async deleteSummary(
    @Request() req: any,
    @Param("topicId") topicId: string,
    @Param("summaryId") summaryId: string,
  ) {
    return this.aiGroupService.deleteSummary(topicId, req.user.id, summaryId);
  }
}

// Separate controller for user search to avoid route conflicts
@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly aiGroupService: AiGroupService) {}

  @Get("search")
  async searchUsers(
    @Query("email") email?: string,
    @Query("query") query?: string,
    @Query("limit") limit?: string,
  ) {
    if (email) {
      return this.aiGroupService.searchUserByEmail(email);
    }
    if (query) {
      return this.aiGroupService.searchUsers(
        query,
        limit ? parseInt(limit) : 10,
      );
    }
    return [];
  }
}
