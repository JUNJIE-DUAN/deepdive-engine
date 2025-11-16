import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly httpService: HttpService) {}

  async translateText(
    text: string,
    sourceLang: string,
    targetLang: string
  ): Promise<string> {
    this.logger.log(`Translating text from ${sourceLang} to ${targetLang}`);

    try {
      // 使用 DeepL API 或 Google Translate API 的免费替代方案
      // 这里使用 LibreTranslate 作为示例（开源免费翻译服务）
      const apiUrl = process.env.TRANSLATE_API_URL || 'https://libretranslate.de/translate';

      const response = await firstValueFrom(
        this.httpService.post(apiUrl, {
          q: text,
          source: this.mapLanguageCode(sourceLang),
          target: this.mapLanguageCode(targetLang),
          format: 'text',
        }, {
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );

      if (response.data && response.data.translatedText) {
        return response.data.translatedText;
      }

      throw new Error('Translation service returned invalid response');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Translation error: ${errorMessage}`);

      // 如果翻译服务失败，返回简单的 fallback 翻译提示
      // 在生产环境中，您应该配置可靠的翻译服务
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof error.response === 'object' &&
        error.response !== null &&
        'status' in error.response &&
        error.response.status === 429
      ) {
        throw new HttpException(
          'Translation service rate limit exceeded. Please try again later.',
          HttpStatus.TOO_MANY_REQUESTS
        );
      }

      // 抛出服务不可用异常，让调用者决定如何处理
      throw new HttpException(
        {
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          message: 'Translation service is currently unavailable',
          error: 'SERVICE_UNAVAILABLE',
          originalText: text, // 提供原文供调用者使用
        },
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  private mapLanguageCode(code: string): string {
    // 映射语言代码到翻译服务支持的格式
    const codeMap: Record<string, string> = {
      'en': 'en',
      'zh-CN': 'zh',
      'zh': 'zh',
      'ja': 'ja',
      'ko': 'ko',
      'fr': 'fr',
      'de': 'de',
      'es': 'es',
      'it': 'it',
      'pt': 'pt',
      'ru': 'ru',
    };

    return codeMap[code] || code.split('-')[0];
  }
}
