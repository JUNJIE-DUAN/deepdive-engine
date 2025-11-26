import {
  Controller,
  Get,
  Post,
  Body,
  Res,
  BadRequestException,
  HttpException,
  Logger,
} from "@nestjs/common";
import { Response } from "express";
import { AiService } from "./ai.service";
import { AiChatService } from "./ai-chat.service";
import { PrismaService } from "../../common/prisma/prisma.service";

interface TranslateSingleRequest {
  text: string;
  targetLang?: string;
  sourceLang?: string;
}

interface SimpleChatRequest {
  message: string;
  context?: string;
  model?: string;
  stream?: boolean;
}

interface QuickActionRequest {
  content: string;
  action: "summary" | "insights" | "methodology";
  model?: string;
}

interface SummaryRequest {
  content: string;
  max_length?: number;
  language?: string;
}

interface InsightsRequest {
  content: string;
  language?: string;
}

@Controller("ai")
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(
    private readonly aiService: AiService,
    private readonly aiChatService: AiChatService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 获取已启用的 AI 模型列表（公共 API，无需认证）
   * GET /api/v1/ai/models
   */
  @Get("models")
  async getEnabledModels() {
    this.logger.log("Fetching enabled AI models");
    return this.aiService.getEnabledModels();
  }

  /**
   * 简单聊天接口（支持流式响应）
   * POST /api/v1/ai/simple-chat
   */
  @Post("simple-chat")
  async simpleChat(@Body() body: SimpleChatRequest, @Res() res: Response) {
    const { message, context, model = "gemini", stream = true } = body;

    this.logger.log(
      `Simple chat request: model=${model}, stream=${stream}, message_len=${message?.length || 0}`,
    );

    if (!message || message.trim().length === 0) {
      throw new BadRequestException("Message is required");
    }

    try {
      // Get model config from database
      const modelConfig = await this.prisma.aIModel.findFirst({
        where: {
          OR: [
            { name: { equals: model, mode: "insensitive" } },
            { modelId: { equals: model, mode: "insensitive" } },
          ],
          isEnabled: true,
        },
      });

      if (!modelConfig) {
        this.logger.warn(`Model ${model} not found or not enabled`);
        throw new BadRequestException(`Model ${model} is not available`);
      }

      // Build prompt with context
      let fullPrompt = message;
      if (context) {
        fullPrompt = `Context:\n${context}\n\nUser Question:\n${message}`;
      }

      if (stream) {
        // Set up SSE headers
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders();

        // For streaming, we need to use the chat service and simulate SSE
        // Since ai-chat.service doesn't have native streaming, we'll return the full response as a single chunk
        try {
          const result = await this.aiChatService.generateChatCompletionWithKey(
            {
              provider: modelConfig.provider,
              modelId: modelConfig.modelId,
              apiKey: modelConfig.apiKey ?? "",
              apiEndpoint: modelConfig.apiEndpoint ?? undefined,
              messages: [{ role: "user", content: fullPrompt }],
              maxTokens: 2000,
              temperature: 0.7,
            },
          );

          // Send as SSE chunks
          const chunkSize = 50;
          const content = result.content;
          for (let i = 0; i < content.length; i += chunkSize) {
            const chunk = content.slice(i, i + chunkSize);
            res.write(
              `data: ${JSON.stringify({ content: chunk, model: result.model })}\n\n`,
            );
          }
          res.write("data: [DONE]\n\n");
          res.end();
        } catch (error) {
          this.logger.error(`Stream chat error: ${error}`);
          res.write(`data: ${JSON.stringify({ error: String(error) })}\n\n`);
          res.end();
        }
      } else {
        // Non-streaming response
        const result = await this.aiChatService.generateChatCompletionWithKey({
          provider: modelConfig.provider,
          modelId: modelConfig.modelId,
          apiKey: modelConfig.apiKey ?? "",
          apiEndpoint: modelConfig.apiEndpoint ?? undefined,
          messages: [{ role: "user", content: fullPrompt }],
          maxTokens: 2000,
          temperature: 0.7,
        });

        res.json({
          content: result.content,
          model: result.model,
        });
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Simple chat error: ${errorMessage}`);
      throw new BadRequestException(`Chat failed: ${errorMessage}`);
    }
  }

  /**
   * 快捷操作接口（摘要、洞察、方法论）
   * POST /api/v1/ai/quick-action
   */
  @Post("quick-action")
  async quickAction(@Body() body: QuickActionRequest) {
    const { content, action, model = "gemini" } = body;

    this.logger.log(`Quick action: ${action}, model=${model}`);

    if (!content || content.trim().length === 0) {
      throw new BadRequestException("Content is required");
    }

    try {
      const modelConfig = await this.getModelConfig(model);
      let prompt: string;

      if (action === "methodology") {
        prompt = `You are a JSON-only API. Analyze the research methodology or technical methods in the following content.

Content:
${content}

Requirements:
1. Extract 3-5 main methods or techniques
2. Each method must have exactly these fields: title, description, importance
3. importance must be one of: high, medium, low
4. All titles and descriptions must be written in Simplified Chinese
5. Output ONLY a valid JSON array, nothing else

Output format:
[{"title":"方法名称","description":"方法的关键步骤与核心要点","importance":"high"}]

JSON output:`;
      } else if (action === "summary") {
        prompt = `请为以下内容生成一个结构化的摘要：

${content}

要求：
- 核心观点（2-3个要点）
- 主要发现或结论
- 实际应用价值
- 使用清晰的标题和列表格式`;
      } else {
        // insights
        prompt = `You are a JSON-only API. Extract key insights from the following content.

Content:
${content}

Requirements:
1. Extract 3-5 key insights
2. Each insight must have exactly these fields: title, description, importance
3. importance must be one of: high, medium, low
4. Output ONLY a valid JSON array, nothing else

Output format:
[{"title":"Core Finding","description":"Research reveals significant breakthrough","importance":"high"}]

JSON output:`;
      }

      const result = await this.aiChatService.generateChatCompletionWithKey({
        provider: modelConfig.provider,
        modelId: modelConfig.modelId,
        apiKey: modelConfig.apiKey ?? "",
        apiEndpoint: modelConfig.apiEndpoint ?? undefined,
        messages: [{ role: "user", content: prompt }],
        maxTokens: 1500,
        temperature: 0.7,
      });

      // Try to parse JSON for methodology and insights
      let finalContent = result.content;
      if (action === "methodology" || action === "insights") {
        finalContent = this.extractJsonArray(result.content);
      }

      return {
        content: finalContent,
        action,
        model: result.model,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Quick action error: ${errorMessage}`);
      throw new BadRequestException(`Quick action failed: ${errorMessage}`);
    }
  }

  /**
   * 摘要接口
   * POST /api/v1/ai/summary
   */
  @Post("summary")
  async summary(@Body() body: SummaryRequest) {
    const { content, language = "zh" } = body;

    if (!content || content.trim().length === 0) {
      throw new BadRequestException("Content is required");
    }

    try {
      const modelConfig = await this.getDefaultModelConfig();
      const prompt =
        language === "zh"
          ? `请为以下内容生成简洁的摘要：\n\n${content}\n\n要求：简明扼要，突出重点。`
          : `Please generate a concise summary of the following content:\n\n${content}`;

      const result = await this.aiChatService.generateChatCompletionWithKey({
        provider: modelConfig.provider,
        modelId: modelConfig.modelId,
        apiKey: modelConfig.apiKey ?? "",
        apiEndpoint: modelConfig.apiEndpoint ?? undefined,
        messages: [{ role: "user", content: prompt }],
        maxTokens: 1000,
        temperature: 0.5,
      });

      return {
        summary: result.content,
        model: result.model,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Summary error: ${errorMessage}`);
      throw new BadRequestException(`Summary failed: ${errorMessage}`);
    }
  }

  /**
   * 洞察接口
   * POST /api/v1/ai/insights
   */
  @Post("insights")
  async insights(@Body() body: InsightsRequest) {
    const { content, language = "zh" } = body;

    if (!content || content.trim().length === 0) {
      throw new BadRequestException("Content is required");
    }

    try {
      const modelConfig = await this.getDefaultModelConfig();
      const prompt = `You are a JSON-only API. Extract key insights from the following content.

Content:
${content}

Requirements:
1. Extract 3-5 key insights
2. Each insight must have exactly these fields: title, description, importance
3. importance must be one of: high, medium, low
4. ${language === "zh" ? "All output must be in Simplified Chinese" : "Output in English"}
5. Output ONLY a valid JSON array, nothing else

JSON output:`;

      const result = await this.aiChatService.generateChatCompletionWithKey({
        provider: modelConfig.provider,
        modelId: modelConfig.modelId,
        apiKey: modelConfig.apiKey ?? "",
        apiEndpoint: modelConfig.apiEndpoint ?? undefined,
        messages: [{ role: "user", content: prompt }],
        maxTokens: 1500,
        temperature: 0.7,
      });

      const jsonContent = this.extractJsonArray(result.content);

      return {
        insights: jsonContent,
        model: result.model,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Insights error: ${errorMessage}`);
      throw new BadRequestException(`Insights failed: ${errorMessage}`);
    }
  }

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

  /**
   * Helper: Get model config by name
   */
  private async getModelConfig(model: string) {
    const modelConfig = await this.prisma.aIModel.findFirst({
      where: {
        OR: [
          { name: { equals: model, mode: "insensitive" } },
          { modelId: { equals: model, mode: "insensitive" } },
        ],
        isEnabled: true,
      },
    });

    if (!modelConfig) {
      throw new BadRequestException(`Model ${model} is not available`);
    }

    return modelConfig;
  }

  /**
   * Helper: Get default model config
   */
  private async getDefaultModelConfig() {
    const modelConfig = await this.prisma.aIModel.findFirst({
      where: { isEnabled: true },
      orderBy: { isDefault: "desc" },
    });

    if (!modelConfig) {
      throw new BadRequestException("No AI model is available");
    }

    return modelConfig;
  }

  /**
   * Helper: Extract JSON array from AI response
   */
  private extractJsonArray(content: string): string {
    try {
      let jsonContent = content.trim();

      // Remove markdown code blocks
      if (jsonContent.includes("```json")) {
        jsonContent = jsonContent.split("```json")[1].split("```")[0].trim();
      } else if (jsonContent.includes("```")) {
        jsonContent = jsonContent.split("```")[1].split("```")[0].trim();
      }

      // Find JSON array boundaries
      const startIdx = jsonContent.indexOf("[");
      const endIdx = jsonContent.lastIndexOf("]");

      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        jsonContent = jsonContent.slice(startIdx, endIdx + 1);
        // Validate JSON
        JSON.parse(jsonContent);
        return jsonContent;
      }
    } catch (e) {
      this.logger.warn(`Failed to extract JSON: ${e}`);
    }
    return content;
  }
}
