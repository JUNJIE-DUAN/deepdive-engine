import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateNoteDto, UpdateNoteDto, AddHighlightDto } from "./dto";

/**
 * 笔记服务
 *
 * 核心功能：
 * 1. Markdown笔记的CRUD
 * 2. 高亮和标注管理
 * 3. AI洞察集成
 * 4. 知识图谱节点关联
 */
@Injectable()
export class NotesService {
  private readonly logger = new Logger(NotesService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 创建笔记
   */
  async createNote(userId: string, dto: CreateNoteDto) {
    const note = await this.prisma.note.create({
      data: {
        userId,
        resourceId: dto.resourceId,
        content: dto.content,
        highlights: dto.highlights || [],
        tags: dto.tags || [],
        isPublic: dto.isPublic ?? false,
      },
      include: {
        resource: {
          select: {
            id: true,
            type: true,
            title: true,
          },
        },
      },
    });

    this.logger.log(
      `Note created for resource ${dto.resourceId} by user ${userId}`,
    );

    return note;
  }

  /**
   * 获取用户的所有笔记
   */
  async getUserNotes(userId: string, skip = 0, take = 50) {
    const [notes, total] = await Promise.all([
      this.prisma.note.findMany({
        where: { userId },
        include: {
          resource: {
            select: {
              id: true,
              type: true,
              title: true,
              thumbnailUrl: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
        skip,
        take,
      }),
      this.prisma.note.count({
        where: { userId },
      }),
    ]);

    return {
      notes,
      total,
      skip,
      take,
    };
  }

  /**
   * 获取资源的笔记
   */
  async getResourceNotes(resourceId: string, userId?: string) {
    let where: any;

    // 如果没有提供userId，只返回公开笔记
    if (!userId) {
      where = {
        resourceId,
        isPublic: true,
      };
    } else {
      // 返回公开笔记或用户自己的笔记
      where = {
        resourceId,
        OR: [{ isPublic: true }, { userId }],
      };
    }

    const notes = await this.prisma.note.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return notes;
  }

  /**
   * 获取单个笔记
   */
  async getNote(noteId: string, userId?: string) {
    const note = await this.prisma.note.findUnique({
      where: { id: noteId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        resource: true,
      },
    });

    if (!note) {
      throw new NotFoundException("Note not found");
    }

    // 检查权限：公开笔记或者是笔记所有者
    if (!note.isPublic && note.userId !== userId) {
      throw new ForbiddenException("You do not have access to this note");
    }

    return note;
  }

  /**
   * 更新笔记
   */
  async updateNote(noteId: string, userId: string, dto: UpdateNoteDto) {
    // 验证所有权
    const note = await this.prisma.note.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      throw new NotFoundException("Note not found");
    }

    if (note.userId !== userId) {
      throw new ForbiddenException("You can only update your own notes");
    }

    const updated = await this.prisma.note.update({
      where: { id: noteId },
      data: {
        content: dto.content,
        highlights: dto.highlights,
        tags: dto.tags,
        isPublic: dto.isPublic,
        aiInsights: dto.aiInsights,
        graphNodes: dto.graphNodes,
      },
      include: {
        resource: {
          select: {
            id: true,
            type: true,
            title: true,
          },
        },
      },
    });

    this.logger.log(`Note ${noteId} updated by user ${userId}`);

    return updated;
  }

  /**
   * 删除笔记
   */
  async deleteNote(noteId: string, userId: string) {
    // 验证所有权
    const note = await this.prisma.note.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      throw new NotFoundException("Note not found");
    }

    if (note.userId !== userId) {
      throw new ForbiddenException("You can only delete your own notes");
    }

    await this.prisma.note.delete({
      where: { id: noteId },
    });

    this.logger.log(`Note ${noteId} deleted by user ${userId}`);

    return { success: true };
  }

  /**
   * 添加高亮标注
   */
  async addHighlight(noteId: string, userId: string, dto: AddHighlightDto) {
    // 验证所有权
    const note = await this.prisma.note.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      throw new NotFoundException("Note not found");
    }

    if (note.userId !== userId) {
      throw new ForbiddenException("You can only modify your own notes");
    }

    // 获取现有高亮
    const currentHighlights = (note.highlights as any[]) || [];

    // 添加新高亮
    const newHighlight = {
      id: Math.random().toString(36).substr(2, 9),
      text: dto.text,
      startOffset: dto.startOffset,
      endOffset: dto.endOffset,
      color: dto.color || "#ffeb3b",
      note: dto.note,
      createdAt: new Date().toISOString(),
    };

    currentHighlights.push(newHighlight);

    const updated = await this.prisma.note.update({
      where: { id: noteId },
      data: {
        highlights: currentHighlights,
      },
    });

    this.logger.log(`Highlight added to note ${noteId}`);

    return updated;
  }

  /**
   * 删除高亮标注
   */
  async removeHighlight(noteId: string, userId: string, highlightId: string) {
    // 验证所有权
    const note = await this.prisma.note.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      throw new NotFoundException("Note not found");
    }

    if (note.userId !== userId) {
      throw new ForbiddenException("You can only modify your own notes");
    }

    // 移除高亮
    const currentHighlights = (note.highlights as any[]) || [];
    const filteredHighlights = currentHighlights.filter(
      (h: any) => h.id !== highlightId,
    );

    const updated = await this.prisma.note.update({
      where: { id: noteId },
      data: {
        highlights: filteredHighlights,
      },
    });

    this.logger.log(`Highlight ${highlightId} removed from note ${noteId}`);

    return updated;
  }

  /**
   * 请求AI解释
   */
  async requestAIExplanation(noteId: string, userId: string, text: string) {
    // 验证所有权
    const note = await this.prisma.note.findUnique({
      where: { id: noteId },
      include: {
        resource: true,
      },
    });

    if (!note) {
      throw new NotFoundException("Note not found");
    }

    if (note.userId !== userId) {
      throw new ForbiddenException("You can only modify your own notes");
    }

    // 调用AI服务获取解释
    let explanation = "AI服务暂时不可用";

    try {
      const aiServiceUrl =
        process.env.AI_SERVICE_URL || "http://localhost:5000";
      const response = await fetch(`${aiServiceUrl}/api/v1/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `请解释以下文本的含义和重要性：\n\n${text}`,
          context: note.resource
            ? `资源标题: ${note.resource.title}\n摘要: ${note.resource.abstract || "无"}`
            : undefined,
          model: "grok",
          stream: false,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        explanation = data.content || explanation;
      } else {
        this.logger.warn(`AI service returned error: ${response.status}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to call AI service: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }

    const aiExplanation = {
      text,
      explanation,
      timestamp: new Date().toISOString(),
    };

    // 更新笔记的AI洞察
    const currentInsights = (note.aiInsights as any) || { explanations: [] };
    if (!currentInsights.explanations) {
      currentInsights.explanations = [];
    }
    currentInsights.explanations.push(aiExplanation);

    await this.prisma.note.update({
      where: { id: noteId },
      data: {
        aiInsights: currentInsights,
      },
    });

    this.logger.log(`AI explanation requested for note ${noteId}`);

    return aiExplanation;
  }

  /**
   * 关联知识图谱节点
   */
  async linkGraphNode(
    noteId: string,
    userId: string,
    nodeId: string,
    nodeType: string,
  ) {
    // 验证所有权
    const note = await this.prisma.note.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      throw new NotFoundException("Note not found");
    }

    if (note.userId !== userId) {
      throw new ForbiddenException("You can only modify your own notes");
    }

    // 获取现有图谱节点
    const currentNodes = (note.graphNodes as any[]) || [];

    // 检查是否已存在
    const exists = currentNodes.some((node: any) => node.id === nodeId);
    if (exists) {
      return note;
    }

    // 添加新节点
    const newNode = {
      id: nodeId,
      type: nodeType,
      linkedAt: new Date().toISOString(),
    };

    currentNodes.push(newNode);

    const updated = await this.prisma.note.update({
      where: { id: noteId },
      data: {
        graphNodes: currentNodes,
      },
    });

    this.logger.log(`Graph node ${nodeId} linked to note ${noteId}`);

    return updated;
  }
}
