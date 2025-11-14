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
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import * as path from "path";
import * as fs from "fs/promises";
import { ResourcesService } from "./resources.service";
import { AIEnrichmentService } from "./ai-enrichment.service";
// import { PdfThumbnailService } from './pdf-thumbnail.service';
import { Prisma } from "@prisma/client";

/**
 * 资源管理控制器
 */
@Controller("resources")
export class ResourcesController {
  private readonly logger = new Logger(ResourcesController.name);

  constructor(
    private resourcesService: ResourcesService,
    private aiEnrichmentService: AIEnrichmentService,
    // private pdfThumbnailService: PdfThumbnailService,
  ) {}

  /**
   * 获取资源列表
   * GET /api/v1/resources?skip=0&take=20&type=PAPER&category=AI&search=machine+learning&sortBy=publishedAt&sortOrder=desc
   */
  @Get()
  async findAll(
    @Query("skip", new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query("take", new DefaultValuePipe(20), ParseIntPipe) take: number,
    @Query("type") type?: string,
    @Query("category") category?: string,
    @Query("search") search?: string,
    @Query("sortBy") sortBy?: "publishedAt" | "qualityScore" | "trendingScore",
    @Query("sortOrder") sortOrder?: "asc" | "desc",
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
   * 搜索建议（实时）
   * GET /api/v1/resources/search/suggestions?q=AI&limit=5
   *
   * 注意：此路由必须在 @Get(':id') 之前，否则会被 :id 捕获
   */
  @Get("search/suggestions")
  async searchSuggestions(
    @Query("q") query: string,
    @Query("limit", new DefaultValuePipe(5), ParseIntPipe) limit: number,
  ) {
    if (!query || query.trim().length < 2) {
      return { suggestions: [] };
    }

    this.logger.log(`Searching suggestions for: ${query}`);

    const suggestions = await this.resourcesService.searchSuggestions(
      query,
      limit,
    );

    return { suggestions };
  }

  /**
   * 获取资源统计
   * GET /api/v1/resources/stats/summary
   *
   * 注意：此路由必须在 @Get(':id') 之前，否则会被 :id 捕获
   */
  @Get("stats/summary")
  async getStats() {
    this.logger.log("Fetching resource statistics");

    return this.resourcesService.getStats();
  }

  /**
   * 检查 AI 服务健康状态
   * GET /api/v1/resources/ai/health
   *
   * 注意：此路由必须在 @Get(':id') 之前，否则会被 :id 捕获
   */
  @Get("ai/health")
  async checkAIHealth() {
    this.logger.log("Checking AI service health");

    const isHealthy = await this.aiEnrichmentService.checkHealth();

    return {
      status: isHealthy ? "ok" : "error",
      aiServiceAvailable: isHealthy,
    };
  }

  /**
   * 获取资源详情
   * GET /api/v1/resources/:id
   *
   * 注意：动态路由必须放在所有具体路由之后，以免捕获其他路径
   */
  @Get(":id")
  async findOne(@Param("id") id: string) {
    this.logger.log(`Fetching resource ${id}`);

    return this.resourcesService.findOne(id);
  }

  /**
   * 从URL导入资源
   * POST /api/v1/resources/import-url
   * Body: { url: string, type: 'PAPER' | 'PROJECT' | 'NEWS' }
   *
   * 注意：此路由必须在 @Post() 之前，否则会被通用POST路由捕获
   */
  @Post("import-url")
  async importFromUrl(@Body() body: { url: string; type: string }) {
    const { url, type } = body;

    if (!url || !type) {
      throw new HttpException(
        "URL and type are required",
        HttpStatus.BAD_REQUEST,
      );
    }

    const validTypes = ["PAPER", "PROJECT", "NEWS", "YOUTUBE_VIDEO"];
    if (!validTypes.includes(type)) {
      throw new HttpException(
        `Invalid type. Must be one of: ${validTypes.join(", ")}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    this.logger.log(`Importing resource from URL: ${url} (type: ${type})`);

    try {
      const resource = await this.resourcesService.importFromUrl(url, type);
      return {
        message: "URL imported successfully",
        resource,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to import URL: ${err.message}`, err.stack);
      throw new HttpException(
        `Failed to import URL: ${err.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 创建资源
   * POST /api/v1/resources
   */
  @Post()
  async create(@Body() createResourceDto: Prisma.ResourceCreateInput) {
    this.logger.log("Creating new resource");

    return this.resourcesService.create(createResourceDto);
  }

  /**
   * 更新资源
   * PATCH /api/v1/resources/:id
   */
  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() updateResourceDto: Prisma.ResourceUpdateInput,
  ) {
    this.logger.log(`Updating resource ${id}`);

    return this.resourcesService.update(id, updateResourceDto);
  }

  /**
   * 删除资源
   * DELETE /api/v1/resources/:id
   */
  @Delete(":id")
  async remove(@Param("id") id: string) {
    this.logger.log(`Deleting resource ${id}`);

    return this.resourcesService.remove(id);
  }

  /**
   * AI 增强资源（生成摘要、洞察、分类）
   * POST /api/v1/resources/:id/enrich
   */
  @Post(":id/enrich")
  async enrichResource(@Param("id") id: string) {
    this.logger.log(`Enriching resource ${id} with AI`);

    // 获取资源
    const resource = await this.resourcesService.findOne(id);
    if (!resource) {
      throw new HttpException(`Resource ${id} not found`, HttpStatus.NOT_FOUND);
    }

    // 调用 AI 增强服务
    const enrichment = await this.aiEnrichmentService.enrichResource({
      title: resource.title,
      abstract: resource.abstract ?? undefined,
      content: resource.content ?? undefined,
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
   * 上传并保存资源缩略图
   * POST /api/v1/resources/:id/thumbnail
   *
   * 前端使用 PDF.js 客户端生成缩略图，然后上传到服务器
   */
  @Post(":id/thumbnail")
  @UseInterceptors(
    FileInterceptor("thumbnail", {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const uploadPath = path.join(process.cwd(), "public", "thumbnails");
          fs.mkdir(uploadPath, { recursive: true })
            .then(() => cb(null, uploadPath))
            .catch((error) => cb(error as Error, uploadPath));
        },
        filename: (req, file, cb) => {
          const resourceId = req.params.id;
          const ext = path.extname(file.originalname) || ".jpg";
          cb(null, `${resourceId}${ext}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
      },
      fileFilter: (_req, file, cb) => {
        // 只接受图片文件
        if (file.mimetype.startsWith("image/")) {
          cb(null, true);
        } else {
          cb(new Error("Only image files are allowed"), false);
        }
      },
    }),
  )
  async uploadThumbnail(
    @Param("id") id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    this.logger.log(`Uploading thumbnail for resource ${id}`);

    if (!file) {
      throw new HttpException("No file uploaded", HttpStatus.BAD_REQUEST);
    }

    // 检查资源是否存在
    const resource = await this.resourcesService.findOne(id);
    if (!resource) {
      throw new HttpException(`Resource ${id} not found`, HttpStatus.NOT_FOUND);
    }

    // 构建缩略图 URL
    const thumbnailUrl = `/thumbnails/${file.filename}`;

    // 更新资源的缩略图 URL
    const updated = await this.resourcesService.update(id, {
      thumbnailUrl,
    });

    this.logger.log(`Thumbnail uploaded successfully for resource ${id}`);

    return {
      message: "Thumbnail uploaded successfully",
      thumbnailUrl,
      resource: updated,
    };
  }
}
