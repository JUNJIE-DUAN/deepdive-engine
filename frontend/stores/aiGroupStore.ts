import { create } from 'zustand';
import {
  Topic,
  TopicMessage,
  TopicResource,
  SendMessageDto,
  CreateTopicDto,
  UpdateTopicDto,
  AddAIMemberDto,
  UpdateAIMemberDto,
  AddResourceDto,
} from '@/types/ai-group';
import * as api from '@/lib/api/ai-group';
import { getAuthTokens } from '@/lib/auth';

// TODO: Enable WebSocket after installing socket.io-client
// npm install socket.io-client
// import { io, Socket } from 'socket.io-client';
type Socket = any;

interface AiGroupState {
  // Topics
  topics: Topic[];
  currentTopic: Topic | null;
  isLoadingTopics: boolean;

  // Messages
  messages: TopicMessage[];
  isLoadingMessages: boolean;
  hasMoreMessages: boolean;
  nextCursor: string | null;

  // Resources
  resources: TopicResource[];
  isLoadingResources: boolean;

  // WebSocket
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: Set<string>;
  typingUsers: Set<string>;
  typingAIs: Set<string>;

  // Actions - Topics
  fetchTopics: (options?: { type?: string; search?: string }) => Promise<void>;
  fetchTopic: (topicId: string) => Promise<void>;
  createTopic: (dto: CreateTopicDto) => Promise<Topic>;
  updateTopic: (topicId: string, dto: UpdateTopicDto) => Promise<void>;
  deleteTopic: (topicId: string) => Promise<void>;
  setCurrentTopic: (topic: Topic | null) => void;

  // Actions - Messages
  fetchMessages: (topicId: string, cursor?: string) => Promise<void>;
  sendMessage: (topicId: string, dto: SendMessageDto) => Promise<TopicMessage>;
  deleteMessage: (topicId: string, messageId: string) => Promise<void>;
  addReaction: (
    topicId: string,
    messageId: string,
    emoji: string
  ) => Promise<void>;
  removeReaction: (
    topicId: string,
    messageId: string,
    emoji: string
  ) => Promise<void>;

  // Actions - Members
  addMember: (topicId: string, userId: string, role?: string) => Promise<void>;
  removeMember: (topicId: string, memberId: string) => Promise<void>;
  leaveTopicAsMember: (topicId: string) => Promise<void>;

  // Actions - AI Members
  addAIMember: (topicId: string, dto: AddAIMemberDto) => Promise<void>;
  updateAIMember: (
    topicId: string,
    aiMemberId: string,
    dto: UpdateAIMemberDto
  ) => Promise<void>;
  removeAIMember: (topicId: string, aiMemberId: string) => Promise<void>;
  generateAIResponse: (
    topicId: string,
    aiMemberId: string
  ) => Promise<TopicMessage>;

  // Actions - Resources
  fetchResources: (topicId: string) => Promise<void>;
  addResource: (topicId: string, dto: AddResourceDto) => Promise<void>;
  removeResource: (topicId: string, resourceId: string) => Promise<void>;

  // Actions - WebSocket
  connectSocket: (userId: string) => void;
  disconnectSocket: () => void;
  joinTopicRoom: (topicId: string) => void;
  leaveTopicRoom: (topicId: string) => void;
  sendTyping: (topicId: string) => void;

  // Actions - UI
  clearMessages: () => void;
  resetStore: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const useAiGroupStore = create<AiGroupState>((set, get) => ({
  // Initial state
  topics: [],
  currentTopic: null,
  isLoadingTopics: false,
  messages: [],
  isLoadingMessages: false,
  hasMoreMessages: false,
  nextCursor: null,
  resources: [],
  isLoadingResources: false,
  socket: null,
  isConnected: false,
  onlineUsers: new Set(),
  typingUsers: new Set(),
  typingAIs: new Set(),

  // ==================== Topics ====================

  fetchTopics: async (options) => {
    set({ isLoadingTopics: true });
    try {
      const topics = await api.getTopics(options as any);
      set({ topics, isLoadingTopics: false });
    } catch (error) {
      console.error('Failed to fetch topics:', error);
      set({ isLoadingTopics: false });
    }
  },

  fetchTopic: async (topicId) => {
    try {
      const topic = await api.getTopicById(topicId);
      set({ currentTopic: topic });
      // 更新topics列表中的对应项
      set((state) => ({
        topics: state.topics.map((t) => (t.id === topicId ? topic : t)),
      }));
    } catch (error) {
      console.error('Failed to fetch topic:', error);
    }
  },

  createTopic: async (dto) => {
    const topic = await api.createTopic(dto);
    set((state) => ({ topics: [topic, ...state.topics] }));
    return topic;
  },

  updateTopic: async (topicId, dto) => {
    const topic = await api.updateTopic(topicId, dto);
    set((state) => ({
      topics: state.topics.map((t) =>
        t.id === topicId ? { ...t, ...topic } : t
      ),
      currentTopic:
        state.currentTopic?.id === topicId
          ? { ...state.currentTopic, ...topic }
          : state.currentTopic,
    }));
  },

  deleteTopic: async (topicId) => {
    await api.deleteTopic(topicId);
    set((state) => ({
      topics: state.topics.filter((t) => t.id !== topicId),
      currentTopic:
        state.currentTopic?.id === topicId ? null : state.currentTopic,
    }));
  },

  setCurrentTopic: (topic) => {
    set({ currentTopic: topic });
  },

  // ==================== Messages ====================

  fetchMessages: async (topicId, cursor) => {
    set({ isLoadingMessages: true });
    try {
      const response = await api.getMessages(topicId, { cursor, limit: 50 });
      set((state) => ({
        messages: cursor
          ? [...response.messages, ...state.messages]
          : response.messages,
        hasMoreMessages: response.hasMore,
        nextCursor: response.nextCursor,
        isLoadingMessages: false,
      }));
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      set({ isLoadingMessages: false });
    }
  },

  sendMessage: async (topicId, dto) => {
    const message = await api.sendMessage(topicId, dto);
    // WebSocket未实现，需要手动更新state
    set((state) => ({
      messages: [...state.messages, message],
    }));
    return message;
  },

  deleteMessage: async (topicId, messageId) => {
    await api.deleteMessage(topicId, messageId);
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== messageId),
    }));
  },

  addReaction: async (topicId, messageId, emoji) => {
    const reaction = await api.addReaction(topicId, messageId, emoji);
    // WebSocket未实现，手动更新state
    const { messages } = get();
    set({
      messages: messages.map((m) =>
        m.id === messageId
          ? {
              ...m,
              reactions: [...m.reactions, reaction],
            }
          : m
      ),
    });
  },

  removeReaction: async (topicId, messageId, emoji) => {
    await api.removeReaction(topicId, messageId, emoji);
    // WebSocket未实现，手动更新state
    const { messages } = get();
    set({
      messages: messages.map((m) =>
        m.id === messageId
          ? {
              ...m,
              reactions: m.reactions.filter((r) => r.emoji !== emoji),
            }
          : m
      ),
    });
  },

  // ==================== Members ====================

  addMember: async (topicId, userId, role) => {
    await api.addMember(topicId, { userId, role: role as any });
    await get().fetchTopic(topicId);
  },

  removeMember: async (topicId, memberId) => {
    await api.removeMember(topicId, memberId);
    await get().fetchTopic(topicId);
  },

  leaveTopicAsMember: async (topicId) => {
    await api.leaveTopic(topicId);
    set((state) => ({
      topics: state.topics.filter((t) => t.id !== topicId),
      currentTopic:
        state.currentTopic?.id === topicId ? null : state.currentTopic,
    }));
  },

  // ==================== AI Members ====================

  addAIMember: async (topicId, dto) => {
    await api.addAIMember(topicId, dto);
    await get().fetchTopic(topicId);
  },

  updateAIMember: async (topicId, aiMemberId, dto) => {
    await api.updateAIMember(topicId, aiMemberId, dto);
    await get().fetchTopic(topicId);
  },

  removeAIMember: async (topicId, aiMemberId) => {
    await api.removeAIMember(topicId, aiMemberId);
    await get().fetchTopic(topicId);
  },

  generateAIResponse: async (topicId, aiMemberId) => {
    // Set AI as typing
    set((state) => {
      const newSet = new Set(state.typingAIs);
      newSet.add(aiMemberId);
      return { typingAIs: newSet };
    });

    try {
      const message = await api.generateAIResponse(topicId, aiMemberId);
      // WebSocket未实现，需要手动更新state
      set((state) => ({
        messages: [...state.messages, message],
      }));
      return message;
    } finally {
      // Remove AI from typing
      set((state) => {
        const newSet = new Set(state.typingAIs);
        newSet.delete(aiMemberId);
        return { typingAIs: newSet };
      });
    }
  },

  // ==================== Resources ====================

  fetchResources: async (topicId) => {
    set({ isLoadingResources: true });
    try {
      const resources = await api.getResources(topicId);
      set({ resources, isLoadingResources: false });
    } catch (error) {
      console.error('Failed to fetch resources:', error);
      set({ isLoadingResources: false });
    }
  },

  addResource: async (topicId, dto) => {
    const resource = await api.addResource(topicId, dto);
    set((state) => ({ resources: [resource, ...state.resources] }));
  },

  removeResource: async (topicId, resourceId) => {
    await api.removeResource(topicId, resourceId);
    set((state) => ({
      resources: state.resources.filter((r) => r.id !== resourceId),
    }));
  },

  // ==================== WebSocket ====================

  connectSocket: (_userId) => {
    // TODO: WebSocket functionality disabled until socket.io-client is installed
    // To enable real-time features, run:
    // npm install socket.io-client
    // Then uncomment the socket.io-client import and the code below
    console.warn('WebSocket disabled: socket.io-client not installed');

    /*
    const { socket } = get();
    if (socket?.connected) return;

    const tokens = getAuthTokens();
    const newSocket = io(`${API_URL}/ai-group`, {
      auth: { userId: _userId, token: tokens?.accessToken },
      query: { userId: _userId },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      set({ isConnected: true });
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      set({ isConnected: false });
    });

    // 新消息
    newSocket.on('message:new', (message: TopicMessage) => {
      set((state) => ({
        messages: [...state.messages, message],
      }));
    });

    // 消息删除
    newSocket.on('message:delete', ({ messageId }: { messageId: string }) => {
      set((state) => ({
        messages: state.messages.filter((m) => m.id !== messageId),
      }));
    });

    // 成员上线
    newSocket.on('member:online', ({ onlineUserId }: { onlineUserId: string }) => {
      set((state) => {
        const newSet = new Set(state.onlineUsers);
        newSet.add(onlineUserId);
        return { onlineUsers: newSet };
      });
    });

    // 成员下线
    newSocket.on('member:offline', ({ offlineUserId }: { offlineUserId: string }) => {
      set((state) => {
        const newSet = new Set(state.onlineUsers);
        newSet.delete(offlineUserId);
        return { onlineUsers: newSet };
      });
    });

    // 成员正在输入
    newSocket.on('member:typing', ({ typingUserId }: { typingUserId: string }) => {
      set((state) => {
        const newSet = new Set(state.typingUsers);
        newSet.add(typingUserId);
        return { typingUsers: newSet };
      });
      // 3秒后自动移除
      setTimeout(() => {
        set((state) => {
          const newSet = new Set(state.typingUsers);
          newSet.delete(typingUserId);
          return { typingUsers: newSet };
        });
      }, 3000);
    });

    // AI正在输入
    newSocket.on('ai:typing', ({ aiMemberId }: { aiMemberId: string }) => {
      set((state) => {
        const newSet = new Set(state.typingAIs);
        newSet.add(aiMemberId);
        return { typingAIs: newSet };
      });
    });

    // AI响应完成
    newSocket.on('ai:response', (message: TopicMessage) => {
      set((state) => {
        const newSet = new Set(state.typingAIs);
        if (message.aiMemberId) {
          newSet.delete(message.aiMemberId);
        }
        return {
          typingAIs: newSet,
          messages: [...state.messages, message],
        };
      });
    });

    // 反应添加
    newSocket.on('reaction:add', ({ messageId, reactionUserId, emoji }: { messageId: string; reactionUserId: string; emoji: string }) => {
      set((state) => ({
        messages: state.messages.map((m) => {
          if (m.id === messageId) {
            const existingReaction = m.reactions.find((r) => r.userId === reactionUserId && r.emoji === emoji);
            if (!existingReaction) {
              return {
                ...m,
                reactions: [...m.reactions, { id: '', messageId, userId: reactionUserId, emoji, createdAt: new Date().toISOString() }],
              };
            }
          }
          return m;
        }),
      }));
    });

    // 反应移除
    newSocket.on('reaction:remove', ({ messageId, removeUserId, emoji }: { messageId: string; removeUserId: string; emoji: string }) => {
      set((state) => ({
        messages: state.messages.map((m) => {
          if (m.id === messageId) {
            return {
              ...m,
              reactions: m.reactions.filter((r) => !(r.userId === removeUserId && r.emoji === emoji)),
            };
          }
          return m;
        }),
      }));
    });

    set({ socket: newSocket });
    */
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },

  joinTopicRoom: (topicId) => {
    const { socket } = get();
    if (socket?.connected) {
      socket.emit('topic:join', { topicId });
    }
  },

  leaveTopicRoom: (topicId) => {
    const { socket } = get();
    if (socket?.connected) {
      socket.emit('topic:leave', { topicId });
    }
  },

  sendTyping: (topicId) => {
    const { socket } = get();
    if (socket?.connected) {
      socket.emit('message:typing', { topicId });
    }
  },

  // ==================== UI ====================

  clearMessages: () => {
    set({ messages: [], hasMoreMessages: false, nextCursor: null });
  },

  resetStore: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
    }
    set({
      topics: [],
      currentTopic: null,
      isLoadingTopics: false,
      messages: [],
      isLoadingMessages: false,
      hasMoreMessages: false,
      nextCursor: null,
      resources: [],
      isLoadingResources: false,
      socket: null,
      isConnected: false,
      onlineUsers: new Set(),
      typingUsers: new Set(),
      typingAIs: new Set(),
    });
  },
}));
