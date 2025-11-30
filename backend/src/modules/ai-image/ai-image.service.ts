import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";

export interface GeneratedImageResult {
  id: string;
  imageUrl: string;
  prompt: string;
  enhancedPrompt?: string;
  width: number;
  height: number;
  createdAt: string;
}

export interface GenerateImageOptions {
  prompt?: string;
  url?: string;
  content?: string;
  imageUrl?: string;
  textModelId?: string;
  imageModelId?: string;
  style?: string;
  aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3";
  negativePrompt?: string;
  skipEnhancement?: boolean;
  userId?: string;
}

// 提示词优化系统提示
const PROMPT_ENHANCEMENT_SYSTEM = `You are an expert AI image prompt engineer. Your task is to analyze the given content and create a highly detailed, professional image generation prompt that captures the essence of the content.

Guidelines:
1. Analyze the content (text, article summary, or description) to identify the core theme, mood, and key visual elements
2. Create a vivid, detailed image prompt that represents the content
3. Add specific visual details: lighting, composition, perspective, color palette, atmosphere
4. Include technical quality terms: 8K, photorealistic, detailed, sharp focus (when appropriate)
5. Keep the enhanced prompt concise but comprehensive (max 150 words)
6. Output ONLY the enhanced prompt in English, no explanations or prefixes

Example input: "An article about climate change and melting glaciers"
Example output: "A dramatic aerial view of a massive glacier with deep blue crevasses, chunks of ice calving into dark arctic waters, misty atmosphere, golden hour lighting breaking through storm clouds, environmental documentary style, ultra-detailed, 8K resolution, melancholic mood, stark contrast between pristine ice and rising waters"`;

@Injectable()
export class AiImageService {
  private readonly logger = new Logger(AiImageService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
  ) {}

  /**
   * 获取所有可用模型（文本模型 + 图片模型）
   */
  async getAvailableModels() {
    // 获取文本模型
    const textModels = await this.prisma.aIModel.findMany({
      where: {
        isEnabled: true,
        OR: [
          { modelId: { contains: "gpt", mode: "insensitive" } },
          { modelId: { contains: "claude", mode: "insensitive" } },
          { modelId: { contains: "gemini", mode: "insensitive" } },
          { provider: { contains: "openai", mode: "insensitive" } },
          { provider: { contains: "anthropic", mode: "insensitive" } },
          { provider: { contains: "google", mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        displayName: true,
        provider: true,
        modelId: true,
        icon: true,
        isDefault: true,
      },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });

    // 获取图片模型
    const imageModels = await this.prisma.aIModel.findMany({
      where: {
        isEnabled: true,
        OR: [
          { provider: { contains: "gemini", mode: "insensitive" } },
          { provider: { contains: "google", mode: "insensitive" } },
          { modelId: { contains: "gemini", mode: "insensitive" } },
          { modelId: { contains: "imagen", mode: "insensitive" } },
          { provider: { contains: "openai", mode: "insensitive" } },
          { modelId: { contains: "dall", mode: "insensitive" } },
          { provider: { contains: "stability", mode: "insensitive" } },
          { modelId: { contains: "stable", mode: "insensitive" } },
          { provider: { contains: "flux", mode: "insensitive" } },
          { modelId: { contains: "flux", mode: "insensitive" } },
          { provider: { contains: "replicate", mode: "insensitive" } },
          { provider: { contains: "together", mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        displayName: true,
        provider: true,
        modelId: true,
        icon: true,
        isDefault: true,
      },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });

    return {
      textModels: textModels.map((m) => ({
        id: m.id,
        name: m.displayName || m.name,
        provider: m.provider,
        modelId: m.modelId,
        icon: m.icon,
        isDefault: m.isDefault,
      })),
      imageModels: imageModels.map((m) => ({
        id: m.id,
        name: m.displayName || m.name,
        provider: m.provider,
        modelId: m.modelId,
        icon: m.icon,
        isDefault: m.isDefault,
      })),
    };
  }

  /**
   * 主方法：生成图片
   * 1. 收集输入内容 (prompt/url/content/imageUrl)
   * 2. 用文本模型分析并生成专业提示词
   * 3. 用图片模型生成图片
   */
  async generateImage(
    options: GenerateImageOptions,
  ): Promise<GeneratedImageResult> {
    const {
      prompt,
      url,
      content,
      imageUrl,
      textModelId,
      imageModelId,
      style,
      aspectRatio,
      negativePrompt,
      skipEnhancement,
      userId,
    } = options;

    // 验证输入
    if (!prompt && !url && !content && !imageUrl) {
      throw new BadRequestException(
        "At least one input is required: prompt, url, content, or imageUrl",
      );
    }

    // 步骤1: 收集和处理输入内容
    let inputContent = "";

    if (prompt) {
      inputContent += prompt;
    }

    if (url) {
      const urlContent = await this.fetchUrlContent(url);
      inputContent += inputContent
        ? `\n\nContent from URL:\n${urlContent}`
        : urlContent;
    }

    if (content) {
      inputContent += inputContent
        ? `\n\nAdditional content:\n${content}`
        : content;
    }

    this.logger.log(`Input content length: ${inputContent.length} chars`);

    // 步骤2: 使用文本模型生成专业提示词
    let enhancedPrompt: string;

    if (skipEnhancement) {
      // 跳过优化，直接使用原始输入
      enhancedPrompt = this.addStyleToPrompt(inputContent, style);
    } else {
      // 使用文本模型优化提示词
      enhancedPrompt = await this.enhancePromptWithTextModel(
        inputContent,
        textModelId,
        style,
      );
    }

    this.logger.log(`Enhanced prompt: ${enhancedPrompt.slice(0, 100)}...`);

    // 步骤3: 使用图片模型生成图片
    const dimensions = this.getDimensions(aspectRatio || "1:1");
    const imageModelConfig = imageModelId
      ? await this.getModelById(imageModelId)
      : await this.getDefaultImageModel();

    if (!imageModelConfig || !imageModelConfig.apiKey) {
      this.logger.warn(
        "No image generation model configured, using placeholder",
      );
      return this.generatePlaceholder(
        inputContent,
        enhancedPrompt,
        aspectRatio,
      );
    }

    try {
      const generatedImageUrl = await this.callImageGenerationAPI(
        imageModelConfig,
        enhancedPrompt,
        dimensions,
        negativePrompt,
      );

      // 保存到数据库
      const image = await this.prisma.generatedImage.create({
        data: {
          prompt: inputContent.slice(0, 1000), // 截断原始输入
          enhancedPrompt,
          style: style || "realistic",
          aspectRatio: aspectRatio || "1:1",
          imageUrl: generatedImageUrl,
          width: dimensions.width,
          height: dimensions.height,
          provider: imageModelConfig.provider,
          userId,
        },
      });

      this.logger.log(`Image generated successfully: ${image.id}`);

      return {
        id: image.id,
        imageUrl: image.imageUrl,
        prompt: image.prompt,
        enhancedPrompt: image.enhancedPrompt || undefined,
        width: image.width,
        height: image.height,
        createdAt: image.createdAt.toISOString(),
      };
    } catch (error) {
      this.logger.error("Image generation failed:", error);
      return this.generatePlaceholder(
        inputContent,
        enhancedPrompt,
        aspectRatio,
      );
    }
  }

  /**
   * 从 URL 获取内容
   */
  private async fetchUrlContent(url: string): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; DeepDive/1.0)",
          },
          timeout: 10000,
        }),
      );

      // 简单提取文本内容
      let content = response.data;
      if (typeof content === "string") {
        // 移除 HTML 标签
        content = content
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
      } else {
        content = JSON.stringify(content);
      }

      // 截断过长内容
      return content.slice(0, 5000);
    } catch (error) {
      this.logger.warn(`Failed to fetch URL content: ${url}`, error);
      return `[Content from: ${url}]`;
    }
  }

  /**
   * 使用文本模型优化提示词
   */
  private async enhancePromptWithTextModel(
    content: string,
    textModelId?: string,
    style?: string,
  ): Promise<string> {
    const textModel = textModelId
      ? await this.getModelById(textModelId)
      : await this.getDefaultTextModel();

    if (!textModel || !textModel.apiKey) {
      this.logger.warn("No text model available, using basic enhancement");
      return this.addStyleToPrompt(content, style);
    }

    try {
      const provider = textModel.provider.toLowerCase();
      const endpoint = textModel.apiEndpoint?.toLowerCase() || "";
      const modelId = textModel.modelId.toLowerCase();

      let enhancedPrompt: string;

      if (
        provider.includes("google") ||
        provider.includes("gemini") ||
        modelId.includes("gemini")
      ) {
        enhancedPrompt = await this.callGeminiTextAPI(
          textModel.apiKey,
          textModel.modelId,
          content,
        );
      } else if (
        provider.includes("openai") ||
        endpoint.includes("openai") ||
        modelId.includes("gpt")
      ) {
        enhancedPrompt = await this.callOpenAITextAPI(
          textModel.apiKey,
          textModel.apiEndpoint,
          textModel.modelId,
          content,
        );
      } else {
        // 默认使用 OpenAI 兼容 API
        enhancedPrompt = await this.callOpenAITextAPI(
          textModel.apiKey,
          textModel.apiEndpoint,
          textModel.modelId,
          content,
        );
      }

      return this.addStyleToPrompt(enhancedPrompt, style);
    } catch (error) {
      this.logger.error("Prompt enhancement failed:", error);
      return this.addStyleToPrompt(content, style);
    }
  }

  /**
   * 调用 Gemini 文本 API
   */
  private async callGeminiTextAPI(
    apiKey: string,
    modelId: string,
    content: string,
  ): Promise<string> {
    const model = modelId.includes("gemini") ? modelId : "gemini-1.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await firstValueFrom(
      this.httpService.post(
        url,
        {
          contents: [
            {
              parts: [
                { text: PROMPT_ENHANCEMENT_SYSTEM },
                { text: `\n\nContent to analyze:\n${content}` },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 300,
            temperature: 0.7,
          },
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 30000,
        },
      ),
    );

    const candidates = response.data.candidates;
    if (candidates?.[0]?.content?.parts?.[0]?.text) {
      return candidates[0].content.parts[0].text.trim();
    }

    throw new Error("No text in Gemini response");
  }

  /**
   * 调用 OpenAI 文本 API
   */
  private async callOpenAITextAPI(
    apiKey: string,
    apiEndpoint: string | null,
    modelId: string,
    content: string,
  ): Promise<string> {
    const baseUrl = apiEndpoint || "https://api.openai.com/v1";
    const url = `${baseUrl}/chat/completions`;

    const response = await firstValueFrom(
      this.httpService.post(
        url,
        {
          model: modelId || "gpt-4o-mini",
          messages: [
            { role: "system", content: PROMPT_ENHANCEMENT_SYSTEM },
            { role: "user", content: `Content to analyze:\n${content}` },
          ],
          max_tokens: 300,
          temperature: 0.7,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          timeout: 30000,
        },
      ),
    );

    const message = response.data.choices?.[0]?.message?.content;
    if (message) {
      return message.trim();
    }

    throw new Error("No text in OpenAI response");
  }

  /**
   * 调用图片生成 API
   */
  private async callImageGenerationAPI(
    modelConfig: any,
    prompt: string,
    dimensions: { width: number; height: number },
    negativePrompt?: string,
  ): Promise<string> {
    const provider = modelConfig.provider.toLowerCase();
    const endpoint = modelConfig.apiEndpoint?.toLowerCase() || "";
    const modelId = modelConfig.modelId.toLowerCase();

    if (
      provider.includes("openai") ||
      endpoint.includes("openai") ||
      modelId.includes("dall")
    ) {
      return this.generateWithOpenAI(
        modelConfig.apiKey,
        modelConfig.apiEndpoint,
        prompt,
        dimensions,
      );
    } else if (
      provider.includes("stability") ||
      endpoint.includes("stability") ||
      modelId.includes("stable")
    ) {
      return this.generateWithStability(
        modelConfig.apiKey,
        modelConfig.apiEndpoint,
        prompt,
        dimensions,
        negativePrompt,
      );
    } else if (
      provider.includes("replicate") ||
      endpoint.includes("replicate") ||
      modelId.includes("flux")
    ) {
      return this.generateWithReplicate(
        modelConfig.apiKey,
        modelConfig.modelId,
        prompt,
        dimensions,
        negativePrompt,
      );
    } else if (provider.includes("together") || endpoint.includes("together")) {
      return this.generateWithTogether(
        modelConfig.apiKey,
        modelConfig.modelId,
        prompt,
        dimensions,
      );
    } else if (
      provider.includes("google") ||
      provider.includes("gemini") ||
      modelId.includes("gemini") ||
      modelId.includes("imagen")
    ) {
      return this.generateWithGemini(
        modelConfig.apiKey,
        modelConfig.modelId,
        prompt,
        dimensions,
      );
    } else {
      // 默认尝试 OpenAI 兼容 API
      return this.generateWithOpenAICompatible(
        modelConfig.apiKey,
        modelConfig.apiEndpoint,
        modelConfig.modelId,
        prompt,
        dimensions,
      );
    }
  }

  /**
   * 获取默认文本模型
   */
  private async getDefaultTextModel() {
    return this.prisma.aIModel.findFirst({
      where: {
        isEnabled: true,
        OR: [
          { modelId: { contains: "gemini", mode: "insensitive" } },
          { modelId: { contains: "gpt", mode: "insensitive" } },
          { provider: { contains: "google", mode: "insensitive" } },
          { provider: { contains: "openai", mode: "insensitive" } },
        ],
      },
      orderBy: { isDefault: "desc" },
    });
  }

  /**
   * 获取默认图片模型
   */
  private async getDefaultImageModel() {
    return this.prisma.aIModel.findFirst({
      where: {
        isEnabled: true,
        OR: [
          { modelId: { contains: "gemini", mode: "insensitive" } },
          { provider: { contains: "gemini", mode: "insensitive" } },
          { provider: { contains: "google", mode: "insensitive" } },
          { modelId: { contains: "imagen", mode: "insensitive" } },
          { provider: { contains: "openai", mode: "insensitive" } },
          { modelId: { contains: "dall", mode: "insensitive" } },
          { provider: { contains: "stability", mode: "insensitive" } },
          { provider: { contains: "together", mode: "insensitive" } },
        ],
      },
      orderBy: { isDefault: "desc" },
    });
  }

  /**
   * 根据ID获取模型
   */
  private async getModelById(id: string) {
    return this.prisma.aIModel.findFirst({
      where: { id, isEnabled: true },
    });
  }

  /**
   * 添加样式到提示词
   */
  private addStyleToPrompt(prompt: string, style?: string): string {
    const styleEnhancements: Record<string, string> = {
      realistic: "photorealistic, 8k uhd, high quality, detailed",
      artistic: "artistic, painterly, vibrant colors, expressive",
      anime: "anime style, detailed, vibrant, studio quality",
      "3d": "3D render, octane render, unreal engine, highly detailed",
      sketch: "pencil sketch, detailed line art, artistic",
      watercolor: "watercolor painting, soft colors, artistic",
    };

    const enhancement = style ? styleEnhancements[style] : "";
    return enhancement ? `${prompt}, ${enhancement}` : prompt;
  }

  /**
   * 获取尺寸
   */
  private getDimensions(aspectRatio: string): {
    width: number;
    height: number;
  } {
    const dimensions: Record<string, { width: number; height: number }> = {
      "1:1": { width: 1024, height: 1024 },
      "16:9": { width: 1344, height: 768 },
      "9:16": { width: 768, height: 1344 },
      "4:3": { width: 1152, height: 896 },
    };
    return dimensions[aspectRatio] || dimensions["1:1"];
  }

  /**
   * 生成占位图
   */
  private generatePlaceholder(
    originalPrompt: string,
    enhancedPrompt: string,
    aspectRatio?: string,
  ): GeneratedImageResult {
    const dimensions = this.getDimensions(aspectRatio || "1:1");
    const seed = encodeURIComponent(enhancedPrompt.slice(0, 50));

    return {
      id: `placeholder-${Date.now()}`,
      imageUrl: `https://picsum.photos/seed/${seed}/${dimensions.width}/${dimensions.height}`,
      prompt: originalPrompt.slice(0, 500),
      enhancedPrompt,
      width: dimensions.width,
      height: dimensions.height,
      createdAt: new Date().toISOString(),
    };
  }

  // ============ 图片生成 API 实现 ============

  /**
   * 使用 Gemini Image Generation API
   */
  private async generateWithGemini(
    apiKey: string,
    modelId: string,
    prompt: string,
    _dimensions: { width: number; height: number },
  ): Promise<string> {
    const model = modelId.includes("gemini")
      ? modelId
      : "gemini-2.0-flash-exp-image-generation";

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    this.logger.log(`Calling Gemini image API with model: ${model}`);

    const response = await firstValueFrom(
      this.httpService.post(
        url,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
          },
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 120000,
        },
      ),
    );

    const candidates = response.data.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error("No candidates in Gemini response");
    }

    const parts = candidates[0].content?.parts;
    if (!parts || parts.length === 0) {
      throw new Error("No parts in Gemini response");
    }

    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        const mimeType = part.inlineData.mimeType || "image/png";
        return `data:${mimeType};base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image data in Gemini response");
  }

  /**
   * 使用 OpenAI DALL-E API
   */
  private async generateWithOpenAI(
    apiKey: string,
    apiEndpoint: string | null,
    prompt: string,
    dimensions: { width: number; height: number },
  ): Promise<string> {
    const baseUrl = apiEndpoint || "https://api.openai.com/v1";
    const url = `${baseUrl}/images/generations`;

    const size =
      dimensions.width === dimensions.height
        ? "1024x1024"
        : dimensions.width > dimensions.height
          ? "1792x1024"
          : "1024x1792";

    const response = await firstValueFrom(
      this.httpService.post(
        url,
        {
          model: "dall-e-3",
          prompt,
          n: 1,
          size,
          quality: "hd",
          response_format: "url",
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
        },
      ),
    );

    return response.data.data[0].url;
  }

  /**
   * 使用 Stability AI API
   */
  private async generateWithStability(
    apiKey: string,
    apiEndpoint: string | null,
    prompt: string,
    dimensions: { width: number; height: number },
    negativePrompt?: string,
  ): Promise<string> {
    const url =
      apiEndpoint ||
      "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image";

    const response = await firstValueFrom(
      this.httpService.post(
        url,
        {
          text_prompts: [
            { text: prompt, weight: 1 },
            ...(negativePrompt ? [{ text: negativePrompt, weight: -1 }] : []),
          ],
          cfg_scale: 7,
          width: dimensions.width,
          height: dimensions.height,
          samples: 1,
          steps: 30,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
        },
      ),
    );

    const base64Image = response.data.artifacts[0].base64;
    return `data:image/png;base64,${base64Image}`;
  }

  /**
   * 使用 Replicate API
   */
  private async generateWithReplicate(
    apiKey: string,
    modelId: string,
    prompt: string,
    dimensions: { width: number; height: number },
    negativePrompt?: string,
  ): Promise<string> {
    const createResponse = await firstValueFrom(
      this.httpService.post(
        "https://api.replicate.com/v1/predictions",
        {
          version: modelId.includes(":")
            ? modelId.split(":")[1]
            : "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
          input: {
            prompt,
            negative_prompt: negativePrompt || "",
            width: dimensions.width,
            height: dimensions.height,
            num_outputs: 1,
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${apiKey}`,
          },
        },
      ),
    );

    const predictionId = createResponse.data.id;
    let result = createResponse.data;
    let attempts = 0;
    const maxAttempts = 60;

    while (
      result.status !== "succeeded" &&
      result.status !== "failed" &&
      attempts < maxAttempts
    ) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const pollResponse = await firstValueFrom(
        this.httpService.get(
          `https://api.replicate.com/v1/predictions/${predictionId}`,
          {
            headers: { Authorization: `Token ${apiKey}` },
          },
        ),
      );
      result = pollResponse.data;
      attempts++;
    }

    if (result.status === "failed" || attempts >= maxAttempts) {
      throw new Error("Replicate generation failed or timed out");
    }

    return result.output[0];
  }

  /**
   * 使用 Together AI API
   */
  private async generateWithTogether(
    apiKey: string,
    modelId: string,
    prompt: string,
    dimensions: { width: number; height: number },
  ): Promise<string> {
    const response = await firstValueFrom(
      this.httpService.post(
        "https://api.together.xyz/v1/images/generations",
        {
          model: modelId || "black-forest-labs/FLUX.1-schnell-Free",
          prompt,
          width: dimensions.width,
          height: dimensions.height,
          n: 1,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
        },
      ),
    );

    return response.data.data[0].url || response.data.data[0].b64_json
      ? `data:image/png;base64,${response.data.data[0].b64_json}`
      : response.data.data[0].url;
  }

  /**
   * OpenAI 兼容 API
   */
  private async generateWithOpenAICompatible(
    apiKey: string,
    apiEndpoint: string | null,
    modelId: string,
    prompt: string,
    dimensions: { width: number; height: number },
  ): Promise<string> {
    const baseUrl = apiEndpoint || "https://api.openai.com/v1";
    const url = `${baseUrl}/images/generations`;

    const response = await firstValueFrom(
      this.httpService.post(
        url,
        {
          model: modelId,
          prompt,
          n: 1,
          size: `${dimensions.width}x${dimensions.height}`,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
        },
      ),
    );

    return (
      response.data.data[0].url ||
      (response.data.data[0].b64_json
        ? `data:image/png;base64,${response.data.data[0].b64_json}`
        : null)
    );
  }

  // ============ 历史记录 ============

  /**
   * 获取用户生成历史
   */
  async getHistory(userId?: string): Promise<GeneratedImageResult[]> {
    const images = await this.prisma.generatedImage.findMany({
      where: userId ? { userId } : {},
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return images.map((img) => ({
      id: img.id,
      imageUrl: img.imageUrl,
      prompt: img.prompt,
      enhancedPrompt: img.enhancedPrompt || undefined,
      width: img.width,
      height: img.height,
      createdAt: img.createdAt.toISOString(),
    }));
  }

  /**
   * 获取单个图片
   */
  async getImage(id: string): Promise<GeneratedImageResult | null> {
    const image = await this.prisma.generatedImage.findUnique({
      where: { id },
    });

    if (!image) return null;

    return {
      id: image.id,
      imageUrl: image.imageUrl,
      prompt: image.prompt,
      enhancedPrompt: image.enhancedPrompt || undefined,
      width: image.width,
      height: image.height,
      createdAt: image.createdAt.toISOString(),
    };
  }
}
