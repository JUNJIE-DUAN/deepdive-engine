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
  ForwardMessagesDto,
  BookmarkMessageDto,
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

  /**
   * 红蓝思辨快捷创建 API
   * 一键设置两个 AI 成员进行辩论
   */
  @Post(":topicId/ai-members/debate")
  async setupDebate(
    @Request() req: any,
    @Param("topicId") topicId: string,
    @Body()
    dto: {
      redAiModel: string; // 红方使用的模型，如 "grok-3"
      blueAiModel: string; // 蓝方使用的模型，如 "gpt-5.1"
      topic?: string; // 辩论主题（可选，用于自定义 prompt）
    },
  ) {
    return this.aiGroupService.setupDebateAIs(
      topicId,
      req.user.id,
      dto.redAiModel,
      dto.blueAiModel,
      dto.topic,
    );
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

    // 处理 mentions - 向被@的用户发送通知
    if (dto.mentions && dto.mentions.length > 0) {
      // 收集需要响应的 AI 成员（保留顺序）
      const aiMembersToRespond: Array<{ id: string; displayName: string }> = [];
      const aiMemberIdsSet = new Set<string>();

      // 获取 topic 信息（一次性获取，避免重复查询）
      const topic = await this.aiGroupService.getTopicById(
        topicId,
        req.user.id,
      );
      const allAIMembers = topic.aiMembers || [];

      for (const mention of dto.mentions) {
        if (mention.mentionType === MentionType.AI && mention.aiMemberId) {
          // @单个AI - 按顺序添加
          if (!aiMemberIdsSet.has(mention.aiMemberId)) {
            const ai = allAIMembers.find((a) => a.id === mention.aiMemberId);
            if (ai) {
              aiMembersToRespond.push({
                id: ai.id,
                displayName: ai.displayName,
              });
              aiMemberIdsSet.add(mention.aiMemberId);
            }
          }
        } else if (
          mention.mentionType === MentionType.ALL_AI ||
          mention.mentionType === MentionType.ALL
        ) {
          // @All AIs 或 @Everyone：按创建顺序添加所有 AI
          this.logger.log(
            `@${mention.mentionType === MentionType.ALL ? "Everyone" : "All AIs"} triggered`,
          );
          for (const ai of allAIMembers) {
            if (!aiMemberIdsSet.has(ai.id)) {
              aiMembersToRespond.push({
                id: ai.id,
                displayName: ai.displayName,
              });
              aiMemberIdsSet.add(ai.id);
            }
          }
          // @Everyone 也要通知人类成员
          if (mention.mentionType === MentionType.ALL && topic.members) {
            for (const member of topic.members) {
              if (member.userId !== req.user.id) {
                this.aiGroupGateway.emitToUser(member.userId, "mention:new", {
                  topicId,
                  messageId: message.id,
                  fromUserId: req.user.id,
                  content:
                    message.content.length > 100
                      ? message.content.substring(0, 100) + "..."
                      : message.content,
                  timestamp: message.createdAt,
                  mentionType: "everyone",
                });
              }
            }
          }
        } else if (mention.mentionType === MentionType.USER && mention.userId) {
          // @真人用户：发送通知
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

      // 在 Controller 层统一检测辩论模式
      const debateInfo = this.detectDebateMode(dto.content, aiMembersToRespond);

      if (debateInfo.isDebate && debateInfo.redAI && debateInfo.blueAI) {
        // 辩论模式：按红蓝方顺序触发
        this.logger.log(
          `[Debate Mode] Detected! Red: ${debateInfo.redAI.displayName}, Blue: ${debateInfo.blueAI.displayName}, Topic: ${debateInfo.topic}`,
        );

        // 先触发红方
        this.aiGroupGateway.emitToTopic(topicId, "ai:typing", {
          topicId,
          aiMemberId: debateInfo.redAI.id,
        });
        this.generateAIResponseInBackground(
          topicId,
          req.user.id,
          debateInfo.redAI.id,
          0,
          { role: "red", opponent: debateInfo.blueAI, topic: debateInfo.topic },
        );

        // 延迟触发蓝方（等红方先回复）
        setTimeout(() => {
          this.aiGroupGateway.emitToTopic(topicId, "ai:typing", {
            topicId,
            aiMemberId: debateInfo.blueAI!.id,
          });
          this.generateAIResponseInBackground(
            topicId,
            req.user.id,
            debateInfo.blueAI!.id,
            0,
            {
              role: "blue",
              opponent: debateInfo.redAI!,
              topic: debateInfo.topic,
            },
          );
        }, 2000);

        // 其他 AI 作为观察者（如果有）
        for (const ai of aiMembersToRespond) {
          if (ai.id !== debateInfo.redAI.id && ai.id !== debateInfo.blueAI.id) {
            setTimeout(() => {
              this.aiGroupGateway.emitToTopic(topicId, "ai:typing", {
                topicId,
                aiMemberId: ai.id,
              });
              this.generateAIResponseInBackground(
                topicId,
                req.user.id,
                ai.id,
                0,
                null,
              );
            }, 4000);
          }
        }
      } else {
        // 普通模式：并行触发所有 AI
        for (const ai of aiMembersToRespond) {
          this.logger.log(`Triggering AI response for ${ai.displayName}`);
          this.aiGroupGateway.emitToTopic(topicId, "ai:typing", {
            topicId,
            aiMemberId: ai.id,
          });
          this.generateAIResponseInBackground(
            topicId,
            req.user.id,
            ai.id,
            0,
            null,
          );
        }
      }
    }

    return message;
  }

  /**
   * 在 Controller 层统一检测辩论模式
   * 返回是否为辩论、红方AI、蓝方AI、辩论主题
   */
  private detectDebateMode(
    content: string,
    aiMembers: Array<{ id: string; displayName: string }>,
  ): {
    isDebate: boolean;
    redAI: { id: string; displayName: string } | null;
    blueAI: { id: string; displayName: string } | null;
    topic: string;
  } {
    const debateKeywords = [
      "辩论",
      "辩一下",
      "辩一辩",
      "思辨",
      "红蓝",
      "正方反方",
      "PK",
      "pk",
      "debate",
      "argue",
    ];

    const contentLower = content.toLowerCase();
    const isDebateRequest = debateKeywords.some((kw) =>
      contentLower.includes(kw.toLowerCase()),
    );

    if (!isDebateRequest || aiMembers.length < 2) {
      return { isDebate: false, redAI: null, blueAI: null, topic: "" };
    }

    // 提取辩论主题（去掉@mentions和关键词后的内容）
    let debateTopic = content
      .replace(/@[\w\-()（）\s\u4e00-\u9fa5]+/g, "") // 移除@mentions（包括中文）
      .replace(/辩论|辩一下|辩一辩|思辨|红蓝|正方反方|PK|debate|argue/gi, "")
      .replace(/[：:]/g, "")
      .trim();

    // 第一个 AI 是红方，第二个是蓝方（基于传入顺序）
    return {
      isDebate: true,
      redAI: aiMembers[0],
      blueAI: aiMembers[1],
      topic: debateTopic || "（请根据上下文确定主题）",
    };
  }

  // 后台生成 AI 响应
  private async generateAIResponseInBackground(
    topicId: string,
    userId: string,
    aiMemberId: string,
    depth: number = 0,
    debateRole: {
      role: "red" | "blue";
      opponent: { id: string; displayName: string };
      topic: string;
    } | null = null,
  ) {
    const AI_TIMEOUT_MS = 120000; // 2 minutes timeout
    const MAX_AI_CHAIN_DEPTH = 3; // 最大AI链式调用深度
    const MAX_DEBATE_ROUNDS = 3; // 辩论最大轮次

    this.logger.log(
      `[AI Response] Starting generation for topic=${topicId}, aiMemberId=${aiMemberId}, depth=${depth}, debateRole=${debateRole?.role || "none"}`,
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
        this.aiGroupService.generateAIResponse(
          topicId,
          userId,
          aiMemberId,
          [],
          debateRole, // 传递辩论角色信息
        ),
        timeoutPromise,
      ]);

      this.logger.log(
        `[AI Response] Success for topic=${topicId}, messageId=${aiMessage.id}`,
      );

      // 广播AI响应
      this.aiGroupGateway.emitToTopic(topicId, "ai:response", {
        aiMemberId,
        messageId: aiMessage.id,
      });
      this.aiGroupGateway.emitToTopic(topicId, "message:new", aiMessage);

      // AI-AI协作：检测AI回复中是否@了其他AI
      if (depth < MAX_AI_CHAIN_DEPTH && aiMessage.content) {
        const mentionedAIs =
          await this.aiGroupService.parseAIMentionsFromContent(
            topicId,
            aiMessage.content,
            aiMemberId,
          );

        if (mentionedAIs.length > 0) {
          this.logger.log(
            `[AI-AI Collaboration] AI ${aiMemberId} mentioned: ${mentionedAIs.map((ai) => ai.displayName).join(", ")}`,
          );

          // 检查是否超过辩论轮次限制
          if (debateRole && depth >= MAX_DEBATE_ROUNDS) {
            this.logger.log(
              `[Debate] Max rounds (${MAX_DEBATE_ROUNDS}) reached, stopping debate`,
            );
            // 可选：发送辩论结束提示
            return;
          }

          // 延迟触发被@的AI
          for (let i = 0; i < mentionedAIs.length; i++) {
            const mentionedAI = mentionedAIs[i];

            // 如果是辩论模式，传递相反的角色给对手
            let nextDebateRole = null;
            if (debateRole && mentionedAI.id === debateRole.opponent.id) {
              // 对手回应，角色互换
              nextDebateRole = {
                role:
                  debateRole.role === "red"
                    ? "blue"
                    : ("red" as "red" | "blue"),
                opponent: {
                  id: aiMemberId,
                  displayName: aiMessage.aiMember?.displayName || "",
                },
                topic: debateRole.topic,
              };
            }

            setTimeout(
              () => {
                this.logger.log(
                  `[AI-AI Collaboration] Triggering ${mentionedAI.displayName}`,
                );
                this.aiGroupGateway.emitToTopic(topicId, "ai:typing", {
                  topicId,
                  aiMemberId: mentionedAI.id,
                });
                this.generateAIResponseInBackground(
                  topicId,
                  userId,
                  mentionedAI.id,
                  depth + 1,
                  nextDebateRole,
                );
              },
              (i + 1) * 1500,
            );
          }
        }
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(
        `[AI Response] Error for topic=${topicId}, aiMemberId=${aiMemberId}: ${errorMessage}`,
      );
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

  // ==================== Message Forward & Bookmark ====================

  @Post(":topicId/messages/forward")
  async forwardMessages(
    @Request() req: any,
    @Param("topicId") topicId: string,
    @Body() dto: ForwardMessagesDto,
  ) {
    const result = await this.aiGroupService.forwardMessages(
      topicId,
      req.user.id,
      dto,
    );

    // 如果转发到其他Topic，通知目标Topic的成员
    if (dto.targetType === "TOPIC" && dto.targetTopicId) {
      this.aiGroupGateway.emitToTopic(dto.targetTopicId, "messages:forwarded", {
        fromTopicId: topicId,
        messageCount: result.messageCount,
        forwardedById: req.user.id,
      });
    }

    return result;
  }

  @Post(":topicId/messages/:messageId/bookmark")
  async bookmarkMessage(
    @Request() req: any,
    @Param("topicId") topicId: string,
    @Param("messageId") messageId: string,
    @Body() dto: BookmarkMessageDto,
  ) {
    return this.aiGroupService.bookmarkMessage(
      topicId,
      req.user.id,
      messageId,
      dto,
    );
  }

  @Delete(":topicId/messages/:messageId/bookmark")
  async unbookmarkMessage(
    @Request() req: any,
    @Param("topicId") topicId: string,
    @Param("messageId") messageId: string,
  ) {
    return this.aiGroupService.unbookmarkMessage(
      topicId,
      req.user.id,
      messageId,
    );
  }
}

// Bookmarks controller (user level)
@Controller("bookmarks")
@UseGuards(JwtAuthGuard)
export class BookmarksController {
  constructor(private readonly aiGroupService: AiGroupService) {}

  @Get()
  async getBookmarks(
    @Request() req: any,
    @Query("category") category?: string,
  ) {
    return this.aiGroupService.getBookmarks(req.user.id, { category });
  }

  @Get("categories")
  async getBookmarkCategories(@Request() req: any) {
    return this.aiGroupService.getBookmarkCategories(req.user.id);
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
