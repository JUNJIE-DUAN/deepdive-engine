import { Injectable, Logger, HttpException, HttpStatus } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 获取已启用的 AI 模型列表（公共 API）
   * 返回前端需要的模型信息（不包含 API Key）
   */
  async getEnabledModels() {
    const models = await this.prisma.aIModel.findMany({
      where: {
        isEnabled: true,
      },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        displayName: true,
        provider: true,
        modelId: true,
        icon: true,
        color: true,
        description: true,
        isDefault: true,
      },
    });

    return models.map((model) => ({
      id: model.id, // 使用数据库唯一 ID 作为前端 id（避免重复）
      dbId: model.id, // 数据库实际 ID（保持兼容）
      name: model.displayName,
      modelName: model.name, // 模型标识名（如 gemini, gemini-image）
      provider: model.provider,
      modelId: model.modelId,
      icon: model.icon,
      iconUrl: this.getIconUrl(model.name),
      color: model.color,
      description:
        model.description || `${model.provider} ${model.displayName}`,
      isDefault: model.isDefault,
    }));
  }

  /**
   * 根据模型名称获取图标 URL
   */
  private getIconUrl(name: string): string {
    const iconMap: Record<string, string> = {
      grok: "/icons/ai/grok.svg",
      "gpt-4": "/icons/ai/openai.svg",
      claude: "/icons/ai/claude.svg",
      gemini: "/icons/ai/gemini.svg",
    };
    return iconMap[name.toLowerCase()] || "/icons/ai/default.svg";
  }

  async translateText(
    text: string,
    sourceLang: string,
    targetLang: string,
  ): Promise<string> {
    this.logger.log(`Translating text from ${sourceLang} to ${targetLang}`);

    try {
      // 使用 DeepL API 或 Google Translate API 的免费替代方案
      // 这里使用 LibreTranslate 作为示例（开源免费翻译服务）
      const apiUrl =
        process.env.TRANSLATE_API_URL || "https://libretranslate.de/translate";

      const response = await firstValueFrom(
        this.httpService.post(
          apiUrl,
          {
            q: text,
            source: this.mapLanguageCode(sourceLang),
            target: this.mapLanguageCode(targetLang),
            format: "text",
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        ),
      );

      if (response.data && response.data.translatedText) {
        return response.data.translatedText;
      }

      throw new Error("Translation service returned invalid response");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Translation error: ${errorMessage}`);

      // 如果翻译服务失败，返回简单的 fallback 翻译提示
      // 在生产环境中，您应该配置可靠的翻译服务
      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof error.response === "object" &&
        error.response !== null &&
        "status" in error.response &&
        error.response.status === 429
      ) {
        throw new HttpException(
          "Translation service rate limit exceeded. Please try again later.",
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // 抛出服务不可用异常，让调用者决定如何处理
      throw new HttpException(
        {
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          message: "Translation service is currently unavailable",
          error: "SERVICE_UNAVAILABLE",
          originalText: text, // 提供原文供调用者使用
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  private mapLanguageCode(code: string): string {
    // 映射语言代码到翻译服务支持的格式
    const codeMap: Record<string, string> = {
      en: "en",
      "zh-CN": "zh",
      zh: "zh",
      ja: "ja",
      ko: "ko",
      fr: "fr",
      de: "de",
      es: "es",
      it: "it",
      pt: "pt",
      ru: "ru",
    };

    return codeMap[code] || code.split("-")[0];
  }
}
