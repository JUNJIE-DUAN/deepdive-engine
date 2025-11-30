import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";

export interface GeneratedImageResult {
  id: string;
  imageUrl: string;
  prompt: string;
  width: number;
  height: number;
  createdAt: string;
}

@Injectable()
export class AiImageService {
  private readonly logger = new Logger(AiImageService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
  ) {}

  /**
   * 获取支持图片生成的 AI 模型
   * 优先获取 provider 包含 image/flux/stable/dall 的模型
   */
  private async getImageModel() {
    // 查找图片生成模型
    const imageModel = await this.prisma.aIModel.findFirst({
      where: {
        isEnabled: true,
        OR: [
          { provider: { contains: "flux", mode: "insensitive" } },
          { provider: { contains: "stable", mode: "insensitive" } },
          { provider: { contains: "image", mode: "insensitive" } },
          { provider: { contains: "dall", mode: "insensitive" } },
          { modelId: { contains: "flux", mode: "insensitive" } },
          { modelId: { contains: "stable", mode: "insensitive" } },
          { modelId: { contains: "dall", mode: "insensitive" } },
          { modelId: { contains: "imagen", mode: "insensitive" } },
        ],
      },
      orderBy: { isDefault: "desc" },
    });

    if (imageModel) {
      return imageModel;
    }

    // 如果没有专门的图片模型，尝试使用 OpenAI 模型（支持 DALL-E）
    const openaiModel = await this.prisma.aIModel.findFirst({
      where: {
        isEnabled: true,
        OR: [
          { provider: { contains: "openai", mode: "insensitive" } },
          { apiEndpoint: { contains: "openai", mode: "insensitive" } },
        ],
      },
      orderBy: { isDefault: "desc" },
    });

    return openaiModel;
  }

  /**
   * 生成图片 - 使用系统配置的 AI 模型
   */
  async generateImage(
    prompt: string,
    style?: string,
    aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3",
    negativePrompt?: string,
    userId?: string,
  ): Promise<GeneratedImageResult> {
    if (!prompt || prompt.trim().length === 0) {
      throw new BadRequestException("Prompt is required");
    }

    // 获取图片生成模型配置
    const modelConfig = await this.getImageModel();

    if (!modelConfig || !modelConfig.apiKey) {
      this.logger.warn(
        "No image generation model configured, using placeholder",
      );
      return this.generatePlaceholder(prompt, aspectRatio);
    }

    // 增强提示词
    const enhancedPrompt = this.enhancePrompt(prompt, style);
    const dimensions = this.getDimensions(aspectRatio || "1:1");

    this.logger.log(
      `Generating image with ${modelConfig.provider}/${modelConfig.modelId}: "${enhancedPrompt.slice(0, 50)}..."`,
    );

    try {
      let imageUrl: string;

      // 根据 provider 或 apiEndpoint 判断使用哪个 API
      const provider = modelConfig.provider.toLowerCase();
      const endpoint = modelConfig.apiEndpoint?.toLowerCase() || "";
      const modelId = modelConfig.modelId.toLowerCase();

      if (
        provider.includes("openai") ||
        endpoint.includes("openai") ||
        modelId.includes("dall")
      ) {
        imageUrl = await this.generateWithOpenAI(
          modelConfig.apiKey,
          modelConfig.apiEndpoint,
          enhancedPrompt,
          dimensions,
        );
      } else if (
        provider.includes("stability") ||
        endpoint.includes("stability") ||
        modelId.includes("stable")
      ) {
        imageUrl = await this.generateWithStability(
          modelConfig.apiKey,
          modelConfig.apiEndpoint,
          enhancedPrompt,
          dimensions,
          negativePrompt,
        );
      } else if (
        provider.includes("replicate") ||
        endpoint.includes("replicate") ||
        modelId.includes("flux")
      ) {
        imageUrl = await this.generateWithReplicate(
          modelConfig.apiKey,
          modelConfig.modelId,
          enhancedPrompt,
          dimensions,
          negativePrompt,
        );
      } else if (
        provider.includes("together") ||
        endpoint.includes("together")
      ) {
        imageUrl = await this.generateWithTogether(
          modelConfig.apiKey,
          modelConfig.modelId,
          enhancedPrompt,
          dimensions,
        );
      } else if (provider.includes("google") || modelId.includes("imagen")) {
        imageUrl = await this.generateWithGoogle(
          modelConfig.apiKey,
          enhancedPrompt,
          dimensions,
        );
      } else {
        // 默认尝试 OpenAI 兼容 API
        imageUrl = await this.generateWithOpenAICompatible(
          modelConfig.apiKey,
          modelConfig.apiEndpoint,
          modelConfig.modelId,
          enhancedPrompt,
          dimensions,
        );
      }

      // 保存到数据库
      const image = await this.prisma.generatedImage.create({
        data: {
          prompt: prompt.trim(),
          enhancedPrompt,
          style: style || "realistic",
          aspectRatio: aspectRatio || "1:1",
          imageUrl,
          width: dimensions.width,
          height: dimensions.height,
          provider: modelConfig.provider,
          userId,
        },
      });

      this.logger.log(`Image generated successfully: ${image.id}`);

      return {
        id: image.id,
        imageUrl: image.imageUrl,
        prompt: image.prompt,
        width: image.width,
        height: image.height,
        createdAt: image.createdAt.toISOString(),
      };
    } catch (error) {
      this.logger.error("Image generation failed:", error);
      // 返回占位图
      return this.generatePlaceholder(prompt, aspectRatio);
    }
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

    // DALL-E 3 支持的尺寸
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
   * 使用 Replicate API (Flux, SDXL)
   */
  private async generateWithReplicate(
    apiKey: string,
    modelId: string,
    prompt: string,
    dimensions: { width: number; height: number },
    negativePrompt?: string,
  ): Promise<string> {
    // 创建预测
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

    // 轮询等待结果
    const predictionId = createResponse.data.id;
    let result = createResponse.data;
    let attempts = 0;
    const maxAttempts = 60; // 最多等待60秒

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
            headers: {
              Authorization: `Token ${apiKey}`,
            },
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
   * 使用 Google Imagen API
   */
  private async generateWithGoogle(
    apiKey: string,
    prompt: string,
    dimensions: { width: number; height: number },
  ): Promise<string> {
    const response = await firstValueFrom(
      this.httpService.post(
        `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`,
        {
          instances: [{ prompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio:
              dimensions.width === dimensions.height
                ? "1:1"
                : dimensions.width > dimensions.height
                  ? "16:9"
                  : "9:16",
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

    const base64Image = response.data.predictions[0].bytesBase64Encoded;
    return `data:image/png;base64,${base64Image}`;
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

  /**
   * 生成占位图
   */
  private generatePlaceholder(
    prompt: string,
    aspectRatio?: string,
  ): GeneratedImageResult {
    const dimensions = this.getDimensions(aspectRatio || "1:1");
    const seed = encodeURIComponent(prompt.slice(0, 50));

    return {
      id: `placeholder-${Date.now()}`,
      imageUrl: `https://picsum.photos/seed/${seed}/${dimensions.width}/${dimensions.height}`,
      prompt: prompt.trim(),
      width: dimensions.width,
      height: dimensions.height,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * 增强提示词
   */
  private enhancePrompt(prompt: string, style?: string): string {
    const styleEnhancements: Record<string, string> = {
      realistic: "photorealistic, 8k uhd, high quality, detailed",
      artistic: "artistic, painterly, vibrant colors, expressive",
      anime: "anime style, detailed, vibrant, studio quality",
      "3d": "3D render, octane render, unreal engine, highly detailed",
      sketch: "pencil sketch, detailed line art, artistic",
      watercolor: "watercolor painting, soft colors, artistic",
    };

    const enhancement =
      styleEnhancements[style || "realistic"] || styleEnhancements.realistic;
    return `${prompt}, ${enhancement}`;
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
      width: image.width,
      height: image.height,
      createdAt: image.createdAt.toISOString(),
    };
  }

  /**
   * 获取可用的图片生成模型信息
   */
  async getAvailableModels() {
    const models = await this.prisma.aIModel.findMany({
      where: {
        isEnabled: true,
        OR: [
          { provider: { contains: "flux", mode: "insensitive" } },
          { provider: { contains: "stable", mode: "insensitive" } },
          { provider: { contains: "image", mode: "insensitive" } },
          { provider: { contains: "dall", mode: "insensitive" } },
          { provider: { contains: "openai", mode: "insensitive" } },
          { provider: { contains: "together", mode: "insensitive" } },
          { provider: { contains: "replicate", mode: "insensitive" } },
          { provider: { contains: "google", mode: "insensitive" } },
          { modelId: { contains: "flux", mode: "insensitive" } },
          { modelId: { contains: "stable", mode: "insensitive" } },
          { modelId: { contains: "dall", mode: "insensitive" } },
          { modelId: { contains: "imagen", mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        displayName: true,
        provider: true,
        modelId: true,
        icon: true,
      },
      orderBy: { isDefault: "desc" },
    });

    return models;
  }
}
