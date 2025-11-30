import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Request,
  Logger,
} from "@nestjs/common";
import { AiImageService } from "./ai-image.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

interface GenerateImageDto {
  // 输入内容 - 支持多种来源
  prompt?: string; // 直接输入的提示词或文本
  url?: string; // URL (文章、视频等)
  content?: string; // 大块文本 (论文、字幕等)
  imageUrl?: string; // 参考图片URL

  // 模型选择
  textModelId?: string; // 文本模型ID (用于分析内容生成提示词)
  imageModelId?: string; // 图片模型ID (用于生成图片)

  // 生成选项
  style?: string;
  aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3";
  negativePrompt?: string;

  // 是否跳过提示词优化 (直接使用用户输入)
  skipEnhancement?: boolean;
}

@Controller("ai-image")
export class AiImageController {
  private readonly logger = new Logger(AiImageController.name);

  constructor(private readonly aiImageService: AiImageService) {}

  @Get("models")
  @UseGuards(JwtAuthGuard)
  async getAvailableModels() {
    return this.aiImageService.getAvailableModels();
  }

  @Post("generate")
  @UseGuards(JwtAuthGuard)
  async generateImage(@Body() dto: GenerateImageDto, @Request() req: any) {
    this.logger.log(`Generating image for user ${req.user?.userId}`);
    return this.aiImageService.generateImage({
      prompt: dto.prompt,
      url: dto.url,
      content: dto.content,
      imageUrl: dto.imageUrl,
      textModelId: dto.textModelId,
      imageModelId: dto.imageModelId,
      style: dto.style,
      aspectRatio: dto.aspectRatio,
      negativePrompt: dto.negativePrompt,
      skipEnhancement: dto.skipEnhancement,
      userId: req.user?.userId,
    });
  }

  @Get("history")
  @UseGuards(JwtAuthGuard)
  async getHistory(@Request() req: any) {
    return this.aiImageService.getHistory(req.user?.userId);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  async getImage(@Param("id") id: string) {
    return this.aiImageService.getImage(id);
  }
}
