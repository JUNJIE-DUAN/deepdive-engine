import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { InputJsonValue } from "@prisma/client/runtime/library";
import { SendChatMessageDto, CreateNoteDto, UpdateNoteDto } from "./dto";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  citations?: string[];
}

@Injectable()
export class AiStudioChatService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get or create the current chat session for a project
   */
  async getCurrentChat(userId: string, projectId: string) {
    // Verify project ownership
    const project = await this.prisma.researchProject.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    if (project.userId !== userId) {
      throw new ForbiddenException("Access denied");
    }

    // Get the most recent chat or create a new one
    let chat = await this.prisma.researchProjectChat.findFirst({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });

    if (!chat) {
      chat = await this.prisma.researchProjectChat.create({
        data: {
          projectId,
          messages: [],
          title: "New Chat",
        },
      });

      // Update chat count
      await this.prisma.researchProject.update({
        where: { id: projectId },
        data: { chatCount: { increment: 1 } },
      });
    }

    return chat;
  }

  /**
   * Send a message in a chat session
   * Returns the user message (AI response is handled separately by streaming)
   */
  async sendMessage(
    userId: string,
    projectId: string,
    dto: SendChatMessageDto,
  ) {
    const chat = await this.getCurrentChat(userId, projectId);

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: dto.message,
      timestamp: new Date().toISOString(),
    };

    // Get current messages and add the new one
    const messages = (chat.messages as unknown as ChatMessage[]) || [];
    messages.push(userMessage);

    // Update the chat with the new message
    await this.prisma.researchProjectChat.update({
      where: { id: chat.id },
      data: {
        messages: messages as unknown as InputJsonValue,
        modelUsed: dto.model || "gpt-4",
      },
    });

    // Get selected sources for context
    let sourceContext: any[] = [];
    if (dto.selectedSourceIds && dto.selectedSourceIds.length > 0) {
      const sources = await this.prisma.researchProjectSource.findMany({
        where: {
          id: { in: dto.selectedSourceIds },
          projectId,
        },
        select: {
          id: true,
          title: true,
          abstract: true,
          content: true,
          sourceType: true,
          aiSummary: true,
        },
      });
      sourceContext = sources;
    }

    return {
      chatId: chat.id,
      message: userMessage,
      sourceContext,
    };
  }

  /**
   * Add AI response to chat
   */
  async addAIResponse(
    chatId: string,
    content: string,
    citations?: string[],
    tokensUsed?: number,
  ) {
    const chat = await this.prisma.researchProjectChat.findUnique({
      where: { id: chatId },
    });

    if (!chat) {
      throw new NotFoundException("Chat not found");
    }

    const aiMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "assistant",
      content,
      timestamp: new Date().toISOString(),
      citations,
    };

    const messages = (chat.messages as unknown as ChatMessage[]) || [];
    messages.push(aiMessage);

    return this.prisma.researchProjectChat.update({
      where: { id: chatId },
      data: {
        messages: messages as unknown as InputJsonValue,
        tokensUsed: (chat.tokensUsed || 0) + (tokensUsed || 0),
      },
    });
  }

  /**
   * Get chat history
   */
  async getChatHistory(userId: string, projectId: string) {
    const project = await this.prisma.researchProject.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    if (project.userId !== userId) {
      throw new ForbiddenException("Access denied");
    }

    return this.prisma.researchProjectChat.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        modelUsed: true,
        tokensUsed: true,
      },
    });
  }

  /**
   * Start a new chat session
   */
  async startNewChat(userId: string, projectId: string) {
    const project = await this.prisma.researchProject.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    if (project.userId !== userId) {
      throw new ForbiddenException("Access denied");
    }

    const chat = await this.prisma.researchProjectChat.create({
      data: {
        projectId,
        messages: [],
        title: `Chat ${new Date().toLocaleDateString()}`,
      },
    });

    // Update chat count
    await this.prisma.researchProject.update({
      where: { id: projectId },
      data: { chatCount: { increment: 1 } },
    });

    return chat;
  }

  // ==================== Notes ====================

  /**
   * Create a note in a project
   */
  async createNote(userId: string, projectId: string, dto: CreateNoteDto) {
    const project = await this.prisma.researchProject.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    if (project.userId !== userId) {
      throw new ForbiddenException("Access denied");
    }

    const note = await this.prisma.researchProjectNote.create({
      data: {
        projectId,
        title: dto.title,
        content: dto.content,
        sourceType: dto.sourceType || "manual",
        chatId: dto.chatId,
        tags: dto.tags || [],
        isPinned: dto.isPinned || false,
      },
    });

    // Update note count
    await this.prisma.researchProject.update({
      where: { id: projectId },
      data: { noteCount: { increment: 1 } },
    });

    return note;
  }

  /**
   * Get all notes for a project
   */
  async getNotes(userId: string, projectId: string) {
    const project = await this.prisma.researchProject.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    if (project.userId !== userId) {
      throw new ForbiddenException("Access denied");
    }

    return this.prisma.researchProjectNote.findMany({
      where: { projectId },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    });
  }

  /**
   * Update a note
   */
  async updateNote(
    userId: string,
    projectId: string,
    noteId: string,
    dto: UpdateNoteDto,
  ) {
    const project = await this.prisma.researchProject.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    if (project.userId !== userId) {
      throw new ForbiddenException("Access denied");
    }

    const note = await this.prisma.researchProjectNote.findUnique({
      where: { id: noteId },
    });

    if (!note || note.projectId !== projectId) {
      throw new NotFoundException("Note not found");
    }

    return this.prisma.researchProjectNote.update({
      where: { id: noteId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.tags !== undefined && { tags: dto.tags }),
        ...(dto.isPinned !== undefined && { isPinned: dto.isPinned }),
      },
    });
  }

  /**
   * Delete a note
   */
  async deleteNote(userId: string, projectId: string, noteId: string) {
    const project = await this.prisma.researchProject.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    if (project.userId !== userId) {
      throw new ForbiddenException("Access denied");
    }

    const note = await this.prisma.researchProjectNote.findUnique({
      where: { id: noteId },
    });

    if (!note || note.projectId !== projectId) {
      throw new NotFoundException("Note not found");
    }

    await this.prisma.researchProjectNote.delete({
      where: { id: noteId },
    });

    // Update note count
    await this.prisma.researchProject.update({
      where: { id: projectId },
      data: { noteCount: { decrement: 1 } },
    });

    return { success: true };
  }

  /**
   * Save chat message as note
   */
  async saveMessageAsNote(
    userId: string,
    projectId: string,
    chatId: string,
    messageContent: string,
    title?: string,
  ) {
    return this.createNote(userId, projectId, {
      title: title || "Saved from chat",
      content: messageContent,
      sourceType: "ai-chat",
      chatId,
    });
  }
}
