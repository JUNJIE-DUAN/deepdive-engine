// ==================== Enums ====================

export enum TopicType {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  ARCHIVED = 'ARCHIVED',
}

export enum TopicRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  GUEST = 'GUEST',
}

export enum MessageContentType {
  TEXT = 'TEXT',
  RICH_TEXT = 'RICH_TEXT',
  CODE = 'CODE',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
  SYSTEM = 'SYSTEM',
}

export enum MentionType {
  USER = 'USER',
  AI = 'AI',
  ALL = 'ALL',
  ALL_AI = 'ALL_AI',
}

export enum AttachmentType {
  FILE = 'FILE',
  IMAGE = 'IMAGE',
  LINK = 'LINK',
  RESOURCE = 'RESOURCE',
}

// AI Capability types - matches backend Prisma enum
export enum AICapability {
  TEXT_GENERATION = 'TEXT_GENERATION',
  CODE_GENERATION = 'CODE_GENERATION',
  CODE_REVIEW = 'CODE_REVIEW',
  IMAGE_GENERATION = 'IMAGE_GENERATION',
  IMAGE_ANALYSIS = 'IMAGE_ANALYSIS',
  WEB_SEARCH = 'WEB_SEARCH',
  URL_FETCH = 'URL_FETCH',
  DOCUMENT_ANALYSIS = 'DOCUMENT_ANALYSIS',
  REASONING = 'REASONING',
  MATH = 'MATH',
  TRANSLATION = 'TRANSLATION',
  SUMMARIZATION = 'SUMMARIZATION',
}

export enum TopicResourceType {
  LINK = 'LINK',
  FILE = 'FILE',
  LIBRARY_RESOURCE = 'LIBRARY_RESOURCE',
}

// ==================== User Types ====================

export interface TopicUser {
  id: string;
  username: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  email?: string;
}

// ==================== Topic Types ====================

export interface Topic {
  id: string;
  name: string;
  description: string | null;
  type: TopicType;
  avatar: string | null;
  createdById: string;
  createdBy: TopicUser;
  settings: Record<string, any> | null;
  metadata: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  members: TopicMember[];
  aiMembers: TopicAIMember[];
  memberCount: number;
  aiMemberCount: number;
  unreadCount?: number;
  currentUserRole?: TopicRole;
  _count?: {
    messages: number;
    resources: number;
  };
}

export interface TopicMember {
  id: string;
  topicId: string;
  userId: string;
  user: TopicUser;
  role: TopicRole;
  nickname: string | null;
  joinedAt: string;
  lastReadAt: string | null;
}

export interface TopicAIMember {
  id: string;
  topicId: string;
  aiModel: string;
  displayName: string;
  avatar: string | null;
  roleDescription: string | null;
  systemPrompt: string | null;
  contextWindow: number;
  responseStyle: string | null;
  autoRespond: boolean;
  // New capability fields
  capabilities?: AICapability[];
  canMentionOtherAI?: boolean;
  collaborationStyle?: string | null;
  addedById: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== Message Types ====================

export interface TopicMessage {
  id: string;
  topicId: string;
  senderId: string | null;
  sender: TopicUser | null;
  aiMemberId: string | null;
  aiMember: Pick<
    TopicAIMember,
    'id' | 'aiModel' | 'displayName' | 'avatar' | 'roleDescription'
  > | null;
  content: string;
  contentType: MessageContentType;
  prompt: string | null;
  modelUsed: string | null;
  tokensUsed: number | null;
  replyToId: string | null;
  replyTo: {
    id: string;
    content: string;
    sender: Pick<TopicUser, 'id' | 'username' | 'fullName'> | null;
    aiMember: Pick<TopicAIMember, 'id' | 'displayName'> | null;
  } | null;
  mentions: TopicMessageMention[];
  attachments: TopicMessageAttachment[];
  reactions: TopicMessageReaction[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  _count?: {
    replies: number;
  };
}

export interface TopicMessageMention {
  id: string;
  messageId: string;
  userId: string | null;
  user: Pick<TopicUser, 'id' | 'username' | 'fullName'> | null;
  aiMemberId: string | null;
  aiMember: Pick<TopicAIMember, 'id' | 'displayName'> | null;
  mentionType: MentionType;
}

export interface TopicMessageAttachment {
  id: string;
  messageId: string;
  type: AttachmentType;
  name: string;
  url: string;
  size: number | null;
  mimeType: string | null;
  resourceId: string | null;
  linkPreview: {
    title?: string;
    description?: string;
    image?: string;
    favicon?: string;
  } | null;
  createdAt: string;
}

export interface TopicMessageReaction {
  id: string;
  messageId: string;
  userId: string;
  user?: Pick<TopicUser, 'id' | 'username'>;
  emoji: string;
  createdAt: string;
}

// ==================== Resource Types ====================

export interface TopicResource {
  id: string;
  topicId: string;
  type: TopicResourceType;
  name: string;
  url: string | null;
  resourceId: string | null;
  resource?: {
    id: string;
    title: string;
    type: string;
    sourceUrl: string;
  };
  fileUrl: string | null;
  fileSize: number | null;
  mimeType: string | null;
  sourceMessageId: string | null;
  addedById: string;
  addedBy: Pick<TopicUser, 'id' | 'username' | 'fullName'>;
  createdAt: string;
}

// ==================== Summary Types ====================

export interface TopicSummary {
  id: string;
  topicId: string;
  title: string;
  content: string;
  fromMessageId: string | null;
  toMessageId: string | null;
  generatedBy: string;
  prompt: string | null;
  createdById: string;
  createdBy: Pick<TopicUser, 'id' | 'username' | 'fullName'>;
  createdAt: string;
}

// ==================== DTO Types ====================

export interface CreateTopicDto {
  name: string;
  description?: string;
  type?: TopicType;
  avatar?: string;
  memberIds?: string[];
  aiMembers?: {
    aiModel: string;
    displayName: string;
    roleDescription?: string;
    systemPrompt?: string;
  }[];
  metadata?: {
    tags?: string[];
    [key: string]: any;
  };
}

export interface UpdateTopicDto {
  name?: string;
  description?: string;
  type?: TopicType;
  avatar?: string;
  settings?: Record<string, any>;
  metadata?: {
    tags?: string[];
    [key: string]: any;
  };
}

export interface AddMemberDto {
  userId: string;
  role?: TopicRole;
  nickname?: string;
}

export interface AddAIMemberDto {
  aiModel: string;
  displayName: string;
  avatar?: string;
  roleDescription?: string;
  systemPrompt?: string;
  contextWindow?: number;
  responseStyle?: string;
  autoRespond?: boolean;
}

export interface UpdateAIMemberDto {
  displayName?: string;
  avatar?: string;
  roleDescription?: string;
  systemPrompt?: string;
  contextWindow?: number;
  responseStyle?: string;
  autoRespond?: boolean;
}

export interface SendMessageDto {
  content: string;
  contentType?: MessageContentType;
  replyToId?: string;
  mentions?: {
    userId?: string;
    aiMemberId?: string;
    mentionType: MentionType;
  }[];
  attachments?: {
    type: AttachmentType;
    name: string;
    url: string;
    size?: number;
    mimeType?: string;
    resourceId?: string;
    linkPreview?: {
      title?: string;
      description?: string;
      image?: string;
      favicon?: string;
    };
  }[];
}

export interface AddResourceDto {
  type: TopicResourceType;
  name: string;
  url?: string;
  resourceId?: string;
  fileUrl?: string;
  fileSize?: number;
  mimeType?: string;
  sourceMessageId?: string;
}

export interface GenerateSummaryDto {
  title?: string;
  fromMessageId?: string;
  toMessageId?: string;
  aiModel?: string;
}

// ==================== API Response Types ====================

export interface MessagesResponse {
  messages: TopicMessage[];
  hasMore: boolean;
  nextCursor: string | null;
}

// ==================== WebSocket Event Types ====================

export interface WSMessageNewEvent {
  message: TopicMessage;
}

export interface WSMemberOnlineEvent {
  userId: string;
}

export interface WSMemberTypingEvent {
  userId: string;
}

export interface WSAITypingEvent {
  topicId: string;
  aiMemberId: string;
}

export interface WSReactionEvent {
  messageId: string;
  userId: string;
  emoji: string;
}

// ==================== AI Models ====================

export const AI_MODELS = [
  {
    id: 'grok',
    name: 'Grok (xAI)',
    icon: '🤖',
    iconUrl: '/icons/ai/grok.svg',
    description: 'xAI Grok - 快速智能',
  },
  {
    id: 'gpt-4',
    name: 'ChatGPT (OpenAI)',
    icon: '🧠',
    iconUrl: '/icons/ai/openai.svg',
    description: 'OpenAI ChatGPT - 深度思考',
  },
  {
    id: 'claude',
    name: 'Claude (Anthropic)',
    icon: '🎭',
    iconUrl: '/icons/ai/claude.svg',
    description: 'Anthropic Claude - 对话专家',
  },
  {
    id: 'gemini',
    name: 'Gemini (Google)',
    icon: '💎',
    iconUrl: '/icons/ai/gemini.svg',
    description: 'Google Gemini - 多模态',
  },
  {
    id: 'gemini-image',
    name: 'Gemini Image (Google)',
    icon: '🎨',
    iconUrl: '/icons/ai/gemini.svg',
    description: 'Google Gemini - 图片生成',
  },
] as const;

export type AIModelId = (typeof AI_MODELS)[number]['id'];
