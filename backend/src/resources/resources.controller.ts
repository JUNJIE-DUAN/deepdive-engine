import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Logger,
  ParseIntPipe,
  DefaultValuePipe,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { AIEnrichmentService } from './ai-enrichment.service';
import { Prisma } from '@prisma/client';

/**
 * 资源管理控制器
 */
@Controller('resources')
export class ResourcesController {
  private readonly logger = new Logger(ResourcesController.name);

  constructor(
    private resourcesService: ResourcesService,
    private aiEnrichmentService: AIEnrichmentService,
  ) {}

  /**
   * 获取资源列表
   * GET /api/v1/resources?skip=0&take=20&type=PAPER&category=AI&search=machine+learning&sortBy=publishedAt&sortOrder=desc
   */
  @Get()
  async findAll(
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(20), ParseIntPipe) take: number,
    @Query('type') type?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: 'publishedAt' | 'qualityScore' | 'trendingScore',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    this.logger.log(`Fetching resources (skip: ${skip}, take: ${take})`);

    return this.resourcesService.findAll({
      skip,
      take,
      type,
      category,
      search,
      sortBy,
      sortOrder,
    });
  }

  /**
   * 获取资源详情
   * GET /api/v1/resources/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    this.logger.log(`Fetching resource ${id}`);

    return this.resourcesService.findOne(id);
  }

  /**
   * 创建资源
   * POST /api/v1/resources
   */
  @Post()
  async create(@Body() createResourceDto: Prisma.ResourceCreateInput) {
    this.logger.log('Creating new resource');

    return this.resourcesService.create(createResourceDto);
  }

  /**
   * 更新资源
   * PATCH /api/v1/resources/:id
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateResourceDto: Prisma.ResourceUpdateInput,
  ) {
    this.logger.log(`Updating resource ${id}`);

    return this.resourcesService.update(id, updateResourceDto);
  }

  /**
   * 删除资源
   * DELETE /api/v1/resources/:id
   */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    this.logger.log(`Deleting resource ${id}`);

    return this.resourcesService.remove(id);
  }

  /**
   * 获取资源统计
   * GET /api/v1/resources/stats/summary
   */
  @Get('stats/summary')
  async getStats() {
    this.logger.log('Fetching resource statistics');

    return this.resourcesService.getStats();
  }

  /**
   * AI 增强资源（生成摘要、洞察、分类）
   * POST /api/v1/resources/:id/enrich
   */
  @Post(':id/enrich')
  async enrichResource(@Param('id') id: string) {
    this.logger.log(`Enriching resource ${id} with AI`);

    // 获取资源
    const resource = await this.resourcesService.findOne(id);
    if (!resource) {
      throw new HttpException(`Resource ${id} not found`, HttpStatus.NOT_FOUND);
    }

    // 调用 AI 增强服务
    const enrichment = await this.aiEnrichmentService.enrichResource({
      title: resource.title,
      abstract: resource.abstract,
      content: resource.content,
      sourceUrl: resource.sourceUrl,
    });

    // 更新资源
    const updated = await this.resourcesService.update(id, {
      aiSummary: enrichment.aiSummary,
      keyInsights: enrichment.keyInsights as any,
      primaryCategory: enrichment.primaryCategory,
      autoTags: enrichment.autoTags,
      difficultyLevel: enrichment.difficultyLevel,
    });

    this.logger.log(`Resource ${id} enriched successfully`);

    return updated;
  }

  /**
   * 检查 AI 服务健康状态
   * GET /api/v1/resources/ai/health
   */
  @Get('ai/health')
  async checkAIHealth() {
    this.logger.log('Checking AI service health');

    const isHealthy = await this.aiEnrichmentService.checkHealth();

    return {
      status: isHealthy ? 'ok' : 'error',
      aiServiceAvailable: isHealthy,
    };
  }
}
