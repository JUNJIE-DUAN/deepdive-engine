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
import { io, Socket } from 'socket.io-client';

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
  currentUserId: string | null;
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
  currentUserId: null,
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
    // WebSocket已实现message:new事件，会自动添加消息到state，不需要手动更新
    // 注释掉手动更新以避免重复消息
    return message;
  },

  deleteMessage: async (topicId, messageId) => {
    await api.deleteMessage(topicId, messageId);
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== messageId),
    }));
  },

  addReaction: async (topicId, messageId, emoji) => {
    await api.addReaction(topicId, messageId, emoji);
    // WebSocket已实现reaction:add事件，会自动更新state，不需要手动更新
  },

  removeReaction: async (topicId, messageId, emoji) => {
    await api.removeReaction(topicId, messageId, emoji);
    // WebSocket已实现reaction:remove事件，会自动更新state，不需要手动更新
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
    } catch (error) {
      // Log the error but don't re-throw to prevent UI disruption
      console.error('Failed to generate AI response:', error);
      // Return a placeholder message indicating the error
      throw error; // Re-throw for the caller to handle
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

  connectSocket: (userId) => {
    const { socket } = get();
    if (socket?.connected) return;

    // Store current user ID
    set({ currentUserId: userId });

    const tokens = getAuthTokens();
    const newSocket = io(`${API_URL}/ai-group`, {
      auth: { userId, token: tokens?.accessToken },
      query: { userId },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('[WS] Connected, socket id:', newSocket.id);
      set({ isConnected: true });
    });

    newSocket.on('disconnect', (reason) => {
      console.log(
        '[WS] Disconnected, reason:',
        reason,
        'socket id:',
        newSocket.id
      );
      set({ isConnected: false });
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    // 新消息
    newSocket.on('message:new', (message: TopicMessage) => {
      console.log('[WS] Received message:new event:', {
        messageId: message.id,
        topicId: message.topicId,
        senderId: message.senderId,
        aiMemberId: message.aiMemberId,
        content: message.content?.substring(0, 50),
        socketId: newSocket.id,
      });
      set((state) => {
        // 防止重复添加消息
        if (state.messages.some((m) => m.id === message.id)) {
          console.log('[WS] Message already exists, skipping:', message.id);
          return state;
        }
        console.log('[WS] Adding new message to state:', message.id);
        return {
          messages: [...state.messages, message],
        };
      });
    });

    // 消息删除
    newSocket.on('message:delete', ({ messageId }: { messageId: string }) => {
      set((state) => ({
        messages: state.messages.filter((m) => m.id !== messageId),
      }));
    });

    // 成员上线
    newSocket.on(
      'member:online',
      ({ userId: onlineUserId }: { userId: string }) => {
        set((state) => {
          const newSet = new Set(state.onlineUsers);
          newSet.add(onlineUserId);
          return { onlineUsers: newSet };
        });
      }
    );

    // 成员下线
    newSocket.on(
      'member:offline',
      ({ userId: offlineUserId }: { userId: string }) => {
        set((state) => {
          const newSet = new Set(state.onlineUsers);
          newSet.delete(offlineUserId);
          return { onlineUsers: newSet };
        });
      }
    );

    // 成员正在输入
    newSocket.on(
      'member:typing',
      ({ userId: typingUserId }: { userId: string }) => {
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
      }
    );

    // AI正在输入
    newSocket.on('ai:typing', ({ aiMemberId }: { aiMemberId: string }) => {
      set((state) => {
        const newSet = new Set(state.typingAIs);
        newSet.add(aiMemberId);
        return { typingAIs: newSet };
      });
    });

    // AI响应完成（只清除typing状态，消息通过message:new事件添加）
    newSocket.on(
      'ai:response',
      ({ aiMemberId }: { aiMemberId: string; messageId: string }) => {
        set((state) => {
          const newSet = new Set(state.typingAIs);
          newSet.delete(aiMemberId);
          return { typingAIs: newSet };
        });
      }
    );

    // AI错误
    newSocket.on(
      'ai:error',
      ({ aiMemberId, error }: { aiMemberId: string; error: string }) => {
        console.error(`AI ${aiMemberId} error:`, error);
        set((state) => {
          const newSet = new Set(state.typingAIs);
          newSet.delete(aiMemberId);
          return { typingAIs: newSet };
        });
      }
    );

    // 反应添加
    newSocket.on(
      'reaction:add',
      ({
        messageId,
        userId: reactionUserId,
        emoji,
      }: {
        messageId: string;
        userId: string;
        emoji: string;
      }) => {
        set((state) => ({
          messages: state.messages.map((m) => {
            if (m.id === messageId) {
              const existingReaction = m.reactions.find(
                (r) => r.userId === reactionUserId && r.emoji === emoji
              );
              if (!existingReaction) {
                return {
                  ...m,
                  reactions: [
                    ...m.reactions,
                    {
                      id: '',
                      messageId,
                      userId: reactionUserId,
                      emoji,
                      createdAt: new Date().toISOString(),
                    },
                  ],
                };
              }
            }
            return m;
          }),
        }));
      }
    );

    // 反应移除
    newSocket.on(
      'reaction:remove',
      ({
        messageId,
        userId: removeUserId,
        emoji,
      }: {
        messageId: string;
        userId: string;
        emoji: string;
      }) => {
        set((state) => ({
          messages: state.messages.map((m) => {
            if (m.id === messageId) {
              return {
                ...m,
                reactions: m.reactions.filter(
                  (r) => !(r.userId === removeUserId && r.emoji === emoji)
                ),
              };
            }
            return m;
          }),
        }));
      }
    );

    set({ socket: newSocket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({
        socket: null,
        isConnected: false,
        currentUserId: null,
        onlineUsers: new Set(),
      });
    }
  },

  joinTopicRoom: (topicId) => {
    const { socket } = get();
    console.log(
      `[WS] joinTopicRoom called for topic ${topicId}, socket connected: ${socket?.connected}, socket id: ${socket?.id}`
    );
    if (socket?.connected) {
      socket.emit(
        'topic:join',
        { topicId },
        (response: {
          success?: boolean;
          onlineUsers?: string[];
          error?: string;
        }) => {
          console.log(`[WS] topic:join response for ${topicId}:`, response);
          if (response.success && response.onlineUsers) {
            // 设置在线用户列表，并确保当前用户包含在内
            const { currentUserId } = get();
            const onlineSet = new Set(response.onlineUsers);
            if (currentUserId) {
              onlineSet.add(currentUserId);
            }
            set({ onlineUsers: onlineSet });
            console.log(
              '[WS] Joined topic room, online users:',
              Array.from(onlineSet)
            );
          } else if (response.error) {
            console.error('[WS] Failed to join topic room:', response.error);
          }
        }
      );
    } else {
      // 如果 socket 还没连接，等待连接后再加入
      console.log('[WS] Socket not connected, waiting...');
      const checkAndJoin = () => {
        const { socket: currentSocket } = get();
        console.log(
          `[WS] Retry join: socket connected: ${currentSocket?.connected}, socket id: ${currentSocket?.id}`
        );
        if (currentSocket?.connected) {
          currentSocket.emit(
            'topic:join',
            { topicId },
            (response: {
              success?: boolean;
              onlineUsers?: string[];
              error?: string;
            }) => {
              console.log(
                `[WS] topic:join response (delayed) for ${topicId}:`,
                response
              );
              if (response.success && response.onlineUsers) {
                const { currentUserId } = get();
                const onlineSet = new Set(response.onlineUsers);
                if (currentUserId) {
                  onlineSet.add(currentUserId);
                }
                set({ onlineUsers: onlineSet });
                console.log(
                  '[WS] Joined topic room (delayed), online users:',
                  Array.from(onlineSet)
                );
              }
            }
          );
        } else {
          setTimeout(checkAndJoin, 500);
        }
      };
      setTimeout(checkAndJoin, 500);
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
