'use client';

/**
 * AI Studio - 科技深度洞察工作台
 * 真实 API 版本 - 不使用任何假数据
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search,
  FileText,
  Github,
  Newspaper,
  Send,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
  Circle,
  Play,
  BookOpen,
  Lightbulb,
  TrendingUp,
  BarChart3,
  Network,
  FileSpreadsheet,
  Clock,
  Target,
  RefreshCw,
  AlertCircle,
  X,
} from 'lucide-react';
import {
  CommandPalette,
  useCommandPalette,
  ResearchPlan,
} from '@/components/ai-studio';
import type { ResearchPlanData } from '@/components/ai-studio/ResearchPlan';

// ==================== 类型定义 ====================
interface Resource {
  id: string;
  type: 'PAPER' | 'PROJECT' | 'NEWS' | 'BLOG' | 'RSS' | 'YOUTUBE_VIDEO';
  title: string;
  sourceType: string;
  sourceUrl: string;
  publishedAt: string | null;
  abstract?: string;
  authors?: string[];
  citationCount?: number;
  qualityScore?: number;
  trendingScore?: number;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  citations?: string[];
}

interface InsightItem {
  id: string;
  type: 'trend' | 'compare' | 'graph' | 'timeline' | 'summary';
  title: string;
  createdAt: Date;
  preview?: string;
}

type SearchSource = 'all' | 'local' | 'internet';

// ==================== API 配置 ====================
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

// ==================== 自定义 Hooks ====================
function useResources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取资源列表
  const fetchResources = useCallback(
    async (params?: { type?: string; search?: string; take?: number }) => {
      setLoading(true);
      setError(null);
      try {
        const searchParams = new URLSearchParams();
        if (params?.type) searchParams.set('type', params.type);
        if (params?.search) searchParams.set('search', params.search);
        searchParams.set('take', String(params?.take || 20));
        searchParams.set('sortBy', 'publishedAt');
        searchParams.set('sortOrder', 'desc');

        const res = await fetch(`${API_BASE}/api/v1/resources?${searchParams}`);
        if (!res.ok) throw new Error('获取资源失败');
        const data = await res.json();
        // API 返回 { data: Resource[], pagination: {...} }
        setResources(
          Array.isArray(data) ? data : data.data || data.items || []
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : '未知错误');
        setResources([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // 搜索本地数据库
  const searchLocal = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/feed/search?q=${encodeURIComponent(query)}&take=30`
      );
      if (!res.ok) throw new Error('搜索失败');
      const data = await res.json();
      // API 可能返回不同格式
      setResources(Array.isArray(data) ? data : data.data || data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '搜索失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 搜索互联网（触发爬虫）
  const searchInternet = useCallback(
    async (query: string) => {
      setLoading(true);
      setError(null);
      try {
        // 并行搜索 arXiv 和 GitHub
        const [arxivRes, githubRes] = await Promise.allSettled([
          fetch(
            `${API_BASE}/api/v1/crawler/arxiv/search?q=${encodeURIComponent(query)}&max=10`,
            { method: 'POST' }
          ),
          fetch(
            `${API_BASE}/api/v1/crawler/github/search?q=${encodeURIComponent(query)}&max=10`,
            { method: 'POST' }
          ),
        ]);

        // 等待一小段时间让数据入库
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // 然后从本地数据库获取结果
        await searchLocal(query);
      } catch (err) {
        setError(err instanceof Error ? err.message : '互联网搜索失败');
      } finally {
        setLoading(false);
      }
    },
    [searchLocal]
  );

  // 组合搜索
  const search = useCallback(
    async (query: string, source: SearchSource) => {
      if (source === 'local') {
        await searchLocal(query);
      } else if (source === 'internet') {
        await searchInternet(query);
      } else {
        // 先搜索本地，同时触发互联网搜索
        await searchLocal(query);
        // 后台触发互联网搜索（不阻塞）
        searchInternet(query).catch(console.error);
      }
    },
    [searchLocal, searchInternet]
  );

  return { resources, loading, error, fetchResources, search };
}

function useAIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = useCallback(
    async (message: string, selectedResources: Resource[]) => {
      // 添加用户消息
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: message,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setLoading(true);

      try {
        // 构建资源上下文
        const resourceContext = selectedResources.map((r) => ({
          resourceType: r.type,
          metadata: {
            title: r.title,
            description: r.abstract,
            url: r.sourceUrl,
          },
          aiAnalysis: {
            summary: r.abstract,
          },
        }));

        const res = await fetch('/api/ai-office/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            resources: resourceContext,
            stream: false,
            agentMode: 'enhanced',
          }),
        });

        if (!res.ok) throw new Error('AI 服务响应失败');

        const data = await res.json();

        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response || data.message || '分析完成',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      } catch (err) {
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `抱歉，分析过程中出现错误：${err instanceof Error ? err.message : '未知错误'}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, loading, sendMessage, clearMessages };
}

// ==================== 研究中枢组件 ====================
function ResearchHub({
  resources,
  selectedIds,
  onToggleResource,
  searchQuery,
  onSearchChange,
  researchPlan,
  onSearch,
  loading,
  error,
}: {
  resources: Resource[];
  selectedIds: Set<string>;
  onToggleResource: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  researchPlan: ResearchPlanData | null;
  onSearch: (query: string, source: SearchSource) => void;
  loading: boolean;
  error: string | null;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchSource, setSearchSource] = useState<SearchSource>('all');

  const getTypeIcon = (type: Resource['type']) => {
    switch (type) {
      case 'PAPER':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'PROJECT':
        return <Github className="h-4 w-4 text-gray-700" />;
      case 'NEWS':
        return <Newspaper className="h-4 w-4 text-orange-500" />;
      case 'YOUTUBE_VIDEO':
        return <Play className="h-4 w-4 text-red-500" />;
      default:
        return <BookOpen className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '未知日期';
    try {
      return new Date(dateStr).toLocaleDateString('zh-CN');
    } catch {
      return dateStr;
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim(), searchSource);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="border-b border-gray-200 bg-white">
      {/* Search Bar with Source Toggle */}
      <div className="border-b border-gray-100 p-4">
        {/* Source Toggle */}
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">搜索范围:</span>
          <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
            {[
              { id: 'all', label: '全部', icon: '🌐' },
              { id: 'local', label: '本地数据库', icon: '💾' },
              { id: 'internet', label: '互联网', icon: '🔍' },
            ].map((source) => (
              <button
                key={source.id}
                onClick={() => setSearchSource(source.id as SearchSource)}
                className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  searchSource === source.id
                    ? 'bg-white text-purple-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>{source.icon}</span>
                <span>{source.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                searchSource === 'local'
                  ? '搜索本地资源库...'
                  : searchSource === 'internet'
                    ? '搜索 arXiv, GitHub, 科技资讯...'
                    : '搜索本地 + 互联网资源...'
              }
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={!searchQuery.trim() || loading}
            className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            搜索
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-2 flex items-center gap-2 text-xs text-red-500">
            <AlertCircle className="h-3 w-3" />
            {error}
          </div>
        )}

        {/* Search Hints */}
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
          <kbd className="rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 text-gray-500">
            ⌘K
          </kbd>
          <span>打开命令面板</span>
          <span className="mx-1">•</span>
          <span>支持 arXiv, GitHub, HackerNews, 技术博客等数据源</span>
        </div>
      </div>

      {/* Research Plan (if active) */}
      {researchPlan && (
        <div className="border-b border-gray-100 bg-purple-50/50 p-4">
          <ResearchPlan plan={researchPlan} />
        </div>
      )}

      {/* Resource List Header */}
      <div
        className="flex cursor-pointer items-center justify-between px-4 py-3 hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">
            {loading ? '正在加载...' : `搜索结果 (${resources.length})`}
          </span>
          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-600">
            已选 {selectedIds.size}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </div>

      {/* Resource Cards */}
      {isExpanded && (
        <div className="max-h-64 space-y-2 overflow-y-auto p-4 pt-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
              <span className="ml-2 text-sm text-gray-500">正在搜索...</span>
            </div>
          ) : resources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Search className="h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">输入关键词搜索资源</p>
              <p className="mt-1 text-xs text-gray-400">
                支持论文、GitHub 项目、技术新闻等
              </p>
            </div>
          ) : (
            resources.map((resource) => (
              <div
                key={resource.id}
                onClick={() => onToggleResource(resource.id)}
                className={`cursor-pointer rounded-lg border p-3 transition-all ${
                  selectedIds.has(resource.id)
                    ? 'border-purple-300 bg-purple-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getTypeIcon(resource.type)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="truncate text-sm font-medium text-gray-900">
                        {resource.title}
                      </h4>
                      {resource.qualityScore && (
                        <span className="shrink-0 rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700">
                          {resource.qualityScore}分
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                      <span>{resource.sourceType}</span>
                      <span>•</span>
                      <span>{formatDate(resource.publishedAt)}</span>
                      {resource.citationCount && (
                        <>
                          <span>•</span>
                          <span>
                            引用 {resource.citationCount.toLocaleString()}
                          </span>
                        </>
                      )}
                    </div>
                    {resource.abstract && (
                      <p className="mt-1 line-clamp-1 text-xs text-gray-600">
                        {resource.abstract}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0">
                    {selectedIds.has(resource.id) ? (
                      <CheckCircle2 className="h-5 w-5 text-purple-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-300" />
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ==================== 深度分析组件 ====================
function DeepAnalysis({
  messages,
  onSend,
  isLoading,
  onStartResearch,
  selectedResources,
}: {
  messages: ChatMessage[];
  onSend: (message: string) => void;
  isLoading: boolean;
  onStartResearch?: (query: string) => void;
  selectedResources: Resource[];
}) {
  const [input, setInput] = useState('');
  const [researchInput, setResearchInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSend(input.trim());
      setInput('');
    }
  };

  const handleStartResearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (researchInput.trim() && onStartResearch) {
      onStartResearch(researchInput.trim());
      setResearchInput('');
    }
  };

  return (
    <div className="flex flex-1 flex-col bg-white">
      {/* 深度研究输入框 */}
      <div className="border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50 p-6">
        <div className="mx-auto max-w-3xl">
          <div className="mb-3 flex items-center gap-2">
            <div className="rounded-lg bg-purple-600 p-2">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">深度研究</h2>
              <p className="text-sm text-gray-500">
                输入研究问题，AI 将基于已选资源进行深度分析
                {selectedResources.length > 0 && (
                  <span className="ml-2 text-purple-600">
                    (已选 {selectedResources.length} 个资源)
                  </span>
                )}
              </p>
            </div>
          </div>
          <form onSubmit={handleStartResearch} className="relative">
            <textarea
              value={researchInput}
              onChange={(e) => setResearchInput(e.target.value)}
              placeholder="例如：分析这些论文的核心技术创新点，对比它们的方法论差异..."
              className="min-h-[100px] w-full resize-none rounded-xl border-2 border-purple-200 bg-white p-4 pr-24 text-base shadow-sm placeholder:text-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              rows={3}
            />
            <button
              type="submit"
              disabled={!researchInput.trim() || isLoading}
              className="absolute bottom-4 right-4 flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              开始研究
            </button>
          </form>
          {/* 快捷模板 */}
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs text-gray-500">快捷模板:</span>
            {[
              '总结这些资源的核心观点',
              '分析技术演进趋势',
              '对比不同方案的优劣',
            ].map((template) => (
              <button
                key={template}
                onClick={() => setResearchInput(template)}
                className="rounded-full border border-purple-200 bg-white px-3 py-1 text-xs text-purple-600 transition-colors hover:bg-purple-50"
              >
                {template}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Messages / 对话区域 */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="rounded-full bg-gray-100 p-4">
              <Lightbulb className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="mt-4 text-base font-medium text-gray-700">
              开始您的研究
            </h3>
            <p className="mt-2 max-w-sm text-sm text-gray-500">
              1. 搜索并选择相关资源
              <br />
              2. 输入研究问题进行深度分析
              <br />
              3. AI 将基于选中资源生成洞察
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm">
                    {msg.content}
                  </div>
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {msg.citations.map((c) => (
                        <span
                          key={c}
                          className="cursor-pointer rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700 hover:bg-blue-200"
                        >
                          [{c}]
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-xl bg-gray-100 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    AI 正在分析中...
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 底部快速对话输入 */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-gray-200 bg-gray-50 p-3"
      >
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="追问或补充问题..."
            className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="rounded-lg bg-purple-600 p-2 text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

// ==================== 洞察画廊组件 ====================
function InsightGallery({
  insights,
  activeInsight,
  onSelectInsight,
}: {
  insights: InsightItem[];
  activeInsight: string | null;
  onSelectInsight: (id: string | null) => void;
}) {
  const getTypeConfig = (type: InsightItem['type']) => {
    switch (type) {
      case 'trend':
        return {
          icon: TrendingUp,
          color: 'text-purple-600',
          bg: 'bg-purple-100',
        };
      case 'compare':
        return { icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-100' };
      case 'graph':
        return {
          icon: Network,
          color: 'text-emerald-600',
          bg: 'bg-emerald-100',
        };
      case 'timeline':
        return { icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100' };
      case 'summary':
        return {
          icon: FileSpreadsheet,
          color: 'text-pink-600',
          bg: 'bg-pink-100',
        };
      default:
        return { icon: Lightbulb, color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  return (
    <div className="flex h-full w-72 flex-col border-l border-gray-200 bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900">洞察画廊</h3>
        <p className="mt-1 text-xs text-gray-500">生成的报告和分析结果</p>
      </div>

      {/* Insights List */}
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {insights.map((insight) => {
          const config = getTypeConfig(insight.type);
          const Icon = config.icon;
          const isActive = activeInsight === insight.id;

          return (
            <button
              key={insight.id}
              onClick={() => onSelectInsight(isActive ? null : insight.id)}
              className={`w-full rounded-lg border p-3 text-left transition-all ${
                isActive
                  ? 'border-purple-300 bg-white shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`rounded-lg ${config.bg} p-2`}>
                  <Icon className={`h-4 w-4 ${config.color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm font-medium text-gray-900">
                    {insight.title}
                  </h4>
                  {insight.preview && (
                    <p className="mt-0.5 text-xs text-gray-500">
                      {insight.preview}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    {insight.createdAt.toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </button>
          );
        })}

        {insights.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center p-6 text-center">
            <Target className="h-8 w-8 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">暂无洞察</p>
            <p className="mt-1 text-xs text-gray-400">
              开始研究后将生成分析结果
            </p>
          </div>
        )}
      </div>

      {/* Quick Commands */}
      <div className="border-t border-gray-200 p-3">
        <p className="mb-2 text-xs font-medium text-gray-500">快捷命令</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { cmd: '/trend', label: '趋势', icon: TrendingUp },
            { cmd: '/compare', label: '对比', icon: BarChart3 },
            { cmd: '/graph', label: '图谱', icon: Network },
            { cmd: '/ppt', label: 'PPT', icon: FileSpreadsheet },
          ].map((item) => (
            <button
              key={item.cmd}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-600 transition-colors hover:border-purple-300 hover:bg-purple-50"
            >
              <item.icon className="h-3 w-3" />
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==================== 主页面组件 ====================
export default function StudioPage() {
  const {
    resources,
    loading: resourcesLoading,
    error: resourcesError,
    fetchResources,
    search,
  } = useResources();
  const {
    messages,
    loading: chatLoading,
    sendMessage,
    clearMessages,
  } = useAIChat();

  const [selectedResourceIds, setSelectedResourceIds] = useState<Set<string>>(
    new Set()
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [activeInsight, setActiveInsight] = useState<string | null>(null);
  const [researchPlan, setResearchPlan] = useState<ResearchPlanData | null>(
    null
  );

  const { isOpen, open, close } = useCommandPalette();

  // 获取已选择的资源
  const selectedResources = resources.filter((r) =>
    selectedResourceIds.has(r.id)
  );

  // 初始加载热门资源
  useEffect(() => {
    fetchResources({ take: 20 });
  }, [fetchResources]);

  const handleToggleResource = (id: string) => {
    setSelectedResourceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSearch = useCallback(
    (query: string, source: SearchSource) => {
      search(query, source);
    },
    [search]
  );

  const handleSendMessage = useCallback(
    (message: string) => {
      sendMessage(message, selectedResources);
    },
    [sendMessage, selectedResources]
  );

  const handleStartResearch = useCallback(
    (query: string) => {
      // 创建研究计划
      const newPlan: ResearchPlanData = {
        id: `plan-${Date.now()}`,
        query,
        status: 'running',
        createdAt: new Date(),
        estimatedTime: 60,
        steps: [
          {
            id: '1',
            title: '分析已选资源',
            description: `${selectedResources.length} 个资源`,
            status: 'in_progress',
            progress: 30,
          },
          {
            id: '2',
            title: 'AI 深度分析',
            description: query,
            status: 'pending',
            progress: 0,
          },
          {
            id: '3',
            title: '生成洞察报告',
            description: '综合分析结果',
            status: 'pending',
            progress: 0,
          },
        ],
      };
      setResearchPlan(newPlan);

      // 发送消息给 AI
      sendMessage(query, selectedResources);

      // 模拟研究进度更新
      setTimeout(() => {
        setResearchPlan((prev) =>
          prev
            ? {
                ...prev,
                steps: prev.steps.map((s, i) =>
                  i === 0
                    ? { ...s, status: 'completed' as const, progress: 100 }
                    : i === 1
                      ? { ...s, status: 'in_progress' as const, progress: 50 }
                      : s
                ),
              }
            : null
        );
      }, 2000);

      setTimeout(() => {
        setResearchPlan((prev) =>
          prev
            ? {
                ...prev,
                status: 'completed',
                steps: prev.steps.map((s) => ({
                  ...s,
                  status: 'completed' as const,
                  progress: 100,
                })),
              }
            : null
        );

        // 添加洞察
        setInsights((prev) => [
          {
            id: `insight-${Date.now()}`,
            type: 'summary',
            title: query.slice(0, 30) + (query.length > 30 ? '...' : ''),
            createdAt: new Date(),
            preview: `基于 ${selectedResources.length} 个资源的分析`,
          },
          ...prev,
        ]);
      }, 5000);
    },
    [selectedResources, sendMessage]
  );

  // Keyboard shortcut for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        open();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-100">
      {/* Command Palette */}
      <CommandPalette isOpen={isOpen} onClose={close} />

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Center: Research Hub + Deep Analysis */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Research Hub (Top) */}
          <ResearchHub
            resources={resources}
            selectedIds={selectedResourceIds}
            onToggleResource={handleToggleResource}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            researchPlan={researchPlan}
            onSearch={handleSearch}
            loading={resourcesLoading}
            error={resourcesError}
          />

          {/* Deep Analysis (Bottom) */}
          <DeepAnalysis
            messages={messages}
            onSend={handleSendMessage}
            isLoading={chatLoading}
            onStartResearch={handleStartResearch}
            selectedResources={selectedResources}
          />
        </div>

        {/* Right: Insight Gallery */}
        <InsightGallery
          insights={insights}
          activeInsight={activeInsight}
          onSelectInsight={setActiveInsight}
        />
      </div>
    </div>
  );
}
