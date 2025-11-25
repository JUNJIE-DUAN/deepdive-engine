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
} from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { AiGroupService } from "./ai-group.service";
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
import { TopicType } from "@prisma/client";

@Controller("api/topics")
@UseGuards(JwtAuthGuard)
export class AiGroupController {
  constructor(private readonly aiGroupService: AiGroupService) {}

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
    return this.aiGroupService.sendMessage(topicId, req.user.id, dto);
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
