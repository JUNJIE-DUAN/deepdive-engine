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
  prompt: string;
  style?: string;
  aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3";
  negativePrompt?: string;
}

@Controller("api/v1/ai-image")
export class AiImageController {
  private readonly logger = new Logger(AiImageController.name);

  constructor(private readonly aiImageService: AiImageService) {}

  @Post("generate")
  @UseGuards(JwtAuthGuard)
  async generateImage(@Body() dto: GenerateImageDto, @Request() req: any) {
    this.logger.log(`Generating image for user ${req.user?.userId}`);
    return this.aiImageService.generateImage(
      dto.prompt,
      dto.style,
      dto.aspectRatio,
      dto.negativePrompt,
      req.user?.userId,
    );
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
