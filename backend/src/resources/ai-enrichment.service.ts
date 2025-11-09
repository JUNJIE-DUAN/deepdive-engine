import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getErrorMessage } from '../common/utils/error.utils';
import axios, { AxiosInstance } from 'axios';

/**
 * AI 增强服务
 * 负责调用 AI 服务进行内容摘要、洞察提取和分类
 */
@Injectable()
export class AIEnrichmentService {
  private readonly logger = new Logger(AIEnrichmentService.name);
  private readonly aiServiceUrl: string;
  private readonly httpClient: AxiosInstance;

  constructor(private configService: ConfigService) {
    this.aiServiceUrl = this.configService.get<string>('AI_SERVICE_URL', 'http://localhost:5000');
    this.httpClient = axios.create({
      baseURL: this.aiServiceUrl,
      timeout: 30000, // 30秒超时
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * 生成内容摘要
   */
  async generateSummary(content: string, maxLength = 200, language: 'zh' | 'en' = 'zh'): Promise<string | null> {
    try {
      this.logger.log(`Generating summary for content (length: ${content.length})`);

      const response = await this.httpClient.post('/api/v1/ai/summary', {
        content,
        max_length: maxLength,
        language,
      });

      const summary = response.data.summary;
      this.logger.log(`Summary generated using ${response.data.model_used}`);

      return summary;
    } catch (error) {
      this.logger.error(`Failed to generate summary: ${getErrorMessage(error)}`);
      return null;
    }
  }

  /**
   * 提取关键洞察
   */
  async extractInsights(content: string, language: 'zh' | 'en' = 'zh'): Promise<any[] | null> {
    try {
      this.logger.log(`Extracting insights for content (length: ${content.length})`);

      const response = await this.httpClient.post('/api/v1/ai/insights', {
        content,
        language,
      });

      const insights = response.data.insights;
      this.logger.log(`Extracted ${insights.length} insights using ${response.data.model_used}`);

      return insights;
    } catch (error) {
      this.logger.error(`Failed to extract insights: ${getErrorMessage(error)}`);
      return null;
    }
  }

  /**
   * 分类内容
   */
  async classifyContent(content: string): Promise<{
    category: string;
    subcategories: string[];
    tags: string[];
    difficultyLevel: string;
  } | null> {
    try {
      this.logger.log(`Classifying content (length: ${content.length})`);

      const response = await this.httpClient.post('/api/v1/ai/classify', {
        content,
      });

      const classification = {
        category: response.data.category,
        subcategories: response.data.subcategories,
        tags: response.data.tags,
        difficultyLevel: response.data.difficulty_level,
      };

      this.logger.log(`Content classified as ${classification.category} (${classification.difficultyLevel})`);

      return classification;
    } catch (error) {
      this.logger.error(`Failed to classify content: ${getErrorMessage(error)}`);
      return null;
    }
  }

  /**
   * 完整的 AI 增强处理
   * 对资源内容进行摘要、洞察提取和分类
   */
  async enrichResource(resource: {
    title: string;
    abstract?: string;
    content?: string;
    sourceUrl?: string;
  }): Promise<{
    aiSummary: string | null;
    keyInsights: any[];
    primaryCategory: string | null;
    autoTags: string[];
    difficultyLevel: number | null;
  }> {
    // 构建用于 AI 分析的内容
    const contentForAI = this.buildContentForAI(resource);

    this.logger.log(`Enriching resource: ${resource.title}`);

    // 并行调用所有 AI 服务
    const [summary, insights, classification] = await Promise.all([
      this.generateSummary(contentForAI, 200, 'zh'),
      this.extractInsights(contentForAI, 'zh'),
      this.classifyContent(contentForAI),
    ]);

    // 将难度等级字符串转换为数字
    const difficultyLevelNum = classification?.difficultyLevel
      ? this.mapDifficultyToNumber(classification.difficultyLevel)
      : null;

    const result = {
      aiSummary: summary,
      keyInsights: insights || [],
      primaryCategory: classification?.category || null,
      autoTags: classification?.tags || [],
      difficultyLevel: difficultyLevelNum,
    };

    this.logger.log(`Resource enrichment completed: ${result.aiSummary ? 'summary ✓' : 'summary ✗'}, ${result.keyInsights.length} insights, ${result.autoTags.length} tags`);

    return result;
  }

  /**
   * 将难度等级字符串映射为数字
   */
  private mapDifficultyToNumber(difficulty: string): number {
    const mapping: Record<string, number> = {
      beginner: 1,
      intermediate: 2,
      advanced: 3,
      expert: 4,
    };

    return mapping[difficulty.toLowerCase()] || 2; // 默认为 intermediate
  }

  /**
   * 构建用于 AI 分析的内容
   * 组合标题、摘要和内容
   */
  private buildContentForAI(resource: {
    title: string;
    abstract?: string;
    content?: string;
    sourceUrl?: string;
  }): string {
    const parts: string[] = [];

    // 标题
    if (resource.title) {
      parts.push(`标题: ${resource.title}`);
    }

    // 摘要
    if (resource.abstract) {
      parts.push(`摘要: ${resource.abstract}`);
    }

    // 内容（截取前2000字符以控制成本）
    if (resource.content) {
      const truncatedContent = resource.content.substring(0, 2000);
      parts.push(`内容: ${truncatedContent}${resource.content.length > 2000 ? '...' : ''}`);
    }

    // URL 作为补充信息
    if (resource.sourceUrl) {
      parts.push(`来源: ${resource.sourceUrl}`);
    }

    return parts.join('\n\n');
  }

  /**
   * 检查 AI 服务健康状态
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.httpClient.get('/api/v1/ai/health', {
        timeout: 5000,
      });

      const isHealthy = response.data.status === 'ok' || response.data.status === 'degraded';
      this.logger.log(`AI service health: ${response.data.status} (${response.data.active_model})`);

      return isHealthy;
    } catch (error) {
      this.logger.error(`AI service health check failed: ${getErrorMessage(error)}`);
      return false;
    }
  }
}
