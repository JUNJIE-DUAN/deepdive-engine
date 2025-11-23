import {
  Controller,
  Post,
  Body,
  BadRequestException,
  HttpException,
  Logger,
} from "@nestjs/common";
import { AiService } from "./ai.service";

interface TranslateSingleRequest {
  text: string;
  targetLang?: string;
  sourceLang?: string;
}

@Controller("ai")
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(private readonly aiService: AiService) {}

  @Post("translate-single")
  async translateSingle(@Body() body: TranslateSingleRequest) {
    this.logger.log(
      `Received translation request for text: ${body.text?.substring(0, 50)}...`,
    );

    if (!body.text || body.text.trim().length === 0) {
      throw new BadRequestException("Text is required for translation");
    }

    const targetLang = body.targetLang || "zh-CN";
    const sourceLang = body.sourceLang || "en";

    try {
      const translation = await this.aiService.translateText(
        body.text,
        sourceLang,
        targetLang,
      );

      return {
        success: true,
        original: body.text,
        translation,
        sourceLang,
        targetLang,
      };
    } catch (error) {
      // 保留原始HTTP异常的状态码
      if (error instanceof HttpException) {
        this.logger.error(`Translation failed: ${error.message}`);
        throw error; // 直接抛出，保留状态码（429, 503等）
      }

      // 其他未知错误作为500处理
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Unexpected translation error: ${errorMessage}`);
      throw new BadRequestException(`Translation failed: ${errorMessage}`);
    }
  }
}
