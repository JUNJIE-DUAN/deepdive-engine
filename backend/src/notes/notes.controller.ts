import { Controller, Get, Post, Patch, Delete, Body, Param, Request, Query } from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto, UpdateNoteDto, AddHighlightDto } from './dto';

/**
 * 笔记控制器
 *
 * API端点：
 * - POST /api/v1/notes - 创建笔记
 * - GET /api/v1/notes - 获取用户笔记列表
 * - GET /api/v1/notes/resource/:resourceId - 获取资源的笔记
 * - GET /api/v1/notes/:id - 获取单个笔记
 * - PATCH /api/v1/notes/:id - 更新笔记
 * - DELETE /api/v1/notes/:id - 删除笔记
 * - POST /api/v1/notes/:id/highlights - 添加高亮
 * - DELETE /api/v1/notes/:id/highlights/:highlightId - 删除高亮
 * - POST /api/v1/notes/:id/ai-explain - 请求AI解释
 * - POST /api/v1/notes/:id/graph-nodes - 关联知识图谱节点
 */
@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  /**
   * 创建笔记
   */
  @Post()
  async createNote(@Request() req: any, @Body() dto: CreateNoteDto) {
    // TODO: 从JWT token获取userId
    const userId = req.user?.id || '557be1bd-62cb-4125-a028-5ba740b66aca';
    return this.notesService.createNote(userId, dto);
  }

  /**
   * 获取用户的所有笔记（分页）
   */
  @Get()
  async getUserNotes(
    @Request() req: any,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    // TODO: 从JWT token获取userId
    const userId = req.user?.id || '557be1bd-62cb-4125-a028-5ba740b66aca';
    const skipNum = skip ? parseInt(skip, 10) : 0;
    const takeNum = take ? parseInt(take, 10) : 50;
    return this.notesService.getUserNotes(userId, skipNum, takeNum);
  }

  /**
   * 获取资源的笔记
   */
  @Get('resource/:resourceId')
  async getResourceNotes(
    @Param('resourceId') resourceId: string,
    @Request() req: any,
  ) {
    // TODO: 从JWT token获取userId
    const userId = req.user?.id || '557be1bd-62cb-4125-a028-5ba740b66aca';
    return this.notesService.getResourceNotes(resourceId, userId);
  }

  /**
   * 获取单个笔记
   */
  @Get(':id')
  async getNote(@Param('id') id: string, @Request() req: any) {
    // TODO: 从JWT token获取userId
    const userId = req.user?.id || '557be1bd-62cb-4125-a028-5ba740b66aca';
    return this.notesService.getNote(id, userId);
  }

  /**
   * 更新笔记
   */
  @Patch(':id')
  async updateNote(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: UpdateNoteDto,
  ) {
    // TODO: 从JWT token获取userId
    const userId = req.user?.id || '557be1bd-62cb-4125-a028-5ba740b66aca';
    return this.notesService.updateNote(id, userId, dto);
  }

  /**
   * 删除笔记
   */
  @Delete(':id')
  async deleteNote(@Param('id') id: string, @Request() req: any) {
    // TODO: 从JWT token获取userId
    const userId = req.user?.id || '557be1bd-62cb-4125-a028-5ba740b66aca';
    return this.notesService.deleteNote(id, userId);
  }

  /**
   * 添加高亮标注
   */
  @Post(':id/highlights')
  async addHighlight(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: AddHighlightDto,
  ) {
    // TODO: 从JWT token获取userId
    const userId = req.user?.id || '557be1bd-62cb-4125-a028-5ba740b66aca';
    return this.notesService.addHighlight(id, userId, dto);
  }

  /**
   * 删除高亮标注
   */
  @Delete(':id/highlights/:highlightId')
  async removeHighlight(
    @Param('id') id: string,
    @Param('highlightId') highlightId: string,
    @Request() req: any,
  ) {
    // TODO: 从JWT token获取userId
    const userId = req.user?.id || '557be1bd-62cb-4125-a028-5ba740b66aca';
    return this.notesService.removeHighlight(id, userId, highlightId);
  }

  /**
   * 请求AI解释
   */
  @Post(':id/ai-explain')
  async requestAIExplanation(
    @Param('id') id: string,
    @Request() req: any,
    @Body('text') text: string,
  ) {
    // TODO: 从JWT token获取userId
    const userId = req.user?.id || '557be1bd-62cb-4125-a028-5ba740b66aca';
    return this.notesService.requestAIExplanation(id, userId, text);
  }

  /**
   * 关联知识图谱节点
   */
  @Post(':id/graph-nodes')
  async linkGraphNode(
    @Param('id') id: string,
    @Request() req: any,
    @Body('nodeId') nodeId: string,
    @Body('nodeType') nodeType: string,
  ) {
    // TODO: 从JWT token获取userId
    const userId = req.user?.id || '557be1bd-62cb-4125-a028-5ba740b66aca';
    return this.notesService.linkGraphNode(id, userId, nodeId, nodeType);
  }
}
