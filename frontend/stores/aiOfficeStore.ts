/**
 * AI Office Zustand Store
 * 管理AI Office的全局状态
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Resource,
  Document,
  ChatMessage,
  UIState,
  ResourceType,
  DocumentType,
} from '@/types/ai-office';

// ============================================================================
// Resource Store (持久化 + 去重)
// ============================================================================

interface ResourceState {
  resources: Resource[];
  selectedResourceIds: string[];
  isLoading: boolean;
  error: string | null;

  // Actions
  addResource: (resource: Resource) => void;
  removeResource: (id: string) => void;
  updateResource: (id: string, updates: Partial<Resource>) => void;
  selectResource: (id: string) => void;
  deselectResource: (id: string) => void;
  clearSelection: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useResourceStore = create<ResourceState>()(
  persist(
    (set) => ({
      resources: [],
      selectedResourceIds: [],
      isLoading: false,
      error: null,

      addResource: (resource) =>
        set((state) => {
          // 去重：检查资源是否已存在
          const exists = state.resources.some((r) => r._id === resource._id);
          if (exists) {
            console.warn(`Resource ${resource._id} already exists, skipping`);
            return state;
          }
          return {
            resources: [...state.resources, resource],
          };
        }),

      removeResource: (id) =>
        set((state) => ({
          resources: state.resources.filter((r) => r._id !== id),
          selectedResourceIds: state.selectedResourceIds.filter(
            (rid) => rid !== id
          ),
        })),

      updateResource: (id, updates) =>
        set((state) => ({
          resources: state.resources.map((r) =>
            r._id === id ? ({ ...r, ...updates } as Resource) : r
          ),
        })),

      selectResource: (id) =>
        set((state) => ({
          selectedResourceIds: state.selectedResourceIds.includes(id)
            ? state.selectedResourceIds
            : [...state.selectedResourceIds, id],
        })),

      deselectResource: (id) =>
        set((state) => ({
          selectedResourceIds: state.selectedResourceIds.filter(
            (rid) => rid !== id
          ),
        })),

      clearSelection: () =>
        set({
          selectedResourceIds: [],
        }),

      setLoading: (loading) =>
        set({
          isLoading: loading,
        }),

      setError: (error) =>
        set({
          error,
        }),
    }),
    {
      name: 'ai-office-resource-storage',
      partialize: (state) => ({
        resources: state.resources,
        selectedResourceIds: state.selectedResourceIds,
      }),
    }
  )
);

// ============================================================================
// Document Store
// ============================================================================

export interface GenerationStep {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  message?: string;
}

interface DocumentState {
  documents: Document[];
  currentDocumentId: string | null;
  isGenerating: boolean;
  generationProgress: number;
  generationSteps: GenerationStep[];
  currentStep: string;
  resourcesFound: number;
  estimatedTime: number | null;
  error: string | null;

  // Actions
  addDocument: (document: Document) => void;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  deleteDocument: (id: string) => void;
  setCurrentDocument: (id: string | null) => void;
  setGenerating: (generating: boolean) => void;
  setGenerationProgress: (progress: number) => void;
  setGenerationSteps: (steps: GenerationStep[]) => void;
  updateGenerationStep: (
    stepId: string,
    updates: Partial<GenerationStep>
  ) => void;
  setCurrentStep: (stepId: string) => void;
  setResourcesFound: (count: number) => void;
  setEstimatedTime: (seconds: number | null) => void;
  setError: (error: string | null) => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  documents: [],
  currentDocumentId: null,
  isGenerating: false,
  generationProgress: 0,
  generationSteps: [],
  currentStep: '',
  resourcesFound: 0,
  estimatedTime: null,
  error: null,

  addDocument: (document) =>
    set((state) => ({
      documents: [...state.documents, document],
    })),

  updateDocument: (id, updates) =>
    set((state) => ({
      documents: state.documents.map((d) =>
        d._id === id ? ({ ...d, ...updates } as Document) : d
      ),
    })),

  deleteDocument: (id) =>
    set((state) => ({
      documents: state.documents.filter((d) => d._id !== id),
      currentDocumentId:
        state.currentDocumentId === id ? null : state.currentDocumentId,
    })),

  setCurrentDocument: (id) =>
    set({
      currentDocumentId: id,
    }),

  setGenerating: (generating) =>
    set({
      isGenerating: generating,
      // 重置进度状态
      ...(generating === false && {
        generationSteps: [],
        currentStep: '',
        resourcesFound: 0,
        estimatedTime: null,
      }),
    }),

  setGenerationProgress: (progress) =>
    set({
      generationProgress: progress,
    }),

  setGenerationSteps: (steps) =>
    set({
      generationSteps: steps,
    }),

  updateGenerationStep: (stepId, updates) =>
    set((state) => ({
      generationSteps: state.generationSteps.map((step) =>
        step.id === stepId ? { ...step, ...updates } : step
      ),
    })),

  setCurrentStep: (stepId) =>
    set({
      currentStep: stepId,
    }),

  setResourcesFound: (count) =>
    set({
      resourcesFound: count,
    }),

  setEstimatedTime: (seconds) =>
    set({
      estimatedTime: seconds,
    }),

  setError: (error) =>
    set({
      error,
    }),
}));

// ============================================================================
// Chat Store
// ============================================================================

interface ChatState {
  sessions: Record<string, ChatMessage[]>; // documentId -> messages
  isStreaming: boolean;
  streamingMessage: string;
  shouldStopGeneration: boolean;
  error: string | null;

  // Actions
  addMessage: (documentId: string, message: ChatMessage) => void;
  updateMessage: (
    documentId: string,
    messageId: string,
    updates: Partial<ChatMessage>
  ) => void;
  updateStreamingMessage: (content: string) => void;
  setStreaming: (streaming: boolean) => void;
  stopGeneration: () => void;
  clearSession: (documentId: string) => void;
  setError: (error: string | null) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  sessions: {},
  isStreaming: false,
  streamingMessage: '',
  shouldStopGeneration: false,
  error: null,

  addMessage: (documentId, message) =>
    set((state) => ({
      sessions: {
        ...state.sessions,
        [documentId]: [...(state.sessions[documentId] || []), message],
      },
    })),

  updateMessage: (documentId, messageId, updates) =>
    set((state) => ({
      sessions: {
        ...state.sessions,
        [documentId]: (state.sessions[documentId] || []).map((msg) =>
          msg.id === messageId ? { ...msg, ...updates } : msg
        ),
      },
    })),

  updateStreamingMessage: (content) =>
    set({
      streamingMessage: content,
    }),

  setStreaming: (streaming) =>
    set({
      isStreaming: streaming,
      streamingMessage: streaming ? '' : '',
      shouldStopGeneration: false,
    }),

  stopGeneration: () =>
    set({
      shouldStopGeneration: true,
    }),

  clearSession: (documentId) =>
    set((state) => ({
      sessions: {
        ...state.sessions,
        [documentId]: [],
      },
    })),

  setError: (error) =>
    set({
      error,
    }),
}));

// ============================================================================
// UI Store (持久化)
// ============================================================================

interface UIStoreState extends UIState {
  // Actions
  setMiddlePanelWidth: (width: number) => void;
  toggleResourceList: () => void;
  setResourceListCollapsed: (collapsed: boolean) => void;
  setLoading: (loading: boolean, message?: string) => void;
  setError: (message: string | null, code?: string) => void;
  clearError: () => void;
}

export const useUIStore = create<UIStoreState>()(
  persist(
    (set) => ({
      // Initial state
      // 默认宽度调整为窗口的2/5，确保与文档区域比例为2:3
      middlePanelWidth:
        typeof window !== 'undefined'
          ? Math.min(650, Math.max(400, (window.innerWidth - 64) * 0.4))
          : 650,
      resourceListCollapsed: false,
      selectedResourceIds: [],
      isLoading: false,

      // Actions
      setMiddlePanelWidth: (width) =>
        set({
          middlePanelWidth: Math.max(400, Math.min(800, width)),
        }),

      toggleResourceList: () =>
        set((state) => ({
          resourceListCollapsed: !state.resourceListCollapsed,
        })),

      setResourceListCollapsed: (collapsed) =>
        set({
          resourceListCollapsed: collapsed,
        }),

      setLoading: (loading, message) =>
        set({
          isLoading: loading,
          loadingMessage: message,
        }),

      setError: (message, code) =>
        set({
          error: message
            ? {
                message,
                code,
              }
            : undefined,
        }),

      clearError: () =>
        set({
          error: undefined,
        }),
    }),
    {
      name: 'ai-office-ui-storage',
      partialize: (state) => ({
        middlePanelWidth: state.middlePanelWidth,
        resourceListCollapsed: state.resourceListCollapsed,
      }),
    }
  )
);

// ============================================================================
// Task Store (Genspark风格任务管理) - 优化版
// ============================================================================

export interface Task {
  _id: string;
  title: string;
  type: 'article' | 'ppt' | 'summary' | 'analysis';
  createdAt: Date;
  refreshedAt: Date; // 最后一次更新/编辑时间

  // 任务上下文 - 关键：用于恢复任务环境
  context: {
    resourceIds: string[]; // 关联的资源
    documentId?: string; // 生成的文档
    chatMessages: ChatMessage[]; // AI对话历史
    aiConfig?: any; // AI配置
    prompt?: string; // 原始用户提示词
  };

  // 元数据
  metadata: {
    thumbnail?: string; // 缩略图
    wordCount?: number; // 字数
    description?: string; // 任务描述
  };
}

interface TaskState {
  tasks: Task[];
  currentTaskId: string | null;
  isTaskListOpen: boolean;

  // Actions
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  setCurrentTask: (id: string | null) => void;
  toggleTaskList: () => void;
  setTaskListOpen: (open: boolean) => void;

  // 任务上下文操作
  saveTaskContext: (taskId: string, context: Partial<Task['context']>) => void;
  restoreTaskContext: (taskId: string) => void;
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      currentTaskId: null,
      isTaskListOpen: false,

      addTask: (task) =>
        set((state) => ({
          tasks: [task, ...state.tasks], // 新任务在最前面
        })),

      updateTask: (id, updates) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t._id === id
              ? {
                  ...t,
                  ...updates,
                  refreshedAt: new Date(),
                }
              : t
          ),
        })),

      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t._id !== id),
          currentTaskId: state.currentTaskId === id ? null : state.currentTaskId,
        })),

      setCurrentTask: (id) =>
        set({
          currentTaskId: id,
        }),

      toggleTaskList: () =>
        set((state) => ({
          isTaskListOpen: !state.isTaskListOpen,
        })),

      setTaskListOpen: (open) =>
        set({
          isTaskListOpen: open,
        }),

      saveTaskContext: (taskId, context) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t._id === taskId
              ? {
                  ...t,
                  context: {
                    ...t.context,
                    ...context,
                  },
                  refreshedAt: new Date(),
                }
              : t
          ),
        })),

      restoreTaskContext: (taskId) => {
        const task = get().tasks.find((t) => t._id === taskId);
        if (!task) return;

        // 恢复资源选择
        const resourceStore = useResourceStore.getState();
        resourceStore.clearSelection();
        task.context.resourceIds.forEach((id) => {
          resourceStore.selectResource(id);
        });

        // 恢复文档
        if (task.context.documentId) {
          const documentStore = useDocumentStore.getState();
          documentStore.setCurrentDocument(task.context.documentId);
        }

        // 恢复聊天历史
        const chatStore = useChatStore.getState();
        if (task.context.documentId && task.context.chatMessages.length > 0) {
          // 清空当前会话
          chatStore.clearSession(task.context.documentId);
          // 恢复历史消息
          task.context.chatMessages.forEach((msg) => {
            chatStore.addMessage(task.context.documentId!, msg);
          });
        }

        // 设置当前任务
        set({ currentTaskId: taskId });
      },
    }),
    {
      name: 'ai-office-task-storage',
      partialize: (state) => ({
        tasks: state.tasks,
        currentTaskId: state.currentTaskId,
      }),
    }
  )
);

// ============================================================================
// Selectors (派生状态)
// ============================================================================

export const useSelectedResources = () => {
  const resources = useResourceStore((state) => state.resources);
  const selectedIds = useResourceStore((state) => state.selectedResourceIds);

  return resources.filter((r) => selectedIds.includes(r._id));
};

export const useCurrentDocument = () => {
  const documents = useDocumentStore((state) => state.documents);
  const currentId = useDocumentStore((state) => state.currentDocumentId);

  return documents.find((d) => d._id === currentId);
};

export const useCurrentChatMessages = () => {
  const sessions = useChatStore((state) => state.sessions);
  const currentDocumentId = useDocumentStore(
    (state) => state.currentDocumentId
  );

  return currentDocumentId ? sessions[currentDocumentId] || [] : [];
};

export const useCurrentTask = () => {
  const tasks = useTaskStore((state) => state.tasks);
  const currentId = useTaskStore((state) => state.currentTaskId);

  return tasks.find((t) => t._id === currentId);
};
