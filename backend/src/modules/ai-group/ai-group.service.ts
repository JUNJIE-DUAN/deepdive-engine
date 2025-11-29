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
  ForwardMessagesDto,
  BookmarkMessageDto,
} from "./dto";
import { AiChatService, ChatMessage } from "../ai/ai-chat.service";
import { SearchService } from "../ai/search.service";
import {
  ContextRouterService,
  ContextStrategy,
} from "./context-router.service";

@Injectable()
export class AiGroupService {
  private readonly logger = new Logger(AiGroupService.name);

  constructor(
    private prisma: PrismaService,
    private aiChatService: AiChatService,
    private searchService: SearchService,
    private contextRouter: ContextRouterService,
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

  async addMemberByEmail(
    topicId: string,
    userId: string,
    email: string,
    role?: TopicRole,
  ) {
    await this.checkTopicPermission(topicId, userId, [
      TopicRole.OWNER,
      TopicRole.ADMIN,
    ]);

    // 通过邮箱查找用户
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user) {
      throw new NotFoundException(`User with email "${email}" not found`);
    }

    // 检查是否已是成员
    const existing = await this.prisma.topicMember.findUnique({
      where: {
        topicId_userId: { topicId, userId: user.id },
      },
    });
    if (existing) {
      throw new BadRequestException("User is already a member");
    }

    return this.prisma.topicMember.create({
      data: {
        topicId,
        userId: user.id,
        role: role || TopicRole.MEMBER,
      },
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

  /**
   * 红蓝思辨快捷设置
   * 一键创建两个 AI 成员进行辩论
   */
  async setupDebateAIs(
    topicId: string,
    userId: string,
    redAiModel: string,
    blueAiModel: string,
    debateTopic?: string,
  ) {
    await this.checkTopicPermission(topicId, userId, [
      TopicRole.OWNER,
      TopicRole.ADMIN,
    ]);

    const topicDescription = debateTopic
      ? `\n当前辩论主题：${debateTopic}`
      : "";

    // 红方 prompt
    const redPrompt = `你是【红方】辩手，负责正方立场。

## 辩论规则
1. 积极提出观点和论据，主动进攻
2. **必须使用具体数据、研究报告、权威来源作为佐证**
3. 引用时注明来源（如：根据XX研究、XX报告显示...）
4. 每次发言后必须 @蓝方 等待对方回应
5. 保持理性，专注论点而非人身攻击
6. 第3轮后进行总结陈词${topicDescription}

## 论证要求
- 使用你的知识库中的真实数据和案例
- 引用可查证的研究、报告、统计数据
- 提供具体的例子和数字支撑论点
- 如有可能，提供相关链接或来源

## 发言格式
**我方观点**：[核心论点]
**数据佐证**：[具体数据、研究、案例，注明来源]
**逻辑推理**：[论证过程]
**向对方提问**：[针对性问题]

@蓝方 请回应`;

    // 蓝方 prompt
    const bluePrompt = `你是【蓝方】辩手，负责反方立场。

## 辩论规则
1. 质疑对方观点，寻找逻辑漏洞和数据问题
2. **必须使用具体数据、研究报告、权威来源反驳**
3. 引用时注明来源（如：根据XX研究、XX报告显示...）
4. 每次发言后必须 @红方 继续辩论
5. 保持理性，专注论点而非人身攻击
6. 第3轮后进行总结陈词${topicDescription}

## 论证要求
- 检验对方数据的准确性和来源可靠性
- 提出相反的数据和研究作为反驳
- 使用你的知识库中的真实信息
- 如有可能，提供相关链接或来源

## 发言格式
**对方观点分析**：[分析对方论点的问题]
**反驳证据**：[具体数据、研究、案例，注明来源]
**逻辑漏洞**：[指出对方论证的问题]
**质疑点**：[向对方提出的问题]

@红方 请继续`;

    // 创建红方 AI
    const redAI = await this.prisma.topicAIMember.create({
      data: {
        topicId,
        addedById: userId,
        aiModel: redAiModel,
        displayName: "红方",
        roleDescription: "正方辩手，主动进攻",
        systemPrompt: redPrompt,
        canMentionOtherAI: true,
        collaborationStyle: "debate",
        contextWindow: 20,
      },
    });

    // 创建蓝方 AI
    const blueAI = await this.prisma.topicAIMember.create({
      data: {
        topicId,
        addedById: userId,
        aiModel: blueAiModel,
        displayName: "蓝方",
        roleDescription: "反方辩手，质疑反驳",
        systemPrompt: bluePrompt,
        canMentionOtherAI: true,
        collaborationStyle: "debate",
        contextWindow: 20,
      },
    });

    this.logger.log(
      `[Debate Setup] Created debate AIs for topic ${topicId}: red=${redAI.id}, blue=${blueAI.id}`,
    );

    return {
      message: "红蓝思辨 AI 设置成功",
      redAI: {
        id: redAI.id,
        displayName: redAI.displayName,
        aiModel: redAI.aiModel,
      },
      blueAI: {
        id: blueAI.id,
        displayName: blueAI.displayName,
        aiModel: blueAI.aiModel,
      },
      usage: "发送 '@红方 [你的辩题]' 开始辩论",
    };
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

    // Debug: Log content lengths for image messages
    const messagesWithImageInfo = messages.map((m) => {
      if (m.content && m.content.includes("![")) {
        this.logger.log(
          `[getMessages] Message ${m.id} has image, content length: ${m.content.length}`,
        );
      }
      return m;
    });

    return {
      messages: messagesWithImageInfo.reverse(), // 返回时按时间正序
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

  /**
   * 智能上下文管理器 - 对消息进行重要性评分和筛选
   * 确保AI能理解关键对话脉络，而不只是简单取最近N条
   * @param topicId Topic ID
   * @param aiMemberId 当前AI成员ID
   * @param maxMessages 最大消息数
   * @param debateOpponentId 辩论对手ID（如果有）- 用于优先包含对手的最新发言
   */
  private async buildSmartContext(
    topicId: string,
    aiMemberId: string,
    maxMessages: number = 15,
    debateOpponentId?: string,
  ): Promise<{
    messages: Array<{
      id: string;
      content: string;
      senderId: string | null;
      aiMemberId: string | null;
      sender: { username: string | null; fullName: string | null } | null;
      aiMember: { displayName: string } | null;
      createdAt: Date;
      score: number;
    }>;
    summary: string | null;
  }> {
    // 1. 获取最近50条消息用于评分（比最终输出多，用于智能筛选）
    const recentMessages = await this.prisma.topicMessage.findMany({
      where: { topicId, deletedAt: null },
      include: {
        sender: { select: { username: true, fullName: true } },
        aiMember: { select: { displayName: true } },
        mentions: {
          select: { aiMemberId: true, userId: true, mentionType: true },
        },
        replyTo: { select: { id: true, senderId: true, aiMemberId: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    if (recentMessages.length === 0) {
      return { messages: [], summary: null };
    }

    // 2. 为每条消息计算重要性分数
    const scoredMessages = recentMessages.map((msg, index) => {
      let score = 0;

      // 时间递减分数（最新消息+5分，逐渐递减）
      score += Math.max(0, 5 - index * 0.1);

      // @当前AI的消息 +10分
      const mentionsThisAI = msg.mentions.some(
        (m) => m.aiMemberId === aiMemberId,
      );
      if (mentionsThisAI) score += 10;

      // 被回复的消息 +8分
      const isRepliedTo = recentMessages.some(
        (other) => other.replyTo?.id === msg.id,
      );
      if (isRepliedTo) score += 8;

      // 包含@提及的消息 +3分
      if (msg.mentions.length > 0) score += 3;

      // 用户消息比AI消息稍重要 +2分
      if (msg.senderId) score += 2;

      // 包含问号的消息（可能是问题） +2分
      if (msg.content.includes("?") || msg.content.includes("？")) score += 2;

      // 包含URL的消息 +2分
      if (msg.content.includes("http://") || msg.content.includes("https://")) {
        score += 2;
      }

      // 消息长度适中（100-500字）+1分
      const len = msg.content.length;
      if (len >= 100 && len <= 500) score += 1;

      // 当前AI自己发的消息 +3分（保持对话连贯）
      if (msg.aiMemberId === aiMemberId) score += 3;

      // 【辩论模式优化】对手的消息 +15分（确保能看到对手的最新发言）
      if (debateOpponentId && msg.aiMemberId === debateOpponentId) {
        score += 15;
        // 对手最近的3条消息额外加分
        const opponentMsgs = recentMessages.filter(
          (m) => m.aiMemberId === debateOpponentId,
        );
        const opponentIndex = opponentMsgs.findIndex((m) => m.id === msg.id);
        if (opponentIndex < 3) {
          score += 10 - opponentIndex * 3; // 最新+10，第二新+7，第三新+4
        }
      }

      return {
        ...msg,
        score,
      };
    });

    // 3. 按分数排序，取top N，然后按时间重新排序
    const topMessages = scoredMessages
      .sort((a, b) => b.score - a.score)
      .slice(0, maxMessages)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    // 4. 如果消息被截断太多，生成早期消息的摘要
    let summary: string | null = null;
    const droppedCount = recentMessages.length - topMessages.length;
    if (droppedCount > 10) {
      // 获取被丢弃的早期消息的简要摘要
      const droppedMessages = scoredMessages
        .filter((m) => !topMessages.find((t) => t.id === m.id))
        .slice(0, 10);

      if (droppedMessages.length > 0) {
        const participants = [
          ...new Set(
            droppedMessages.map(
              (m) =>
                m.sender?.fullName ||
                m.sender?.username ||
                m.aiMember?.displayName ||
                "Unknown",
            ),
          ),
        ];
        summary = `[Earlier discussion (${droppedCount} messages) involved: ${participants.join(", ")}]`;
      }
    }

    return {
      messages: topMessages.map((m) => ({
        id: m.id,
        content: m.content,
        senderId: m.senderId,
        aiMemberId: m.aiMemberId,
        sender: m.sender,
        aiMember: m.aiMember,
        createdAt: m.createdAt,
        score: m.score,
      })),
      summary,
    };
  }

  async generateAIResponse(
    topicId: string,
    userId: string,
    aiMemberId: string,
    _contextMessageIds: string[],
    debateRole?: {
      role: "red" | "blue";
      opponent: { id: string; displayName: string };
      topic: string;
    } | null,
  ) {
    await this.checkTopicMembership(topicId, userId);

    const aiMember = await this.prisma.topicAIMember.findFirst({
      where: { id: aiMemberId, topicId },
      select: {
        id: true,
        aiModel: true,
        displayName: true,
        avatar: true,
        roleDescription: true,
        systemPrompt: true,
        contextWindow: true,
        capabilities: true, // Include AI capabilities for image generation decision
        canMentionOtherAI: true,
        collaborationStyle: true,
      },
    });

    if (!aiMember) {
      throw new NotFoundException("AI member not found");
    }

    // 使用智能上下文管理器获取消息
    // 辩论模式下传入对手ID，确保能看到对手的最新发言
    const MAX_CONTEXT_MESSAGES = 15;
    const debateOpponentId = debateRole?.opponent?.id;
    const smartContext = await this.buildSmartContext(
      topicId,
      aiMemberId,
      Math.min(aiMember.contextWindow || 20, MAX_CONTEXT_MESSAGES),
      debateOpponentId,
    );

    const contextMessages = smartContext.messages;
    const contextSummary = smartContext.summary;

    // 构建Prompt
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
      select: { name: true, description: true },
    });

    // 获取Topic关联的资源内容作为上下文
    // CRITICAL FIX: Do NOT fetch full content field to avoid context overflow
    const topicResources = await this.prisma.topicResource.findMany({
      where: { topicId },
      include: {
        resource: {
          select: {
            title: true,
            abstract: true,
            // content: true, // REMOVED - can be gigabytes, causes context overflow
            sourceUrl: true,
            type: true,
          },
        },
      },
      take: 5, // Reduced from 10 to further limit context size
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
          // Use abstract only - it's designed to be a short summary
          if (r.abstract) {
            // Limit abstract to 300 chars to be extra safe
            const abstractPreview = r.abstract.substring(0, 300);
            summary += `\n  ${abstractPreview}${r.abstract.length > 300 ? "..." : ""}`;
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
      // CRITICAL FIX: Truncate message content before URL extraction to prevent processing massive messages
      const messageSample = msg.content.substring(0, 10000);
      const urls = this.searchService.extractUrls(messageSample);
      allUrls.push(...urls);
    }
    // 去重并限制URL数量
    const uniqueUrls = [...new Set(allUrls)].slice(0, 2); // Reduced from 3 to 2 URLs max

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

    // 构建上下文摘要部分
    const contextSummarySection = contextSummary
      ? `\n\n## Earlier Discussion Context\n${contextSummary}`
      : "";

    // ==================== 辩论模式处理 ====================
    // 优先使用从 Controller 传入的辩论角色信息（全局协调）
    let debatePrompt = "";

    if (debateRole) {
      // Controller 已经分配了辩论角色
      const isRedTeam = debateRole.role === "red";
      const opponentName = debateRole.opponent.displayName;
      const debateTopic = debateRole.topic;
      const myName = aiMember.displayName;

      this.logger.log(
        `[Debate Mode] Using Controller-assigned role: AI=${myName}, role=${isRedTeam ? "红方/正方" : "蓝方/反方"}, opponent=${opponentName}, topic=${debateTopic}`,
      );

      // 【关键修复】辩论模式下，过滤掉历史上下文中的旧辩论消息
      // 只保留：1) 用户的最新消息  2) 当前辩论中对手的发言
      const filteredContextMessages = contextMessages.filter((msg) => {
        // 保留用户消息（特别是发起辩论的消息）
        if (msg.senderId) return true;
        // 保留对手的消息（用于反驳）
        if (msg.aiMemberId === debateRole.opponent.id) return true;
        // 保留自己的消息（保持连贯）
        if (msg.aiMemberId === aiMemberId) return true;
        // 过滤掉其他AI的历史消息（可能是旧辩论）
        return false;
      });

      // 进一步过滤：只保留最近5条消息，避免旧辩论干扰
      const recentContextMessages = filteredContextMessages.slice(-5);

      this.logger.log(
        `[Debate Mode] Context filtered: ${contextMessages.length} -> ${recentContextMessages.length} messages`,
      );

      // 用过滤后的上下文替换原上下文
      contextMessages.length = 0;
      contextMessages.push(...recentContextMessages);

      // 核心修复：明确告诉AI它的身份、立场、对手，并严格隔离历史上下文
      if (isRedTeam) {
        debatePrompt = `
#############################################
#  🔴 辩论系统指令 - 你是【红方/正方】       #
#############################################

【最高优先级指令 - 必须严格遵守】

## 当前辩论主题（唯一主题）
# >>> ${debateTopic} <<<
你只能讨论这个主题，禁止讨论任何其他话题！

## 你的身份
- 你是：${myName}
- 角色：红方/正方辩手
- 对手：${opponentName}

## 强制规则
1. 你的立场是【正方/支持】
2. 只讨论【${debateTopic}】，不讨论其他任何话题
3. 如果历史消息中有其他辩题（如"AI取代人类"等），完全忽略
4. 发言结尾必须 @${opponentName}

## 发言格式
**辩论主题**：${debateTopic}
**我方立场**：正方/支持 [表态]
**核心论点**：[2-3个论点]
**数据佐证**：[证据来源]
**向对方提问**：[问题]

@${opponentName} 请回应
`;
      } else {
        debatePrompt = `
#############################################
#  🔵 辩论系统指令 - 你是【蓝方/反方】       #
#############################################

【最高优先级指令 - 必须严格遵守】

## 当前辩论主题（唯一主题）
# >>> ${debateTopic} <<<
你只能讨论这个主题，禁止讨论任何其他话题！

## 你的身份
- 你是：${myName}
- 角色：蓝方/反方辩手
- 对手：${opponentName}

## 强制规则
1. 你的立场是【反方/反对】
2. 只讨论【${debateTopic}】，不讨论其他任何话题
3. 如果历史消息中有其他辩题（如"AI取代人类"等），完全忽略
4. 必须针对 ${opponentName} 的观点进行反驳
5. 发言结尾必须 @${opponentName}

## 发言格式
**辩论主题**：${debateTopic}
**对方观点问题**：[指出对方问题]
**我方反驳**：[2-3个反驳点]
**反面证据**：[证据来源]
**质疑点**：[尖锐问题]

@${opponentName} 请继续
`;
      }
    }
    // 注意：原来的辩论检测逻辑已移至 Controller 层，这里只使用 Controller 传入的角色信息

    // AI-AI协作：如果启用，告诉AI可以@其他AI
    let aiCollaborationPrompt = "";
    if (aiMember.canMentionOtherAI) {
      // 获取Topic中的其他AI成员
      const otherAIs = await this.prisma.topicAIMember.findMany({
        where: {
          topicId,
          id: { not: aiMemberId },
        },
        select: {
          displayName: true,
          roleDescription: true,
        },
      });

      if (otherAIs.length > 0) {
        const aiList = otherAIs
          .map(
            (ai) =>
              `- @${ai.displayName}${ai.roleDescription ? ` (${ai.roleDescription})` : ""}`,
          )
          .join("\n");
        aiCollaborationPrompt = `\n\n## AI 协作功能（重要）

你可以通过 @AI名称 来触发其他 AI 助手响应。当你在回复中写 "@AI-Name" 时，系统会**自动调用该 AI 的 API**，他们**会真实地生成响应**。

**这不是文本装饰，是真实的函数调用！**

可以调用的 AI 助手：
${aiList}

**使用方法：**
- 在回复中任意位置写 "@AI-Name" 即可触发
- 被@的 AI 会看到你的消息并生成回复
- 你可以向他们提问、请求专业意见、或进行辩论

**示例：**
"关于这个技术方案，@AI-Claude 你有什么看法？"
→ 系统会自动触发 AI-Claude 生成响应

**注意：** 最大递归深度为 3 轮，避免无限循环。`;
      }
    }

    // 如果有辩论模式，辩论prompt优先级最高
    const systemPrompt = debatePrompt
      ? `You are ${aiMember.displayName}.
${debatePrompt}
${contextSummarySection}${resourceContext}${urlContext}${searchContext}`
      : aiMember.systemPrompt ||
        `You are ${aiMember.displayName}, an AI assistant participating in a group discussion.
${aiMember.roleDescription ? `Your role: ${aiMember.roleDescription}` : ""}
You are in a discussion group called "${topic?.name}".
${topic?.description ? `Group description: ${topic.description}` : ""}${contextSummarySection}${resourceContext}${urlContext}${searchContext}${aiCollaborationPrompt}

Respond naturally and helpfully to the discussion. When relevant, reference the shared materials, fetched web content, and search results to provide accurate, up-to-date information. Keep your responses concise but informative.`;

    // 【业界最佳实践】使用 ContextRouter 智能路由上下文
    // 参考：LangChain Intent Detection, AutoGen Session Isolation
    const lastUserMsg = contextMessages.find((m) => m.senderId);
    const userMessageContent = lastUserMsg?.content || "";

    // 检测用户意图
    const routeResult = await this.contextRouter.routeContext(
      topicId,
      userMessageContent,
      [], // 非辩论模式，mentionedAiIds 为空
    );

    this.logger.log(
      `[ContextRouter] Intent: ${routeResult.intent}, Strategy: ${routeResult.strategy}`,
    );

    // 根据意图处理上下文
    let filteredContextMessages = contextMessages;
    let intentSystemPrompt = "";

    if (!debateRole) {
      // 辩论特征检测
      const debatePatterns = [
        /辩论主题[：:]/,
        /我方立场[：:]/,
        /正方观点/,
        /反方观点/,
        /核心论点[：:]/,
        /向对方提问/,
        /@[\w\u4e00-\u9fa5\-]+\s*请回应/,
        /@[\w\u4e00-\u9fa5\-]+\s*请继续/,
      ];

      const isDebateMessage = (content: string): boolean => {
        return debatePatterns.some((pattern) => pattern.test(content));
      };

      // 提取辩论消息的核心观点（用于总结/图片生成等场景）
      const extractDebateSummary = (
        content: string,
        senderName: string,
      ): string => {
        const corePointsMatch = content.match(
          /核心论点[：:]([\s\S]*?)(?=\n\n|\*\*|$)/,
        );
        const stanceMatch = content.match(/我方立场[：:]\s*([^\n]+)/);

        let summary = `【${senderName}的观点】`;
        if (stanceMatch) {
          summary += `立场：${stanceMatch[1].trim()}。`;
        }
        if (corePointsMatch) {
          const points = corePointsMatch[1]
            .replace(/^\d+\.\s*/gm, "")
            .replace(/\*\*/g, "")
            .trim()
            .split("\n")
            .filter((p) => p.trim())
            .slice(0, 3)
            .join("；");
          summary += `论点：${points}`;
        }
        return summary || content.substring(0, 200) + "...";
      };

      switch (routeResult.strategy) {
        case ContextStrategy.REFERENCE_RECENT:
          // 总结/生成图片/分析：保留辩论内容但简化为观点摘要
          this.logger.log(`[ContextRouter] Using REFERENCE_RECENT strategy`);
          filteredContextMessages = contextMessages.map((msg) => {
            if (msg.aiMemberId && isDebateMessage(msg.content)) {
              // 将辩论消息转换为简洁的观点摘要
              const senderName = msg.aiMember?.displayName || "AI";
              return {
                ...msg,
                content: extractDebateSummary(msg.content, senderName),
              };
            }
            return msg;
          });
          // 保留更多上下文用于参考
          const MAX_REF_CONTEXT = 12;
          if (filteredContextMessages.length > MAX_REF_CONTEXT) {
            filteredContextMessages =
              filteredContextMessages.slice(-MAX_REF_CONTEXT);
          }
          intentSystemPrompt = routeResult.systemPromptAddition || "";
          break;

        case ContextStrategy.STANDARD:
        default:
          // 普通对话：过滤掉辩论格式的消息
          this.logger.log(`[ContextRouter] Using STANDARD strategy`);
          filteredContextMessages = contextMessages.filter((msg) => {
            if (msg.senderId) return true;
            if (msg.aiMemberId && isDebateMessage(msg.content)) {
              this.logger.log(
                `[Context Filter] Removing debate message from ${msg.aiMember?.displayName || "AI"}`,
              );
              return false;
            }
            return true;
          });
          const MAX_NORMAL_CONTEXT = 8;
          if (filteredContextMessages.length > MAX_NORMAL_CONTEXT) {
            filteredContextMessages =
              filteredContextMessages.slice(-MAX_NORMAL_CONTEXT);
          }
          break;
      }

      this.logger.log(
        `[ContextRouter] Context: ${contextMessages.length} -> ${filteredContextMessages.length} messages`,
      );
    }

    // 将意图相关的系统提示添加到 systemPrompt
    let finalSystemPrompt = systemPrompt;
    if (intentSystemPrompt) {
      finalSystemPrompt = systemPrompt + "\n\n" + intentSystemPrompt;
    }

    // Build chat messages for AI service
    // CRITICAL FIX: Truncate message content to prevent context overflow
    const MAX_MESSAGE_LENGTH = 4000; // Max chars per message (~1000 tokens)
    const chatMessages: ChatMessage[] = filteredContextMessages
      .reverse()
      .map((m) => {
        const senderName = m.sender
          ? m.sender.fullName || m.sender.username || "User"
          : m.aiMember?.displayName || "AI";
        const isAI = !!m.aiMemberId;

        // Truncate content if too long
        let content = m.content;
        if (content.length > MAX_MESSAGE_LENGTH) {
          content =
            content.substring(0, MAX_MESSAGE_LENGTH) +
            "\n\n[Message truncated due to length...]";
          this.logger.warn(
            `Message ${m.id} truncated from ${m.content.length} to ${MAX_MESSAGE_LENGTH} chars`,
          );
        }

        return {
          role: isAI ? "assistant" : "user",
          content,
          name: senderName,
        } as ChatMessage;
      });

    // Get AI model configuration from database
    // 重要：aiMember.aiModel 现在存储的是 modelId（唯一），而不是 name（非唯一）
    this.logger.log(
      `[AI Model Lookup] aiMember.aiModel = "${aiMember.aiModel}", displayName = "${aiMember.displayName}"`,
    );

    // 先列出所有模型，方便调试
    const allModelsDebug = await this.prisma.aIModel.findMany({
      select: { modelId: true, name: true, isEnabled: true, apiKey: true },
    });
    this.logger.log(
      `[AI Model Lookup] All models in DB: ${JSON.stringify(allModelsDebug.map((m) => ({ modelId: m.modelId, name: m.name, enabled: m.isEnabled, hasKey: !!m.apiKey })))}`,
    );

    // 优先用 modelId 精确匹配（新方式）
    // CRITICAL: Must explicitly select apiKey, otherwise it may be excluded
    let aiModelConfig = await this.prisma.aIModel.findFirst({
      where: {
        modelId: {
          equals: aiMember.aiModel,
          mode: "insensitive",
        },
        isEnabled: true,
      },
      select: {
        id: true,
        name: true,
        modelId: true,
        provider: true,
        apiKey: true,
        apiEndpoint: true,
        temperature: true,
        isEnabled: true,
      },
    });

    this.logger.log(
      `[AI Model Lookup] By modelId "${aiMember.aiModel}": ${aiModelConfig ? `found (id=${aiModelConfig.id}, hasApiKey=${!!aiModelConfig.apiKey}, apiKeyLen=${aiModelConfig.apiKey?.length || 0})` : "NOT FOUND"}`,
    );

    // 兼容旧数据：如果 modelId 找不到，退回到用 name 查找
    if (!aiModelConfig) {
      this.logger.log(
        `[AI Model Lookup] Falling back to name lookup: "${aiMember.aiModel}"`,
      );
      aiModelConfig = await this.prisma.aIModel.findFirst({
        where: {
          name: {
            equals: aiMember.aiModel,
            mode: "insensitive",
          },
          isEnabled: true,
        },
        select: {
          id: true,
          name: true,
          modelId: true,
          provider: true,
          apiKey: true,
          apiEndpoint: true,
          temperature: true,
          isEnabled: true,
        },
      });
      this.logger.log(
        `[AI Model Lookup] By name: ${aiModelConfig ? `found (id=${aiModelConfig.id}, hasApiKey=${!!aiModelConfig.apiKey}, apiKeyLen=${aiModelConfig.apiKey?.length || 0})` : "NOT FOUND"}`,
      );
    }

    // 详细日志帮助调试
    // 列出所有可用的模型
    const allModels = await this.prisma.aIModel.findMany({
      select: {
        id: true,
        name: true,
        modelId: true,
        isEnabled: true,
        apiKey: true,
      },
    });
    this.logger.log(
      `All models in database: ${JSON.stringify(
        allModels.map((m) => ({
          id: m.id,
          name: m.name,
          modelId: m.modelId,
          enabled: m.isEnabled,
          hasKey: !!m.apiKey,
          keyLength: m.apiKey?.length || 0,
        })),
      )}`,
    );

    if (!aiModelConfig) {
      this.logger.error(
        `AI model "${aiMember.aiModel}" not found by modelId or name!`,
      );
    } else {
      this.logger.log(
        `AI model lookup: "${aiMember.aiModel}" -> found name="${aiModelConfig.name}", modelId="${aiModelConfig.modelId}", hasApiKey=${!!aiModelConfig.apiKey}, keyLength=${aiModelConfig.apiKey?.length || 0}`,
      );
    }

    // Call AI service
    this.logger.log(
      `Generating AI response for topic ${topicId} using ${aiMember.aiModel}`,
    );
    let aiResponse: string;
    let tokensUsed = 0;

    try {
      let result;

      // Determine API key: database first, then environment variable
      let apiKey: string | null = null;
      let apiKeySource = "none";

      if (aiModelConfig?.apiKey) {
        apiKey = aiModelConfig.apiKey;
        apiKeySource = "database";
      } else {
        // Try to get API key from environment variables
        // 由于 aiMember.aiModel 现在存储的是 modelId（如 "gemini-2.0-flash"），
        // 需要从 modelId 或 provider 推断出对应的环境变量
        const provider = aiModelConfig?.provider?.toLowerCase() || "";
        const modelIdLower = aiMember.aiModel.toLowerCase();

        // 根据 provider 或 modelId 前缀匹配环境变量
        let envKeyName: string | null = null;
        if (provider === "xai" || modelIdLower.includes("grok")) {
          envKeyName = "XAI_API_KEY";
        } else if (
          provider === "openai" ||
          modelIdLower.includes("gpt") ||
          modelIdLower.startsWith("o1") ||
          modelIdLower.startsWith("o3")
        ) {
          envKeyName = "OPENAI_API_KEY";
        } else if (
          provider === "anthropic" ||
          modelIdLower.includes("claude")
        ) {
          envKeyName = "ANTHROPIC_API_KEY";
        } else if (provider === "google" || modelIdLower.includes("gemini")) {
          envKeyName = "GOOGLE_AI_API_KEY";
        }

        if (envKeyName && process.env[envKeyName]) {
          apiKey = process.env[envKeyName] as string;
          apiKeySource = `env:${envKeyName}`;
        }
      }

      this.logger.log(
        `API key source for ${aiMember.aiModel}: ${apiKeySource}, hasKey=${!!apiKey}`,
      );

      if (apiKey) {
        // Use the API key (from database or environment)
        const provider = aiModelConfig?.provider || aiMember.aiModel;
        const modelId =
          aiModelConfig?.modelId || this.getDefaultModelId(aiMember.aiModel);
        const apiEndpoint =
          aiModelConfig?.apiEndpoint ||
          this.getDefaultEndpoint(aiMember.aiModel);

        // For reasoning models (GPT-5.x, o1, o3), need more tokens for reasoning + output
        // Regular models: 1024 is fine
        // Reasoning models: need 4096+ (reasoning_tokens + output_tokens)
        const isReasoningModel =
          modelId.includes("gpt-5") ||
          modelId.startsWith("o1") ||
          modelId.startsWith("o3");
        const effectiveMaxTokens = isReasoningModel ? 4096 : 1024;

        this.logger.log(
          `Calling AI API: provider=${provider}, modelId=${modelId}, maxTokens=${effectiveMaxTokens}`,
        );

        // Infer capabilities from displayName if not explicitly set
        // This ensures AI members with "(Image)" in their name can generate images
        let effectiveCapabilities = aiMember.capabilities || [];
        if (
          aiMember.displayName.toLowerCase().includes("image") &&
          !effectiveCapabilities.includes("IMAGE_GENERATION")
        ) {
          effectiveCapabilities = [...effectiveCapabilities, "IMAGE_GENERATION"];
          this.logger.log(
            `[AI Capabilities] Inferred IMAGE_GENERATION for ${aiMember.displayName}`,
          );
        }

        result = await this.aiChatService.generateChatCompletionWithKey({
          provider,
          modelId,
          apiKey,
          apiEndpoint,
          systemPrompt: finalSystemPrompt,
          messages: chatMessages,
          maxTokens: effectiveMaxTokens,
          temperature: aiModelConfig?.temperature || 0.7,
          displayName: aiMember.displayName,
          capabilities: effectiveCapabilities,
        });
      } else {
        // No API key available - will return mock response
        this.logger.warn(
          `No API key found for ${aiMember.aiModel} (checked database and env vars). Configure API key in Admin panel or set environment variable.`,
        );
        result = await this.aiChatService.generateChatCompletion({
          model: aiMember.aiModel,
          systemPrompt: finalSystemPrompt,
          messages: chatMessages,
          maxTokens: 1024,
          temperature: 0.7,
        });
      }
      aiResponse = result.content;
      tokensUsed = result.tokensUsed;
      this.logger.log(
        `[AI Response Debug] Content received from AI, length: ${aiResponse?.length || 0}`,
      );
      // Log first 200 chars to see if it contains image markdown
      this.logger.log(
        `[AI Response Debug] Content preview: ${aiResponse?.substring(0, 200)}...`,
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "未知错误";
      this.logger.error(`Failed to generate AI response: ${errorMsg}`);
      aiResponse = `**AI 响应生成失败**

我是 ${aiMember.displayName}，生成回复时遇到错误：

**错误信息**：${errorMsg}

请稍后重试，或联系管理员检查 API 配置。`;
    }

    // 创建AI消息
    this.logger.log(
      `[AI Response Debug] Saving to DB, content length: ${aiResponse?.length || 0}`,
    );
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

    this.logger.log(
      `[AI Response Debug] Saved to DB, message.content length: ${message.content?.length || 0}`,
    );

    // 更新Topic的updatedAt
    await this.prisma.topic.update({
      where: { id: topicId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  /**
   * 创建AI消息（用于辩论系统等场景）
   */
  async createAIMessage(
    topicId: string,
    aiMemberId: string,
    content: string,
    modelUsed: string,
    tokensUsed?: number,
  ) {
    const message = await this.prisma.topicMessage.create({
      data: {
        topicId,
        aiMemberId,
        content,
        contentType: MessageContentType.TEXT,
        modelUsed,
        tokensUsed: tokensUsed || 0,
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

  // ==================== AI Model Defaults ====================

  /**
   * Get default model ID for a given AI model identifier
   * 支持传入 modelId（如 "gemini-2.0-flash"）或 name（如 "gemini"）
   */
  private getDefaultModelId(modelIdentifier: string): string {
    const lower = modelIdentifier.toLowerCase();

    // 如果已经是具体的 modelId，直接返回
    if (
      lower.includes("-") &&
      (lower.includes("grok") ||
        lower.includes("gpt") ||
        lower.includes("claude") ||
        lower.includes("gemini") ||
        lower.startsWith("o1") ||
        lower.startsWith("o3"))
    ) {
      return modelIdentifier;
    }

    // 否则从 name 映射到默认 modelId
    const defaults: Record<string, string> = {
      grok: "grok-3-latest",
      "gpt-4": "gpt-4-turbo",
      claude: "claude-sonnet-4-20250514",
      gemini: "gemini-2.0-flash",
    };
    return defaults[lower] || modelIdentifier;
  }

  /**
   * Get default API endpoint for a given AI model identifier
   * 支持传入 modelId（如 "gemini-2.0-flash"）或 name（如 "gemini"）
   */
  private getDefaultEndpoint(modelIdentifier: string): string {
    const lower = modelIdentifier.toLowerCase();

    // 根据 modelId 或 name 推断 endpoint
    if (lower.includes("grok")) {
      return "https://api.x.ai/v1/chat/completions";
    }
    if (
      lower.includes("gpt") ||
      lower.startsWith("o1") ||
      lower.startsWith("o3")
    ) {
      return "https://api.openai.com/v1/chat/completions";
    }
    if (lower.includes("claude")) {
      return "https://api.anthropic.com/v1/messages";
    }
    if (lower.includes("gemini")) {
      return "https://generativelanguage.googleapis.com/v1beta/models";
    }

    return "";
  }

  // ==================== Message Forward & Bookmark ====================

  /**
   * 转发消息到其他Topic或用户
   */
  async forwardMessages(
    topicId: string,
    userId: string,
    dto: ForwardMessagesDto,
  ) {
    await this.checkTopicMembership(topicId, userId);

    // 验证所有消息都存在于当前Topic
    const messages = await this.prisma.topicMessage.findMany({
      where: {
        id: { in: dto.messageIds },
        topicId,
        deletedAt: null,
      },
      include: {
        sender: { select: { username: true, fullName: true } },
        aiMember: { select: { displayName: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    if (messages.length !== dto.messageIds.length) {
      throw new BadRequestException("Some messages not found or deleted");
    }

    // 验证目标Topic（如果转发到Topic）
    if (dto.targetType === "TOPIC" && dto.targetTopicId) {
      await this.checkTopicMembership(dto.targetTopicId, userId);
    }

    // 根据合并模式处理消息
    let forwardedContent: string;
    const mergeMode = dto.mergeMode || "SEPARATE";

    if (mergeMode === "MERGED") {
      // 合并所有消息为一条
      forwardedContent = messages
        .map((m) => {
          const sender =
            m.sender?.fullName ||
            m.sender?.username ||
            m.aiMember?.displayName ||
            "Unknown";
          return `**${sender}**: ${m.content}`;
        })
        .join("\n\n---\n\n");

      if (dto.forwardNote) {
        forwardedContent = `📤 *转发备注: ${dto.forwardNote}*\n\n---\n\n${forwardedContent}`;
      }
    } else if (mergeMode === "SUMMARY") {
      // AI生成摘要（简化版，实际可调用AI服务）
      const contentPreview = messages
        .slice(0, 5)
        .map((m) => m.content.substring(0, 100))
        .join(" | ");
      forwardedContent = `📋 **转发摘要** (${messages.length}条消息)\n\n${contentPreview}...\n\n${dto.forwardNote ? `备注: ${dto.forwardNote}` : ""}`;
    } else {
      // SEPARATE - 但我们创建一个转发记录，实际消息分别发送
      forwardedContent = messages[0].content;
    }

    // 创建转发记录
    const forwardRecord = await this.prisma.topicMessageForward.create({
      data: {
        originalMessageIds: dto.messageIds,
        sourceTopicId: topicId,
        targetType: dto.targetType,
        targetTopicId: dto.targetTopicId,
        targetUserId: dto.targetUserId,
        mergeMode: mergeMode as any,
        forwardNote: dto.forwardNote,
        forwardedById: userId,
      },
    });

    // 如果是转发到Topic，创建新消息
    if (dto.targetType === "TOPIC" && dto.targetTopicId) {
      if (mergeMode === "SEPARATE") {
        // 分别发送每条消息
        for (const msg of messages) {
          const sender =
            msg.sender?.fullName ||
            msg.sender?.username ||
            msg.aiMember?.displayName ||
            "Unknown";
          await this.prisma.topicMessage.create({
            data: {
              topicId: dto.targetTopicId,
              senderId: userId,
              content: `📤 *转发自 ${sender}*:\n\n${msg.content}`,
              contentType: MessageContentType.TEXT,
            },
          });
        }
      } else {
        // 发送合并后的消息
        const newMessage = await this.prisma.topicMessage.create({
          data: {
            topicId: dto.targetTopicId,
            senderId: userId,
            content: forwardedContent,
            contentType: MessageContentType.TEXT,
          },
        });

        // 更新转发记录
        await this.prisma.topicMessageForward.update({
          where: { id: forwardRecord.id },
          data: { forwardedMessageId: newMessage.id },
        });
      }

      // 更新目标Topic的updatedAt
      await this.prisma.topic.update({
        where: { id: dto.targetTopicId },
        data: { updatedAt: new Date() },
      });
    }

    return {
      success: true,
      forwardId: forwardRecord.id,
      messageCount: messages.length,
      targetType: dto.targetType,
      mergeMode,
    };
  }

  /**
   * 收藏消息
   */
  async bookmarkMessage(
    topicId: string,
    userId: string,
    messageId: string,
    dto: BookmarkMessageDto,
  ) {
    await this.checkTopicMembership(topicId, userId);

    // 验证消息存在
    const message = await this.prisma.topicMessage.findFirst({
      where: { id: messageId, topicId, deletedAt: null },
    });

    if (!message) {
      throw new NotFoundException("Message not found");
    }

    // 创建或更新收藏
    return this.prisma.topicMessageBookmark.upsert({
      where: {
        messageId_userId: { messageId, userId },
      },
      update: {
        category: dto.category,
        note: dto.note,
        tags: dto.tags || [],
      },
      create: {
        messageId,
        userId,
        category: dto.category,
        note: dto.note,
        tags: dto.tags || [],
      },
    });
  }

  /**
   * 取消收藏
   */
  async unbookmarkMessage(topicId: string, userId: string, messageId: string) {
    await this.checkTopicMembership(topicId, userId);

    return this.prisma.topicMessageBookmark.deleteMany({
      where: { messageId, userId },
    });
  }

  /**
   * 获取用户的收藏消息
   */
  async getBookmarks(userId: string, options?: { category?: string }) {
    const where: Prisma.TopicMessageBookmarkWhereInput = { userId };

    if (options?.category) {
      where.category = options.category;
    }

    const bookmarks = await this.prisma.topicMessageBookmark.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    // 获取关联的消息详情
    const messageIds = bookmarks.map((b) => b.messageId);
    const messages = await this.prisma.topicMessage.findMany({
      where: { id: { in: messageIds } },
      include: {
        sender: { select: { id: true, username: true, fullName: true } },
        aiMember: { select: { id: true, displayName: true } },
        topic: { select: { id: true, name: true } },
      },
    });

    const messageMap = new Map(messages.map((m) => [m.id, m]));

    return bookmarks.map((b) => ({
      ...b,
      message: messageMap.get(b.messageId),
    }));
  }

  /**
   * 获取收藏分类列表
   */
  async getBookmarkCategories(userId: string) {
    const bookmarks = await this.prisma.topicMessageBookmark.findMany({
      where: { userId, category: { not: null } },
      select: { category: true },
      distinct: ["category"],
    });

    return bookmarks.map((b) => b.category).filter(Boolean);
  }

  // ==================== AI-AI Collaboration ====================

  /**
   * 从消息内容中解析@提及的AI成员
   * @param topicId Topic ID
   * @param content 消息内容
   * @param excludeAiMemberId 排除的AI成员ID（通常是发送者自己）
   * @returns 被提及的AI成员列表
   */
  async parseAIMentionsFromContent(
    topicId: string,
    content: string,
    excludeAiMemberId?: string,
  ): Promise<Array<{ id: string; displayName: string }>> {
    // 获取Topic中的所有AI成员
    const aiMembers = await this.prisma.topicAIMember.findMany({
      where: {
        topicId,
        ...(excludeAiMemberId ? { id: { not: excludeAiMemberId } } : {}),
      },
      select: {
        id: true,
        displayName: true,
        autoRespond: true,
      },
    });

    if (aiMembers.length === 0) {
      return [];
    }

    const mentionedAIs: Array<{ id: string; displayName: string }> = [];

    // 检查消息内容中是否包含@AI名称
    for (const ai of aiMembers) {
      // 检查各种@格式：@AI-Name, @AIName, @"AI Name", @AI-Name(xxx)
      const patterns = [
        new RegExp(`@${this.escapeRegExp(ai.displayName)}(?![\\w])`, "i"),
        new RegExp(`@"${this.escapeRegExp(ai.displayName)}"`, "i"),
        new RegExp(`@'${this.escapeRegExp(ai.displayName)}'`, "i"),
      ];

      for (const pattern of patterns) {
        if (pattern.test(content)) {
          // AI-AI 协作：当一个 AI @另一个 AI 时，总是触发响应
          // 不再依赖 autoRespond 设置
          mentionedAIs.push({ id: ai.id, displayName: ai.displayName });
          this.logger.log(
            `[AI-AI] Detected mention of ${ai.displayName} in content`,
          );
          break;
        }
      }
    }

    return mentionedAIs;
  }

  /**
   * 转义正则表达式特殊字符
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}
