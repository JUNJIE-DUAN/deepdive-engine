import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { ConfigService } from "@nestjs/config";
import axios from "axios";

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
    private readonly configService: ConfigService,
  ) {}

  /**
   * 生成图片
   * 支持多个 AI 图片生成服务：
   * - Stability AI (Stable Diffusion)
   * - OpenAI DALL-E
   * - Replicate
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

    // 增强提示词
    const enhancedPrompt = this.enhancePrompt(prompt, style);

    // 计算尺寸
    const dimensions = this.getDimensions(aspectRatio || "1:1");

    this.logger.log(`Generating image: "${enhancedPrompt.slice(0, 50)}..."`);

    try {
      // 尝试使用配置的图片生成服务
      const provider = this.configService.get<string>(
        "IMAGE_GENERATION_PROVIDER",
        "stability",
      );

      let imageUrl: string;

      switch (provider) {
        case "openai":
          imageUrl = await this.generateWithOpenAI(enhancedPrompt, dimensions);
          break;
        case "replicate":
          imageUrl = await this.generateWithReplicate(
            enhancedPrompt,
            dimensions,
            negativePrompt,
          );
          break;
        case "stability":
        default:
          imageUrl = await this.generateWithStability(
            enhancedPrompt,
            dimensions,
            negativePrompt,
          );
          break;
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
          provider,
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

      // 如果所有服务都失败，返回占位图
      const placeholderUrl = this.getPlaceholderImage(dimensions, prompt);

      return {
        id: `placeholder-${Date.now()}`,
        imageUrl: placeholderUrl,
        prompt: prompt.trim(),
        width: dimensions.width,
        height: dimensions.height,
        createdAt: new Date().toISOString(),
      };
    }
  }

  /**
   * 使用 Stability AI 生成图片
   */
  private async generateWithStability(
    prompt: string,
    dimensions: { width: number; height: number },
    negativePrompt?: string,
  ): Promise<string> {
    const apiKey = this.configService.get<string>("STABILITY_API_KEY");

    if (!apiKey) {
      throw new Error("Stability API key not configured");
    }

    const response = await axios.post(
      "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image",
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
    );

    const base64Image = response.data.artifacts[0].base64;
    // 这里可以上传到 CDN 或直接返回 base64
    return `data:image/png;base64,${base64Image}`;
  }

  /**
   * 使用 OpenAI DALL-E 生成图片
   */
  private async generateWithOpenAI(
    prompt: string,
    dimensions: { width: number; height: number },
  ): Promise<string> {
    const apiKey = this.configService.get<string>("OPENAI_API_KEY");

    if (!apiKey) {
      throw new Error("OpenAI API key not configured");
    }

    // DALL-E 3 支持的尺寸
    const size =
      dimensions.width === dimensions.height
        ? "1024x1024"
        : dimensions.width > dimensions.height
          ? "1792x1024"
          : "1024x1792";

    const response = await axios.post(
      "https://api.openai.com/v1/images/generations",
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
    );

    return response.data.data[0].url;
  }

  /**
   * 使用 Replicate 生成图片
   */
  private async generateWithReplicate(
    prompt: string,
    dimensions: { width: number; height: number },
    negativePrompt?: string,
  ): Promise<string> {
    const apiKey = this.configService.get<string>("REPLICATE_API_KEY");

    if (!apiKey) {
      throw new Error("Replicate API key not configured");
    }

    // 使用 SDXL 模型
    const response = await axios.post(
      "https://api.replicate.com/v1/predictions",
      {
        version:
          "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
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
    );

    // 轮询等待结果
    const predictionId = response.data.id;
    let result = response.data;

    while (result.status !== "succeeded" && result.status !== "failed") {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const pollResponse = await axios.get(
        `https://api.replicate.com/v1/predictions/${predictionId}`,
        {
          headers: {
            Authorization: `Token ${apiKey}`,
          },
        },
      );
      result = pollResponse.data;
    }

    if (result.status === "failed") {
      throw new Error("Replicate generation failed");
    }

    return result.output[0];
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
   * 获取占位图（当 API 不可用时）
   */
  private getPlaceholderImage(
    dimensions: { width: number; height: number },
    prompt: string,
  ): string {
    // 使用 picsum.photos 或类似服务作为占位
    const seed = encodeURIComponent(prompt.slice(0, 50));
    return `https://picsum.photos/seed/${seed}/${dimensions.width}/${dimensions.height}`;
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
}
