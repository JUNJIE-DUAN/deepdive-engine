import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import {
  TopicType,
  TopicRole,
  MessageContentType,
  Prisma,
} from "@prisma/client";
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
import { AiChatService, ChatMessage } from "../ai/ai-chat.service";
import { SearchService } from "../ai/search.service";

@Injectable()
export class AiGroupService {
  private readonly logger = new Logger(AiGroupService.name);

  constructor(
    private prisma: PrismaService,
    private aiChatService: AiChatService,
    private searchService: SearchService,
  ) {}

  // ==================== Topic CRUD ====================

  async createTopic(userId: string, dto: CreateTopicDto) {
    const { memberIds, aiMembers, ...topicData } = dto;

    this.logger.log(
      `Creating topic for user ${userId}: ${JSON.stringify(dto)}`,
    );

    try {
      const topicId = await this.prisma.$transaction(async (tx) => {
        // 创建Topic
        const topic = await tx.topic.create({
          data: {
            ...topicData,
            createdById: userId,
            // 创建者自动成为Owner
            members: {
              create: {
                userId,
                role: TopicRole.OWNER,
              },
            },
          },
        });

        this.logger.log(`Topic created with id: ${topic.id}`);

        // 添加初始成员
        if (memberIds && memberIds.length > 0) {
          await tx.topicMember.createMany({
            data: memberIds
              .filter((id) => id !== userId) // 排除创建者
              .map((id) => ({
                topicId: topic.id,
                userId: id,
                role: TopicRole.MEMBER,
              })),
            skipDuplicates: true,
          });
        }

        // 添加初始AI成员
        if (aiMembers && aiMembers.length > 0) {
          await tx.topicAIMember.createMany({
            data: aiMembers.map((ai) => ({
              topicId: topic.id,
              aiModel: ai.aiModel,
              displayName: ai.displayName,
              roleDescription: ai.roleDescription,
              systemPrompt: ai.systemPrompt,
              addedById: userId,
            })),
          });
        }

        return topic.id;
      });

      this.logger.log(`Transaction committed, fetching topic ${topicId}`);

      // 返回完整的Topic信息 (outside transaction to ensure data is committed)
      return this.getTopicById(topicId, userId);
    } catch (error) {
      this.logger.error(`Failed to create topic: ${error}`);
      throw error;
    }
  }

  async getTopics(
    userId: string,
    options?: { type?: TopicType; search?: string },
  ) {
    const where: Prisma.TopicWhereInput = {
      members: {
        some: { userId },
      },
      archivedAt: null,
    };

    if (options?.type) {
      where.type = options.type;
    }

    if (options?.search) {
      where.OR = [
        { name: { contains: options.search, mode: "insensitive" } },
        { description: { contains: options.search, mode: "insensitive" } },
      ];
    }

    const topics = await this.prisma.topic.findMany({
      where,
      include: {
        createdBy: {
          select: { id: true, username: true, fullName: true, avatarUrl: true },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
        aiMembers: {
          select: {
            id: true,
            aiModel: true,
            displayName: true,
            avatar: true,
            roleDescription: true,
          },
        },
        _count: {
          select: {
            messages: true,
            resources: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // 计算每个Topic的未读消息数
    const topicsWithUnread = await Promise.all(
      topics.map(async (topic) => {
        const membership = topic.members.find((m) => m.userId === userId);
        let unreadCount = 0;

        if (membership?.lastReadAt) {
          unreadCount = await this.prisma.topicMessage.count({
            where: {
              topicId: topic.id,
              createdAt: { gt: membership.lastReadAt },
              deletedAt: null,
            },
          });
        } else {
          unreadCount = topic._count.messages;
        }

        return {
          ...topic,
          unreadCount,
          memberCount: topic.members.length,
          aiMemberCount: topic.aiMembers.length,
        };
      }),
    );

    return topicsWithUnread;
  }

  async getTopicById(topicId: string, userId: string) {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        createdBy: {
          select: { id: true, username: true, fullName: true, avatarUrl: true },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                avatarUrl: true,
                email: true,
              },
            },
          },
          orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
        },
        aiMembers: {
          orderBy: { createdAt: "asc" },
        },
        _count: {
          select: {
            messages: true,
            resources: true,
          },
        },
      },
    });

    if (!topic) {
      throw new NotFoundException("Topic not found");
    }

    // 检查用户是否是成员
    const membership = topic.members.find((m) => m.userId === userId);
    if (!membership && topic.type === TopicType.PRIVATE) {
      throw new ForbiddenException("You are not a member of this topic");
    }

    return {
      ...topic,
      currentUserRole: membership?.role,
      memberCount: topic.members.length,
      aiMemberCount: topic.aiMembers.length,
    };
  }

  async updateTopic(topicId: string, userId: string, dto: UpdateTopicDto) {
    await this.checkTopicPermission(topicId, userId, [
      TopicRole.OWNER,
      TopicRole.ADMIN,
    ]);

    return this.prisma.topic.update({
      where: { id: topicId },
      data: dto,
      include: {
        createdBy: {
          select: { id: true, username: true, fullName: true, avatarUrl: true },
        },
      },
    });
  }

  async archiveTopic(topicId: string, userId: string) {
    await this.checkTopicPermission(topicId, userId, [TopicRole.OWNER]);

    return this.prisma.topic.update({
      where: { id: topicId },
      data: {
        type: TopicType.ARCHIVED,
        archivedAt: new Date(),
      },
    });
  }

  async deleteTopic(topicId: string, userId: string) {
    await this.checkTopicPermission(topicId, userId, [TopicRole.OWNER]);

    return this.prisma.topic.delete({
      where: { id: topicId },
    });
  }

  // ==================== Member Management ====================

  async addMember(topicId: string, userId: string, dto: AddMemberDto) {
    await this.checkTopicPermission(topicId, userId, [
      TopicRole.OWNER,
      TopicRole.ADMIN,
    ]);

    // 检查用户是否存在
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    // 检查是否已是成员
    const existing = await this.prisma.topicMember.findUnique({
      where: {
        topicId_userId: { topicId, userId: dto.userId },
      },
    });
    if (existing) {
      throw new BadRequestException("User is already a member");
    }

    return this.prisma.topicMember.create({
      data: {
        topicId,
        userId: dto.userId,
        role: dto.role || TopicRole.MEMBER,
        nickname: dto.nickname,
      },
      include: {
        user: {
          select: { id: true, username: true, fullName: true, avatarUrl: true },
        },
      },
    });
  }

  async addMembers(topicId: string, userId: string, dto: AddMembersDto) {
    await this.checkTopicPermission(topicId, userId, [
      TopicRole.OWNER,
      TopicRole.ADMIN,
    ]);

    const results = await this.prisma.topicMember.createMany({
      data: dto.userIds.map((id) => ({
        topicId,
        userId: id,
        role: dto.role || TopicRole.MEMBER,
      })),
      skipDuplicates: true,
    });

    return { added: results.count };
  }

  async updateMember(
    topicId: string,
    userId: string,
    memberId: string,
    dto: UpdateMemberDto,
  ) {
    const currentMembership = await this.checkTopicPermission(topicId, userId, [
      TopicRole.OWNER,
      TopicRole.ADMIN,
    ]);

    const targetMember = await this.prisma.topicMember.findFirst({
      where: { topicId, userId: memberId },
    });

    if (!targetMember) {
      throw new NotFoundException("Member not found");
    }

    // 不能修改Owner的角色（除非自己是Owner）
    if (
      targetMember.role === TopicRole.OWNER &&
      currentMembership.role !== TopicRole.OWNER
    ) {
      throw new ForbiddenException("Cannot modify owner");
    }

    // Admin不能将其他人设为Owner
    if (
      dto.role === TopicRole.OWNER &&
      currentMembership.role !== TopicRole.OWNER
    ) {
      throw new ForbiddenException("Only owner can transfer ownership");
    }

    return this.prisma.topicMember.update({
      where: { id: targetMember.id },
      data: dto,
      include: {
        user: {
          select: { id: true, username: true, fullName: true, avatarUrl: true },
        },
      },
    });
  }

  async removeMember(topicId: string, userId: string, memberId: string) {
    await this.checkTopicPermission(topicId, userId, [
      TopicRole.OWNER,
      TopicRole.ADMIN,
    ]);

    const targetMember = await this.prisma.topicMember.findFirst({
      where: { topicId, userId: memberId },
    });

    if (!targetMember) {
      throw new NotFoundException("Member not found");
    }

    // 不能移除Owner
    if (targetMember.role === TopicRole.OWNER) {
      throw new ForbiddenException("Cannot remove owner");
    }

    return this.prisma.topicMember.delete({
      where: { id: targetMember.id },
    });
  }

  async leaveTopic(topicId: string, userId: string) {
    const membership = await this.prisma.topicMember.findUnique({
      where: {
        topicId_userId: { topicId, userId },
      },
    });

    if (!membership) {
      throw new NotFoundException("You are not a member of this topic");
    }

    // Owner不能直接离开，需要先转让所有权
    if (membership.role === TopicRole.OWNER) {
      const otherMembers = await this.prisma.topicMember.count({
        where: { topicId, userId: { not: userId } },
      });
      if (otherMembers > 0) {
        throw new BadRequestException(
          "Owner must transfer ownership before leaving",
        );
      }
      // 如果只有Owner一个人，删除整个Topic
      return this.prisma.topic.delete({ where: { id: topicId } });
    }

    return this.prisma.topicMember.delete({
      where: { id: membership.id },
    });
  }

  // ==================== AI Member Management ====================

  async addAIMember(topicId: string, userId: string, dto: AddAIMemberDto) {
    await this.checkTopicPermission(topicId, userId, [
      TopicRole.OWNER,
      TopicRole.ADMIN,
    ]);

    // 检查是否已存在相同的AI成员
    const existing = await this.prisma.topicAIMember.findUnique({
      where: {
        topicId_aiModel_displayName: {
          topicId,
          aiModel: dto.aiModel,
          displayName: dto.displayName,
        },
      },
    });
    if (existing) {
      throw new BadRequestException("AI member with this name already exists");
    }

    return this.prisma.topicAIMember.create({
      data: {
        topicId,
        addedById: userId,
        ...dto,
      },
    });
  }

  async updateAIMember(
    topicId: string,
    userId: string,
    aiMemberId: string,
    dto: UpdateAIMemberDto,
  ) {
    await this.checkTopicPermission(topicId, userId, [
      TopicRole.OWNER,
      TopicRole.ADMIN,
    ]);

    const aiMember = await this.prisma.topicAIMember.findFirst({
      where: { id: aiMemberId, topicId },
    });

    if (!aiMember) {
      throw new NotFoundException("AI member not found");
    }

    return this.prisma.topicAIMember.update({
      where: { id: aiMemberId },
      data: dto,
    });
  }

  async removeAIMember(topicId: string, userId: string, aiMemberId: string) {
    await this.checkTopicPermission(topicId, userId, [
      TopicRole.OWNER,
      TopicRole.ADMIN,
    ]);

    const aiMember = await this.prisma.topicAIMember.findFirst({
      where: { id: aiMemberId, topicId },
    });

    if (!aiMember) {
      throw new NotFoundException("AI member not found");
    }

    return this.prisma.topicAIMember.delete({
      where: { id: aiMemberId },
    });
  }

  // ==================== Messages ====================

  async getMessages(
    topicId: string,
    userId: string,
    options?: { cursor?: string; limit?: number; before?: Date },
  ) {
    await this.checkTopicMembership(topicId, userId);

    const limit = options?.limit || 50;
    const where: Prisma.TopicMessageWhereInput = {
      topicId,
      deletedAt: null,
    };

    if (options?.cursor) {
      where.id = { lt: options.cursor };
    }

    if (options?.before) {
      where.createdAt = { lt: options.before };
    }

    const messages = await this.prisma.topicMessage.findMany({
      where,
      include: {
        sender: {
          select: { id: true, username: true, fullName: true, avatarUrl: true },
        },
        aiMember: {
          select: {
            id: true,
            aiModel: true,
            displayName: true,
            avatar: true,
            roleDescription: true,
          },
        },
        mentions: {
          include: {
            user: {
              select: { id: true, username: true, fullName: true },
            },
            aiMember: {
              select: { id: true, displayName: true },
            },
          },
        },
        attachments: true,
        reactions: {
          include: {
            user: {
              select: { id: true, username: true },
            },
          },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            sender: {
              select: { id: true, username: true, fullName: true },
            },
            aiMember: {
              select: { id: true, displayName: true },
            },
          },
        },
        _count: {
          select: { replies: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
    });

    const hasMore = messages.length > limit;
    if (hasMore) {
      messages.pop();
    }

    return {
      messages: messages.reverse(), // 返回时按时间正序
      hasMore,
      nextCursor: hasMore ? messages[0]?.id : null,
    };
  }

  async sendMessage(topicId: string, userId: string, dto: SendMessageDto) {
    await this.checkTopicMembership(topicId, userId);

    const message = await this.prisma.$transaction(async (tx) => {
      // 创建消息
      const msg = await tx.topicMessage.create({
        data: {
          topicId,
          senderId: userId,
          content: dto.content,
          contentType: dto.contentType || MessageContentType.TEXT,
          replyToId: dto.replyToId,
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
      });

      // 创建mentions
      if (dto.mentions && dto.mentions.length > 0) {
        await tx.topicMessageMention.createMany({
          data: dto.mentions.map((m) => ({
            messageId: msg.id,
            userId: m.userId,
            aiMemberId: m.aiMemberId,
            mentionType: m.mentionType,
          })),
        });
      }

      // 创建attachments
      if (dto.attachments && dto.attachments.length > 0) {
        await tx.topicMessageAttachment.createMany({
          data: dto.attachments.map((a) => ({
            messageId: msg.id,
            type: a.type,
            name: a.name,
            url: a.url,
            size: a.size,
            mimeType: a.mimeType,
            resourceId: a.resourceId,
            linkPreview: a.linkPreview as any,
          })),
        });
      }

      // 更新Topic的updatedAt
      await tx.topic.update({
        where: { id: topicId },
        data: { updatedAt: new Date() },
      });

      return msg;
    });

    // 返回完整消息
    return this.prisma.topicMessage.findUnique({
      where: { id: message.id },
      include: {
        sender: {
          select: { id: true, username: true, fullName: true, avatarUrl: true },
        },
        aiMember: {
          select: {
            id: true,
            aiModel: true,
            displayName: true,
            avatar: true,
            roleDescription: true,
          },
        },
        mentions: {
          include: {
            user: { select: { id: true, username: true, fullName: true } },
            aiMember: { select: { id: true, displayName: true } },
          },
        },
        attachments: true,
        reactions: true,
        replyTo: {
          select: {
            id: true,
            content: true,
            sender: { select: { id: true, username: true, fullName: true } },
            aiMember: { select: { id: true, displayName: true } },
          },
        },
      },
    });
  }

  async deleteMessage(topicId: string, userId: string, messageId: string) {
    const message = await this.prisma.topicMessage.findFirst({
      where: { id: messageId, topicId },
    });

    if (!message) {
      throw new NotFoundException("Message not found");
    }

    // 只有消息发送者或管理员可以删除
    if (message.senderId !== userId) {
      await this.checkTopicPermission(topicId, userId, [
        TopicRole.OWNER,
        TopicRole.ADMIN,
      ]);
    }

    return this.prisma.topicMessage.update({
      where: { id: messageId },
      data: { deletedAt: new Date() },
    });
  }

  async addReaction(
    topicId: string,
    userId: string,
    messageId: string,
    emoji: string,
  ) {
    await this.checkTopicMembership(topicId, userId);

    const message = await this.prisma.topicMessage.findFirst({
      where: { id: messageId, topicId, deletedAt: null },
    });

    if (!message) {
      throw new NotFoundException("Message not found");
    }

    return this.prisma.topicMessageReaction.upsert({
      where: {
        messageId_userId_emoji: { messageId, userId, emoji },
      },
      update: {},
      create: {
        messageId,
        userId,
        emoji,
      },
    });
  }

  async removeReaction(
    topicId: string,
    userId: string,
    messageId: string,
    emoji: string,
  ) {
    await this.checkTopicMembership(topicId, userId);

    return this.prisma.topicMessageReaction.deleteMany({
      where: { messageId, userId, emoji },
    });
  }

  async markAsRead(topicId: string, userId: string, messageId?: string) {
    const membership = await this.prisma.topicMember.findUnique({
      where: {
        topicId_userId: { topicId, userId },
      },
    });

    if (!membership) {
      throw new NotFoundException("Not a member");
    }

    let lastReadAt = new Date();

    if (messageId) {
      const message = await this.prisma.topicMessage.findUnique({
        where: { id: messageId },
        select: { createdAt: true },
      });
      if (message) {
        lastReadAt = message.createdAt;
      }
    }

    return this.prisma.topicMember.update({
      where: { id: membership.id },
      data: { lastReadAt },
    });
  }

  // ==================== Resources ====================

  async getResources(topicId: string, userId: string) {
    await this.checkTopicMembership(topicId, userId);

    return this.prisma.topicResource.findMany({
      where: { topicId },
      include: {
        addedBy: {
          select: { id: true, username: true, fullName: true },
        },
        resource: {
          select: { id: true, title: true, type: true, sourceUrl: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async addResource(topicId: string, userId: string, dto: AddResourceDto) {
    await this.checkTopicMembership(topicId, userId);

    return this.prisma.topicResource.create({
      data: {
        topicId,
        addedById: userId,
        ...dto,
      },
      include: {
        addedBy: {
          select: { id: true, username: true, fullName: true },
        },
      },
    });
  }

  async removeResource(topicId: string, userId: string, resourceId: string) {
    const resource = await this.prisma.topicResource.findFirst({
      where: { id: resourceId, topicId },
    });

    if (!resource) {
      throw new NotFoundException("Resource not found");
    }

    // 只有添加者或管理员可以删除
    if (resource.addedById !== userId) {
      await this.checkTopicPermission(topicId, userId, [
        TopicRole.OWNER,
        TopicRole.ADMIN,
      ]);
    }

    return this.prisma.topicResource.delete({
      where: { id: resourceId },
    });
  }

  // ==================== Summaries ====================

  async getSummaries(topicId: string, userId: string) {
    await this.checkTopicMembership(topicId, userId);

    return this.prisma.topicSummary.findMany({
      where: { topicId },
      include: {
        createdBy: {
          select: { id: true, username: true, fullName: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async generateSummary(
    topicId: string,
    userId: string,
    dto: GenerateSummaryDto,
  ) {
    await this.checkTopicMembership(topicId, userId);

    // 获取Topic信息
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        members: {
          include: {
            user: { select: { id: true, username: true, fullName: true } },
          },
        },
        aiMembers: {
          select: { id: true, displayName: true },
        },
      },
    });

    if (!topic) {
      throw new NotFoundException("Topic not found");
    }

    // 获取消息范围
    const where: Prisma.TopicMessageWhereInput = {
      topicId,
      deletedAt: null,
    };

    if (dto.fromMessageId) {
      const fromMsg = await this.prisma.topicMessage.findUnique({
        where: { id: dto.fromMessageId },
        select: { createdAt: true },
      });
      if (fromMsg) {
        where.createdAt = {
          ...(where.createdAt as any),
          gte: fromMsg.createdAt,
        };
      }
    }

    if (dto.toMessageId) {
      const toMsg = await this.prisma.topicMessage.findUnique({
        where: { id: dto.toMessageId },
        select: { createdAt: true },
      });
      if (toMsg) {
        where.createdAt = { ...(where.createdAt as any), lte: toMsg.createdAt };
      }
    }

    const messages = await this.prisma.topicMessage.findMany({
      where,
      include: {
        sender: { select: { username: true, fullName: true } },
        aiMember: { select: { displayName: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 500, // 限制最多500条消息
    });

    if (messages.length === 0) {
      throw new BadRequestException("No messages to summarize");
    }

    // 构建消息文本
    const aiModel = dto.aiModel || "grok";
    const messagesForSummary = messages.map((m) => {
      const sender = m.sender
        ? m.sender.fullName || m.sender.username || "User"
        : m.aiMember?.displayName || "Unknown";
      return {
        sender,
        content: m.content,
        timestamp: m.createdAt.toISOString(),
      };
    });

    // 调用AI服务生成纪要
    this.logger.log(`Generating summary for topic ${topicId} using ${aiModel}`);
    let summaryContent: string;

    try {
      const result = await this.aiChatService.generateSummary(
        messagesForSummary,
        aiModel,
      );
      summaryContent = result.content;
    } catch (error) {
      this.logger.error(`Failed to generate summary: ${error}`);
      // Fallback to basic summary
      summaryContent = `## 讨论纪要

### 讨论主题
${topic.name}

### 参与者
${topic.members.map((m) => m.user.fullName || m.user.username).join(", ")}
AI: ${topic.aiMembers.map((ai) => ai.displayName).join(", ")}

### 消息数量
共 ${messages.length} 条消息

### 主要内容
${messagesForSummary
  .slice(0, 10)
  .map((m) => `- **${m.sender}**: ${m.content.substring(0, 100)}...`)
  .join("\n")}

---
*生成时间: ${new Date().toISOString()}*
*使用模型: ${aiModel}*
*注意: AI服务暂时不可用，这是基础摘要*`;
    }

    // 保存纪要
    return this.prisma.topicSummary.create({
      data: {
        topicId,
        title: dto.title || `${topic.name} - 讨论纪要`,
        content: summaryContent,
        fromMessageId: dto.fromMessageId,
        toMessageId: dto.toMessageId,
        generatedBy: aiModel,
        prompt: `Generated summary for ${messages.length} messages`,
        createdById: userId,
      },
      include: {
        createdBy: {
          select: { id: true, username: true, fullName: true },
        },
      },
    });
  }

  async deleteSummary(topicId: string, userId: string, summaryId: string) {
    const summary = await this.prisma.topicSummary.findFirst({
      where: { id: summaryId, topicId },
    });

    if (!summary) {
      throw new NotFoundException("Summary not found");
    }

    // 只有创建者或管理员可以删除
    if (summary.createdById !== userId) {
      await this.checkTopicPermission(topicId, userId, [
        TopicRole.OWNER,
        TopicRole.ADMIN,
      ]);
    }

    return this.prisma.topicSummary.delete({
      where: { id: summaryId },
    });
  }

  // ==================== AI Response ====================

  async generateAIResponse(
    topicId: string,
    userId: string,
    aiMemberId: string,
    _contextMessageIds: string[],
  ) {
    await this.checkTopicMembership(topicId, userId);

    const aiMember = await this.prisma.topicAIMember.findFirst({
      where: { id: aiMemberId, topicId },
    });

    if (!aiMember) {
      throw new NotFoundException("AI member not found");
    }

    // 获取上下文消息
    const contextMessages = await this.prisma.topicMessage.findMany({
      where: {
        topicId,
        deletedAt: null,
      },
      include: {
        sender: { select: { username: true, fullName: true } },
        aiMember: { select: { displayName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: aiMember.contextWindow,
    });

    // 构建Prompt
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
      select: { name: true, description: true },
    });

    // 获取Topic关联的资源内容作为上下文
    const topicResources = await this.prisma.topicResource.findMany({
      where: { topicId },
      include: {
        resource: {
          select: {
            title: true,
            abstract: true,
            content: true,
            sourceUrl: true,
            type: true,
          },
        },
      },
      take: 10, // 限制资源数量避免上下文过长
      orderBy: { createdAt: "desc" },
    });

    // 构建资源上下文
    let resourceContext = "";
    if (topicResources.length > 0) {
      const resourceSummaries = topicResources
        .filter((tr) => tr.resource)
        .map((tr) => {
          const r = tr.resource!;
          let summary = `- **${r.title || tr.name}**`;
          if (r.sourceUrl) summary += ` (${r.sourceUrl})`;
          if (r.abstract) summary += `\n  ${r.abstract}`;
          // 包含部分内容（截断以避免过长）
          if (r.content) {
            const contentPreview = r.content.substring(0, 500);
            summary += `\n  Content: ${contentPreview}${r.content.length > 500 ? "..." : ""}`;
          }
          return summary;
        })
        .join("\n\n");

      if (resourceSummaries) {
        resourceContext = `\n\n## Reference Materials\nThe following resources have been shared in this discussion group. Use them to provide more informed responses:\n\n${resourceSummaries}`;
      }
    }

    // 检测是否需要搜索实时信息或抓取URL
    // 获取最近的用户消息（可能有多条）
    const recentUserMessages = contextMessages
      .filter((m) => m.senderId)
      .slice(0, 5);
    let searchContext = "";
    let urlContext = "";

    // 1. 从最近的用户消息中提取所有URL
    const allUrls: string[] = [];
    for (const msg of recentUserMessages) {
      const urls = this.searchService.extractUrls(msg.content);
      allUrls.push(...urls);
    }
    // 去重
    const uniqueUrls = [...new Set(allUrls)];

    if (uniqueUrls.length > 0) {
      this.logger.log(
        `Found ${uniqueUrls.length} URLs in recent messages, fetching content...`,
      );
      urlContext = await this.searchService.fetchUrlsForContext(uniqueUrls);
      if (urlContext) {
        this.logger.log(`Added URL content to context`);
      }
    }

    // 2. 检测是否需要搜索实时信息（仅当没有URL时才搜索）
    const lastUserMessage = recentUserMessages[0];
    if (
      lastUserMessage &&
      !urlContext &&
      this.shouldSearchForInfo(lastUserMessage.content)
    ) {
      this.logger.log(
        `Searching for real-time info: "${lastUserMessage.content.substring(0, 100)}..."`,
      );
      const searchResults = await this.searchService.search(
        lastUserMessage.content,
        5,
      );
      if (searchResults.success && searchResults.results.length > 0) {
        searchContext =
          "\n\n" +
          this.searchService.formatResultsForContext(searchResults.results);
        this.logger.log(
          `Added ${searchResults.results.length} search results to context`,
        );
      }
    }

    const systemPrompt =
      aiMember.systemPrompt ||
      `You are ${aiMember.displayName}, an AI assistant participating in a group discussion.
${aiMember.roleDescription ? `Your role: ${aiMember.roleDescription}` : ""}
You are in a discussion group called "${topic?.name}".
${topic?.description ? `Group description: ${topic.description}` : ""}${resourceContext}${urlContext}${searchContext}

Respond naturally and helpfully to the discussion. When relevant, reference the shared materials, fetched web content, and search results to provide accurate, up-to-date information. Keep your responses concise but informative.`;

    // Build chat messages for AI service
    const chatMessages: ChatMessage[] = contextMessages.reverse().map((m) => {
      const senderName = m.sender
        ? m.sender.fullName || m.sender.username || "User"
        : m.aiMember?.displayName || "AI";
      const isAI = !!m.aiMemberId;

      return {
        role: isAI ? "assistant" : "user",
        content: m.content,
        name: senderName,
      } as ChatMessage;
    });

    // Get AI model configuration from database
    // aiMember.aiModel is the standard model ID: "grok", "claude", "gpt-4", "gemini"
    // Database AIModel.name field uses the same standard IDs (enforced by admin UI)
    const aiModelConfig = await this.prisma.aIModel.findFirst({
      where: {
        name: aiMember.aiModel,
        isEnabled: true,
      },
    });

    this.logger.log(
      `AI model lookup: aiMember.aiModel="${aiMember.aiModel}", found=${!!aiModelConfig}`,
    );

    // Call AI service
    this.logger.log(
      `Generating AI response for topic ${topicId} using ${aiMember.aiModel}`,
    );
    let aiResponse: string;
    let tokensUsed = 0;

    try {
      let result;
      if (aiModelConfig && aiModelConfig.apiKey) {
        // Use database-configured API key
        this.logger.log(
          `Using database-configured API key for ${aiModelConfig.provider}`,
        );
        result = await this.aiChatService.generateChatCompletionWithKey({
          provider: aiModelConfig.provider,
          modelId: aiModelConfig.modelId,
          apiKey: aiModelConfig.apiKey,
          apiEndpoint: aiModelConfig.apiEndpoint || undefined,
          systemPrompt,
          messages: chatMessages,
          maxTokens: 1024,
          temperature: aiModelConfig.temperature || 0.7,
        });
      } else {
        // Fall back to environment variable configuration
        this.logger.warn(
          `No database config found for ${aiMember.aiModel}, falling back to env vars`,
        );
        result = await this.aiChatService.generateChatCompletion({
          model: aiMember.aiModel,
          systemPrompt,
          messages: chatMessages,
          maxTokens: 1024,
          temperature: 0.7,
        });
      }
      aiResponse = result.content;
      tokensUsed = result.tokensUsed;
    } catch (error) {
      this.logger.error(`Failed to generate AI response: ${error}`);
      aiResponse = `I apologize, but I'm having trouble generating a response at the moment. Please try again later.`;
    }

    // 创建AI消息
    const message = await this.prisma.topicMessage.create({
      data: {
        topicId,
        aiMemberId,
        content: aiResponse,
        contentType: MessageContentType.TEXT,
        prompt: systemPrompt,
        modelUsed: aiMember.aiModel,
        tokensUsed,
      },
      include: {
        aiMember: {
          select: {
            id: true,
            aiModel: true,
            displayName: true,
            avatar: true,
            roleDescription: true,
          },
        },
      },
    });

    // 更新Topic的updatedAt
    await this.prisma.topic.update({
      where: { id: topicId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  // ==================== Helper Methods ====================

  /**
   * Determine if a message likely needs real-time information
   * Uses keyword detection to decide when to search
   */
  private shouldSearchForInfo(content: string): boolean {
    const lowerContent = content.toLowerCase();

    // Keywords that suggest need for current/real-time info
    const searchTriggers = [
      // Time-sensitive
      "最新",
      "最近",
      "今天",
      "昨天",
      "本周",
      "这周",
      "本月",
      "latest",
      "recent",
      "today",
      "yesterday",
      "this week",
      "this month",
      "current",
      "now",
      "2024",
      "2025",
      // Research/info seeking
      "什么是",
      "是什么",
      "怎么样",
      "如何",
      "为什么",
      "哪些",
      "哪个",
      "what is",
      "how to",
      "why",
      "which",
      "who is",
      "where",
      // News/trends
      "新闻",
      "动态",
      "趋势",
      "发展",
      "进展",
      "消息",
      "news",
      "trend",
      "update",
      "development",
      "announcement",
      // Comparison/evaluation
      "比较",
      "对比",
      "区别",
      "评价",
      "评测",
      "推荐",
      "compare",
      "versus",
      "vs",
      "difference",
      "review",
      "recommend",
      // Technical/specific
      "价格",
      "股价",
      "天气",
      "汇率",
      "price",
      "stock",
      "weather",
      "rate",
    ];

    return searchTriggers.some((trigger) => lowerContent.includes(trigger));
  }

  private async checkTopicMembership(topicId: string, userId: string) {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        members: {
          where: { userId },
        },
      },
    });

    if (!topic) {
      throw new NotFoundException("Topic not found");
    }

    if (topic.members.length === 0 && topic.type === TopicType.PRIVATE) {
      throw new ForbiddenException("You are not a member of this topic");
    }

    return topic.members[0];
  }

  private async checkTopicPermission(
    topicId: string,
    userId: string,
    allowedRoles: TopicRole[],
  ) {
    const membership = await this.prisma.topicMember.findUnique({
      where: {
        topicId_userId: { topicId, userId },
      },
    });

    if (!membership) {
      throw new ForbiddenException("You are not a member of this topic");
    }

    if (!allowedRoles.includes(membership.role)) {
      throw new ForbiddenException(
        "You do not have permission to perform this action",
      );
    }

    return membership;
  }

  // ==================== User Search ====================

  async searchUserByEmail(email: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      throw new NotFoundException("User not found with this email");
    }

    return user;
  }

  async searchUsers(query: string, limit: number = 10) {
    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: query, mode: "insensitive" } },
          { username: { contains: query, mode: "insensitive" } },
          { fullName: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        avatarUrl: true,
      },
      take: limit,
    });

    return users;
  }
}
