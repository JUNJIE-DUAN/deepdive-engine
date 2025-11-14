/**
 * AI上下文构建器
 *
 * 为不同类型的资源构建统一、结构化的AI上下文
 * 遵循 docs/AI_CONTEXT_ARCHITECTURE.md 中定义的架构
 */

// ==================== 类型定义 ====================

export type ResourceType = 'PAPER' | 'PROJECT' | 'NEWS' | 'YOUTUBE_VIDEO';

export interface ResourceContextConfig {
  includeCore: boolean;
  includeMetadata: boolean;
  includeMetrics: boolean;
  includeTaxonomy: boolean;
  maxContentLength: number;
}

export const DEFAULT_CONFIG: ResourceContextConfig = {
  includeCore: true,
  includeMetadata: true,
  includeMetrics: true,
  includeTaxonomy: true,
  maxContentLength: 15000,
};

// 资源接口定义
export interface BaseResource {
  id: string;
  type: ResourceType;
  title: string;
  sourceUrl?: string;
}

export interface PaperResource extends BaseResource {
  type: 'PAPER';
  abstract?: string;
  pdfText?: string;
  authors?: Array<{ username?: string; platform?: string }>;
  publishedAt?: string;
  categories?: string[];
  qualityScore?: number;
  upvoteCount?: number;
  viewCount?: number;
  tags?: string[];
}

export interface ProjectResource extends BaseResource {
  type: 'PROJECT';
  description?: string;
  readme?: string;
  owner?: string;
  repository?: string;
  language?: string;
  license?: string;
  createdAt?: string;
  updatedAt?: string;
  stars?: number;
  forks?: number;
  issues?: number;
  contributors?: number;
  upvoteCount?: number;
  viewCount?: number;
  topics?: string[];
  tags?: string[];
}

export interface NewsResource extends BaseResource {
  type: 'NEWS';
  fullText?: string;
  summary?: string;
  author?: string;
  publisher?: string;
  publishedAt?: string;
  section?: string;
  readTime?: number;
  upvoteCount?: number;
  viewCount?: number;
  shares?: number;
  categories?: string[];
  tags?: string[];
}

export interface VideoResource extends BaseResource {
  type: 'YOUTUBE_VIDEO';
  transcript?: string;
  description?: string;
  chapters?: Array<{ timestamp: string; title: string }>;
  channel?: string;
  channelId?: string;
  creator?: string;
  publishedAt?: string;
  duration?: string;
  language?: string;
  views?: number;
  likes?: number;
  comments?: number;
  subscribers?: number;
  upvoteCount?: number;
  categories?: string[];
  tags?: string[];
  topics?: string[];
}

export type Resource =
  | PaperResource
  | ProjectResource
  | NewsResource
  | VideoResource;

// ==================== 构建器接口 ====================

interface ContextBuilder {
  build(resource: Resource, config: ResourceContextConfig): string;
}

// ==================== 主入口类 ====================

export class AIContextBuilder {
  /**
   * 主入口：根据资源类型构建上下文
   */
  static buildContext(
    resource: Resource,
    config: ResourceContextConfig = DEFAULT_CONFIG
  ): string {
    const builder = this.getBuilderForType(resource.type);
    return builder.build(resource, config);
  }

  /**
   * 获取对应资源类型的构建器
   */
  private static getBuilderForType(type: ResourceType): ContextBuilder {
    switch (type) {
      case 'PAPER':
        return new PaperContextBuilder();
      case 'PROJECT':
        return new ProjectContextBuilder();
      case 'NEWS':
        return new NewsContextBuilder();
      case 'YOUTUBE_VIDEO':
        return new VideoContextBuilder();
      default:
        return new GenericContextBuilder();
    }
  }
}

// ==================== 论文上下文构建器 ====================

class PaperContextBuilder implements ContextBuilder {
  build(resource: PaperResource, config: ResourceContextConfig): string {
    const sections: string[] = [];

    // Header
    sections.push('=== RESOURCE TYPE: Academic Paper ===\n');

    // Core content
    if (config.includeCore) {
      sections.push(this.buildCoreSection(resource, config.maxContentLength));
    }

    // Metadata
    if (config.includeMetadata) {
      sections.push(this.buildMetadataSection(resource));
    }

    // Metrics
    if (config.includeMetrics) {
      sections.push(this.buildMetricsSection(resource));
    }

    // Taxonomy
    if (config.includeTaxonomy) {
      sections.push(this.buildTaxonomySection(resource));
    }

    // Source
    if (resource.sourceUrl) {
      sections.push(`SOURCE: ${resource.sourceUrl}`);
    }

    return sections.join('\n\n');
  }

  private buildCoreSection(resource: PaperResource, maxLength: number): string {
    const parts: string[] = ['CORE CONTENT:'];

    parts.push(`Title: ${resource.title}`);

    // Authors
    if (resource.authors && resource.authors.length > 0) {
      const authorNames = resource.authors
        .map((a) => a.username || a.platform || 'Unknown')
        .join(', ');
      parts.push(`Authors: ${authorNames}`);
    }

    // Published date
    if (resource.publishedAt) {
      parts.push(
        `Published: ${new Date(resource.publishedAt).toLocaleDateString()}`
      );
    }

    // Abstract
    if (resource.abstract) {
      parts.push(`\nABSTRACT:\n${resource.abstract}`);
    }

    // PDF full text
    if (resource.pdfText && resource.pdfText.trim()) {
      const truncated = resource.pdfText.substring(0, maxLength);
      parts.push(
        `\nPDF FULL TEXT (first ${truncated.length} characters):\n${truncated}`
      );
    }

    return parts.join('\n');
  }

  private buildMetadataSection(resource: PaperResource): string {
    const parts: string[] = ['METADATA:'];

    if (resource.categories && resource.categories.length > 0) {
      parts.push(`Categories: ${resource.categories.join(', ')}`);
    }

    if (resource.qualityScore) {
      parts.push(`Quality Score: ${resource.qualityScore}/10`);
    }

    return parts.length > 1 ? parts.join('\n') : '';
  }

  private buildMetricsSection(resource: PaperResource): string {
    const metrics: string[] = [];

    if (resource.upvoteCount) {
      metrics.push(`${resource.upvoteCount} upvotes`);
    }

    if (resource.viewCount) {
      metrics.push(`${resource.viewCount} views`);
    }

    return metrics.length > 0 ? `ENGAGEMENT:\n${metrics.join(', ')}` : '';
  }

  private buildTaxonomySection(resource: PaperResource): string {
    if (resource.tags && resource.tags.length > 0) {
      return `TAGS: ${resource.tags.join(', ')}`;
    }
    return '';
  }
}

// ==================== 开源项目上下文构建器 ====================

class ProjectContextBuilder implements ContextBuilder {
  build(resource: ProjectResource, config: ResourceContextConfig): string {
    const sections: string[] = [];

    // Header
    sections.push('=== RESOURCE TYPE: Open Source Project ===\n');

    // Core info
    if (config.includeCore) {
      sections.push(this.buildCoreSection(resource, config.maxContentLength));
    }

    // Metadata
    if (config.includeMetadata) {
      sections.push(this.buildMetadataSection(resource));
    }

    // Metrics
    if (config.includeMetrics) {
      sections.push(this.buildMetricsSection(resource));
    }

    // Taxonomy
    if (config.includeTaxonomy) {
      sections.push(this.buildTaxonomySection(resource));
    }

    // Source
    if (resource.sourceUrl) {
      sections.push(`SOURCE: ${resource.sourceUrl}`);
    }

    return sections.join('\n\n');
  }

  private buildCoreSection(
    resource: ProjectResource,
    maxLength: number
  ): string {
    const parts: string[] = ['CORE INFO:'];

    if (resource.owner && resource.repository) {
      parts.push(`Project: ${resource.owner}/${resource.repository}`);
    } else {
      parts.push(`Project: ${resource.title}`);
    }

    if (resource.language) {
      parts.push(`Language: ${resource.language}`);
    }

    if (resource.license) {
      parts.push(`License: ${resource.license}`);
    }

    if (resource.createdAt) {
      parts.push(
        `Created: ${new Date(resource.createdAt).toLocaleDateString()}`
      );
    }

    if (resource.updatedAt) {
      parts.push(
        `Last Updated: ${new Date(resource.updatedAt).toLocaleDateString()}`
      );
    }

    // Description
    if (resource.description) {
      parts.push(`\nDESCRIPTION:\n${resource.description}`);
    }

    // README
    if (resource.readme && resource.readme.trim()) {
      const truncated = resource.readme.substring(0, maxLength);
      parts.push(
        `\nREADME CONTENT (first ${truncated.length} characters):\n${truncated}`
      );
    }

    return parts.join('\n');
  }

  private buildMetadataSection(resource: ProjectResource): string {
    return ''; // Can be extended later
  }

  private buildMetricsSection(resource: ProjectResource): string {
    const metrics: string[] = ['REPOSITORY STATS:'];

    if (resource.stars !== undefined) {
      metrics.push(`⭐ ${resource.stars} stars`);
    }

    if (resource.forks !== undefined) {
      metrics.push(`🍴 ${resource.forks} forks`);
    }

    if (resource.contributors !== undefined) {
      metrics.push(`📊 ${resource.contributors} contributors`);
    }

    if (resource.issues !== undefined) {
      metrics.push(`🐛 ${resource.issues} open issues`);
    }

    if (resource.viewCount) {
      metrics.push(`👁️ ${resource.viewCount} views`);
    }

    if (resource.upvoteCount) {
      metrics.push(`👍 ${resource.upvoteCount} upvotes`);
    }

    return metrics.length > 1 ? metrics.join(' | ') : '';
  }

  private buildTaxonomySection(resource: ProjectResource): string {
    const parts: string[] = [];

    if (resource.topics && resource.topics.length > 0) {
      parts.push(`TOPICS: ${resource.topics.join(', ')}`);
    }

    if (resource.tags && resource.tags.length > 0) {
      parts.push(`TAGS: ${resource.tags.join(', ')}`);
    }

    return parts.join('\n');
  }
}

// ==================== 新闻上下文构建器 ====================

class NewsContextBuilder implements ContextBuilder {
  build(resource: NewsResource, config: ResourceContextConfig): string {
    const sections: string[] = [];

    // Header
    sections.push('=== RESOURCE TYPE: News Article ===\n');

    // Core content
    if (config.includeCore) {
      sections.push(this.buildCoreSection(resource, config.maxContentLength));
    }

    // Metadata
    if (config.includeMetadata) {
      sections.push(this.buildMetadataSection(resource));
    }

    // Metrics
    if (config.includeMetrics) {
      sections.push(this.buildMetricsSection(resource));
    }

    // Taxonomy
    if (config.includeTaxonomy) {
      sections.push(this.buildTaxonomySection(resource));
    }

    // Source
    if (resource.sourceUrl) {
      sections.push(`SOURCE: ${resource.sourceUrl}`);
    }

    return sections.join('\n\n');
  }

  private buildCoreSection(resource: NewsResource, maxLength: number): string {
    const parts: string[] = [];

    parts.push(`HEADLINE: ${resource.title}`);

    if (resource.author) {
      parts.push(`Author: ${resource.author}`);
    }

    if (resource.publisher) {
      parts.push(`Publisher: ${resource.publisher}`);
    }

    if (resource.publishedAt) {
      parts.push(
        `Published: ${new Date(resource.publishedAt).toLocaleDateString()}`
      );
    }

    if (resource.section) {
      parts.push(`Section: ${resource.section}`);
    }

    if (resource.readTime) {
      parts.push(`Reading Time: ~${resource.readTime} minutes`);
    }

    // Summary
    if (resource.summary) {
      parts.push(`\nSUMMARY:\n${resource.summary}`);
    }

    // Full text
    if (resource.fullText && resource.fullText.trim()) {
      const truncated = resource.fullText.substring(0, maxLength);
      parts.push(
        `\nFULL ARTICLE (first ${truncated.length} characters):\n${truncated}`
      );
    }

    return parts.join('\n');
  }

  private buildMetadataSection(resource: NewsResource): string {
    return ''; // Can be extended later
  }

  private buildMetricsSection(resource: NewsResource): string {
    const metrics: string[] = [];

    if (resource.viewCount) {
      metrics.push(`${resource.viewCount} views`);
    }

    if (resource.upvoteCount) {
      metrics.push(`${resource.upvoteCount} upvotes`);
    }

    if (resource.shares) {
      metrics.push(`${resource.shares} shares`);
    }

    return metrics.length > 0 ? `ENGAGEMENT:\n${metrics.join(' | ')}` : '';
  }

  private buildTaxonomySection(resource: NewsResource): string {
    const parts: string[] = [];

    if (resource.categories && resource.categories.length > 0) {
      parts.push(`CATEGORIES: ${resource.categories.join(', ')}`);
    }

    if (resource.tags && resource.tags.length > 0) {
      parts.push(`TAGS: ${resource.tags.join(', ')}`);
    }

    return parts.join('\n');
  }
}

// ==================== 视频上下文构建器 ====================

class VideoContextBuilder implements ContextBuilder {
  build(resource: VideoResource, config: ResourceContextConfig): string {
    const sections: string[] = [];

    // Header
    sections.push('=== RESOURCE TYPE: Video Content ===\n');

    // Core content
    if (config.includeCore) {
      sections.push(this.buildCoreSection(resource, config.maxContentLength));
    }

    // Metadata
    if (config.includeMetadata) {
      sections.push(this.buildMetadataSection(resource));
    }

    // Metrics
    if (config.includeMetrics) {
      sections.push(this.buildMetricsSection(resource));
    }

    // Taxonomy
    if (config.includeTaxonomy) {
      sections.push(this.buildTaxonomySection(resource));
    }

    // Source
    if (resource.sourceUrl) {
      sections.push(`SOURCE: ${resource.sourceUrl}`);
    }

    return sections.join('\n\n');
  }

  private buildCoreSection(resource: VideoResource, maxLength: number): string {
    const parts: string[] = [];

    parts.push(`VIDEO: ${resource.title}`);

    if (resource.channel) {
      const channelInfo = resource.subscribers
        ? `${resource.channel} (${resource.subscribers} subscribers)`
        : resource.channel;
      parts.push(`Channel: ${channelInfo}`);
    }

    if (resource.creator) {
      parts.push(`Creator: ${resource.creator}`);
    }

    if (resource.publishedAt) {
      parts.push(
        `Published: ${new Date(resource.publishedAt).toLocaleDateString()}`
      );
    }

    if (resource.duration) {
      parts.push(`Duration: ${resource.duration}`);
    }

    if (resource.language) {
      parts.push(`Language: ${resource.language}`);
    }

    // Description
    if (resource.description) {
      parts.push(`\nDESCRIPTION:\n${resource.description}`);
    }

    // Chapters
    if (resource.chapters && resource.chapters.length > 0) {
      parts.push('\nCHAPTERS:');
      resource.chapters.forEach((chapter) => {
        parts.push(`${chapter.timestamp} - ${chapter.title}`);
      });
    }

    // Transcript
    if (resource.transcript && resource.transcript.trim()) {
      const truncated = resource.transcript.substring(0, maxLength);
      parts.push(
        `\nVIDEO TRANSCRIPT (first ${truncated.length} characters):\n${truncated}`
      );
    }

    return parts.join('\n');
  }

  private buildMetadataSection(resource: VideoResource): string {
    return ''; // Can be extended later
  }

  private buildMetricsSection(resource: VideoResource): string {
    const metrics: string[] = ['ENGAGEMENT:'];

    if (resource.views) {
      metrics.push(`👁️ ${resource.views} views`);
    }

    if (resource.likes) {
      metrics.push(`👍 ${resource.likes} likes`);
    }

    if (resource.comments) {
      metrics.push(`💬 ${resource.comments} comments`);
    }

    if (resource.upvoteCount) {
      metrics.push(`⭐ ${resource.upvoteCount} upvotes (internal)`);
    }

    return metrics.length > 1 ? metrics.join(' | ') : '';
  }

  private buildTaxonomySection(resource: VideoResource): string {
    const parts: string[] = [];

    if (resource.topics && resource.topics.length > 0) {
      parts.push(`TOPICS: ${resource.topics.join(', ')}`);
    }

    if (resource.categories && resource.categories.length > 0) {
      parts.push(`CATEGORIES: ${resource.categories.join(', ')}`);
    }

    if (resource.tags && resource.tags.length > 0) {
      parts.push(`TAGS: ${resource.tags.join(', ')}`);
    }

    return parts.join('\n');
  }
}

// ==================== 通用构建器（兜底） ====================

class GenericContextBuilder implements ContextBuilder {
  build(resource: Resource, config: ResourceContextConfig): string {
    return `=== RESOURCE: ${resource.title} ===\n\nType: ${resource.type}\nSource: ${resource.sourceUrl || 'N/A'}`;
  }
}
