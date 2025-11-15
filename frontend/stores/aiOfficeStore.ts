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
// Resource Store
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

export const useResourceStore = create<ResourceState>((set) => ({
  resources: [],
  selectedResourceIds: [],
  isLoading: false,
  error: null,

  addResource: (resource) =>
    set((state) => ({
      resources: [...state.resources, resource],
    })),

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
}));

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
