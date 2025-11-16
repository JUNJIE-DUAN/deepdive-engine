/**
 * AI Office 核心类型定义
 */

// ============================================================================
// 资源类型定义
// ============================================================================

export type ResourceType =
  | 'youtube_video'
  | 'academic_paper'
  | 'web_page'
  | 'database'
  | 'file';

export type ResourceStatus = 'pending' | 'collecting' | 'collected' | 'failed';

export interface ResourceRef {
  type: ResourceType;
  collection: string;
  id: string;
}

export interface BaseResource {
  _id: string;
  userId: string;
  resourceId: string;
  resourceType: ResourceType;
  status: ResourceStatus;
  collectedAt: Date;
  updatedAt: Date;
}

// YouTube资源
export interface YouTubeMetadata {
  title: string;
  description: string;
  channel: {
    id: string;
    name: string;
    subscribers: number;
  };
  duration: string;
  publishedAt: Date;
  statistics: {
    views: number;
    likes: number;
    comments: number;
  };
  thumbnails: {
    default: string;
    medium: string;
    high: string;
  };
  tags: string[];
  category: string;
  language: string;
}

export interface YouTubeContent {
  subtitles: {
    [lang: string]: Array<{
      start: number;
      end: number;
      text: string;
    }>;
  };
  transcription?: {
    fullText: string;
    segments: any[];
  };
  keyFrames: Array<{
    timestamp: number;
    url: string;
    description?: string;
  }>;
}

export interface AIAnalysis {
  summary: string;
  keyPoints: string[];
  topics: string[];
  entities: Array<{
    name: string;
    type: 'person' | 'organization' | 'technology' | 'concept';
  }>;
  sentiment: {
    overall: 'positive' | 'neutral' | 'negative';
    confidence: number;
  };
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  targetAudience: string[];
  prerequisites: string[];
  learningOutcomes: string[];
}

export interface YouTubeResource extends BaseResource {
  resourceType: 'youtube_video';
  url: string;
  metadata: YouTubeMetadata;
  content: YouTubeContent;
  aiAnalysis: AIAnalysis;
}

// Papers资源
export interface PaperMetadata {
  title: string;
  authors: Array<{
    name: string;
    affiliation: string;
    email?: string;
  }>;
  abstract: string;
  keywords: string[];
  publishedAt: Date;
  venue: string;
  doi?: string;
  arxivId?: string;
  citations: number;
  pdfUrl?: string;
}

export interface PaperContent {
  fullText: string;
  sections: Array<{
    title: string;
    content: string;
    level: number;
  }>;
  figures: any[];
  tables: any[];
  equations: any[];
  references: any[];
}

export interface PaperAIAnalysis {
  summary: string;
  contributions: string[];
  methodology: string;
  results: string;
  limitations: string[];
  futureWork: string[];
  impact: 'low' | 'medium' | 'high' | 'very high';
  field: string;
  subfields: string[];
}

export interface PaperResource extends BaseResource {
  resourceType: 'academic_paper';
  metadata: PaperMetadata;
  content: PaperContent;
  aiAnalysis: PaperAIAnalysis;
}

// Web资源
export interface WebMetadata {
  title: string;
  description?: string;
  author?: string;
  publishedAt?: Date;
  siteName?: string;
  language: string;
}

export interface WebContent {
  rawHtml?: string;
  cleanedText: string;
  structuredData?: any;
  images: Array<{
    src: string;
    alt: string;
  }>;
  links: string[];
}

export interface WebResource extends BaseResource {
  resourceType: 'web_page';
  url: string;
  metadata: WebMetadata;
  content: WebContent;
  aiAnalysis: {
    summary: string;
    mainTopics: string[];
    keyInsights: string[];
    credibility: number;
  };
}

export type Resource = YouTubeResource | PaperResource | WebResource;

// ============================================================================
// 文档类型定义
// ============================================================================

export type DocumentType = 'word' | 'excel' | 'ppt' | 'article';

export type DocumentStatus = 'draft' | 'generating' | 'completed' | 'failed';

export interface DocumentResource {
  resourceRef: ResourceRef;
}

export interface AIConfig {
  model: string;
  language: string;
  detailLevel: number; // 1-5
  professionalLevel: number; // 1-5
}

// Word文档内容
export interface WordSection {
  id: string;
  type: 'heading' | 'paragraph' | 'list' | 'table' | 'image';
  content: string;
  aiGenerated: boolean;
  sourceResources?: string[];
  level?: number;
  style?: any;
}

export interface WordContent {
  sections: WordSection[];
}

// Excel文档内容
export interface ExcelSheet {
  name: string;
  data: any[][];
  charts?: any[];
}

export interface ExcelContent {
  sheets: ExcelSheet[];
}

// PPT文档内容
export interface PPTSlide {
  id: string;
  layout: string;
  elements: any[];
  notes?: string;
}

export interface PPTContent {
  slides: PPTSlide[];
  theme?: string;
}

// 文档版本快照
export interface DocumentVersion {
  id: string;
  timestamp: Date;
  type: 'auto' | 'manual'; // 自动保存 vs 手动保存
  trigger: 'ai_generation' | 'user_edit' | 'manual_save'; // 触发方式
  content: any; // 快照内容（根据文档类型不同而不同）
  metadata: {
    title: string;
    wordCount?: number;
    slideCount?: number;
    description?: string; // 版本描述
  };
  aiModel?: string; // 如果是AI生成的，记录使用的模型
  userPrompt?: string; // 如果是AI生成的，记录用户提示词
}

export interface BaseDocument {
  _id: string;
  userId: string;
  type: DocumentType;
  title: string;
  status: DocumentStatus;
  resources: DocumentResource[];
  template?: {
    id: string;
    version: string;
  };
  aiConfig: AIConfig;
  generationHistory: Array<{
    timestamp: Date;
    action: 'create' | 'edit' | 'regenerate';
    aiModel: string;
    userPrompt?: string;
    cost?: number;
  }>;
  // 新增：版本历史
  versions: DocumentVersion[];
  currentVersionId?: string; // 当前激活的版本ID
  metadata: {
    wordCount?: number;
    pageCount?: number;
    slideCount?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface WordDocument extends BaseDocument {
  type: 'word';
  content: WordContent;
}

export interface ExcelDocument extends BaseDocument {
  type: 'excel';
  content: ExcelContent;
}

export interface PPTDocument extends BaseDocument {
  type: 'ppt';
  content: PPTContent;
}

// Article文档内容（简化的通用文档）
export interface ArticleContent {
  markdown: string;
  html?: string;
}

export interface ArticleDocument extends BaseDocument {
  type: 'article';
  content: ArticleContent;
}

export type Document =
  | WordDocument
  | ExcelDocument
  | PPTDocument
  | ArticleDocument;

// ============================================================================
// AI聊天类型定义
// ============================================================================

export type MessageRole = 'user' | 'assistant' | 'system';

export interface MentionedResource {
  resourceRef: ResourceRef;
  title: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  mentionedResources?: MentionedResource[];
  attachments?: Array<{
    type: 'image' | 'file';
    url: string;
  }>;
  metadata?: {
    model?: string;
    tokens?: number;
    cost?: number;
    latency?: number;
  };
  timestamp: Date;
}

export interface ChatSession {
  _id: string;
  userId: string;
  documentId: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// 模板类型定义
// ============================================================================

export interface TemplateSection {
  id: string;
  title: string;
  type: 'ai_generated' | 'data_table' | 'cover_page' | 'custom';
  aiPrompt?: string;
  variables?: string[];
  format?: any;
}

export interface Template {
  _id: string;
  userId?: string;
  type: DocumentType;
  name: string;
  description: string;
  category: string;
  tags: string[];
  compatibleResourceTypes: ResourceType[];
  structure: {
    sections?: TemplateSection[];
    sheets?: any[];
    slides?: any[];
  };
  styles: {
    theme?: string;
    colors?: any;
    fonts?: any;
  };
  usage: {
    count: number;
    rating: number;
    reviews: number;
  };
  isPublic: boolean;
  version: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// UI状态类型定义
// ============================================================================

export interface UIState {
  // 中间栏状态
  middlePanelWidth: number;
  resourceListCollapsed: boolean;

  // 当前选中
  selectedResourceIds: string[];
  currentDocumentId?: string;

  // 加载状态
  isLoading: boolean;
  loadingMessage?: string;

  // 错误状态
  error?: {
    message: string;
    code?: string;
  };
}

// ============================================================================
// API请求/响应类型定义
// ============================================================================

export interface AddResourceRequest {
  type: ResourceType;
  url: string;
  collectionId?: string;
  options?: {
    autoAnalyze: boolean;
    extractSubtitles: boolean;
  };
}

export interface AddResourceResponse {
  resourceId: string;
  status: ResourceStatus;
  estimatedTime: number;
}

export interface CreateDocumentRequest {
  type: DocumentType;
  title: string;
  resourceIds: string[];
  templateId?: string;
  aiConfig: AIConfig;
}

export interface CreateDocumentResponse {
  documentId: string;
  status: DocumentStatus;
}

export interface ChatRequest {
  documentId: string;
  message: string;
  mentionedResources?: MentionedResource[];
  context?: {
    currentSection?: string;
    selectedText?: string;
  };
}

export interface ChatStreamEvent {
  event: 'token' | 'complete' | 'error';
  data: any;
}
