'use client';

/**
 * AI Studio - 科技深度洞察工作台
 * 对标 PRD v3.1 设计规范
 *
 * 布局：
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  Header: Logo + 智能搜索 + Cmd+K + 用户                          │
 * ├─────────┬───────────────────────────────────────────┬───────────┤
 * │  左侧   │  中间主区域                                │  右侧     │
 * │  导航   │  ┌──────────────────────────────────────┐ │  洞察     │
 * │         │  │  Research Hub (资源管理+深度搜索)    │ │  画廊     │
 * │ Papers  │  └──────────────────────────────────────┘ │           │
 * │ GitHub  │  ══════════════════════════════════════   │ 趋势报告  │
 * │ News    │  ┌──────────────────────────────────────┐ │ 技术对比  │
 * │ Trends  │  │  Deep Analysis (AI对话分析)          │ │ 知识图谱  │
 * │         │  └──────────────────────────────────────┘ │           │
 * └─────────┴───────────────────────────────────────────┴───────────┘
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search,
  FileText,
  Github,
  Newspaper,
  TrendingUp,
  Send,
  Sparkles,
  Command,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  ExternalLink,
  Clock,
  BarChart3,
  Network,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  Circle,
  Play,
  BookOpen,
  Lightbulb,
  Target,
  Zap,
} from 'lucide-react';
import {
  TrendReport,
  HypeCycleChart,
  KnowledgeGraph,
  ComparisonMatrix,
  CommandPalette,
  useCommandPalette,
  ResearchPlan,
} from '@/components/ai-studio';
import type { TrendReportData } from '@/components/ai-studio/TrendReport';
import type { HypeCyclePosition } from '@/components/ai-studio/HypeCycleChart';
import type { GraphData } from '@/components/ai-studio/KnowledgeGraph';
import type { TechComparisonData } from '@/components/ai-studio/ComparisonMatrix';
import type { ResearchPlanData } from '@/components/ai-studio/ResearchPlan';

// ==================== 类型定义 ====================
interface Resource {
  id: string;
  type: 'paper' | 'github' | 'news' | 'blog';
  title: string;
  source: string;
  url: string;
  date: string;
  summary?: string;
  authors?: string[];
  citationCount?: number;
  stars?: number;
  score?: number;
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

// ==================== 示例数据 ====================
const DEMO_RESOURCES: Resource[] = [
  {
    id: '1',
    type: 'paper',
    title: 'Attention Is All You Need',
    source: 'arXiv',
    url: 'https://arxiv.org/abs/1706.03762',
    date: '2017-06-12',
    authors: ['Vaswani et al.'],
    citationCount: 120000,
    score: 99,
    summary: '提出 Transformer 架构，用自注意力机制取代循环神经网络',
  },
  {
    id: '2',
    type: 'github',
    title: 'vLLM - High-throughput LLM serving',
    source: 'GitHub',
    url: 'https://github.com/vllm-project/vllm',
    date: '2024-01-15',
    stars: 28000,
    score: 95,
    summary: 'PagedAttention 实现高效 LLM 推理服务',
  },
  {
    id: '3',
    type: 'news',
    title: 'OpenAI 发布 GPT-4 Turbo',
    source: 'TechCrunch',
    url: 'https://techcrunch.com/gpt4-turbo',
    date: '2024-11-20',
    score: 88,
    summary: '128K 上下文窗口，价格下降 3 倍',
  },
];

const DEMO_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    role: 'user',
    content: '分析 2024 年 LLM 推理优化的技术演进',
    timestamp: new Date(Date.now() - 60000),
  },
  {
    id: '2',
    role: 'assistant',
    content: `基于 47 篇论文和 23 个项目的分析，2024 年 LLM 推理优化呈现三大趋势：

**1. PagedAttention 成为标配**
vLLM 的 PagedAttention 技术已被广泛采用，显著提升了 GPU 内存利用率 [1]。

**2. Speculative Decoding 进入成熟期**
投机解码技术从实验阶段进入生产应用，平均可提升 2-3x 推理速度 [2]。

**3. 量化技术持续突破**
GGUF 格式和 AWQ 量化使得消费级硬件也能运行大模型 [3]。

💡 **洞察**: vLLM 社区增长最快，预计 6 个月内成为云端 LLM 服务的主流选择。`,
    timestamp: new Date(),
    citations: ['1', '2', '3'],
  },
];

const DEMO_INSIGHTS: InsightItem[] = [
  {
    id: '1',
    type: 'trend',
    title: 'LLM 推理优化趋势报告',
    createdAt: new Date(),
    preview: '基于 47 篇论文的分析',
  },
  {
    id: '2',
    type: 'compare',
    title: 'vLLM vs TensorRT-LLM 对比',
    createdAt: new Date(Date.now() - 3600000),
    preview: '多维度技术对比',
  },
  {
    id: '3',
    type: 'graph',
    title: 'Transformer 知识图谱',
    createdAt: new Date(Date.now() - 7200000),
    preview: '120+ 技术节点',
  },
];

// Demo data for components
const DEMO_TREND_DATA: TrendReportData = {
  title: 'LLM 推理优化趋势报告',
  generatedAt: new Date().toISOString(),
  timeRange: '2024年',
  executiveSummary:
    '2024年LLM推理优化领域呈现三大趋势：PagedAttention成为标配、Speculative Decoding进入成熟期、量化技术持续突破。',
  topTrends: [
    {
      name: 'vLLM',
      direction: 'rising',
      maturityStage: '生产力爬升期',
      momentumScore: 95,
      adoptionRate: 78,
      relatedTechs: ['PagedAttention', 'CUDA', 'Ray'],
      keyPlayers: ['UC Berkeley', 'Anyscale'],
      summary: 'PagedAttention技术革新，成为云端LLM服务首选',
    },
    {
      name: 'Speculative Decoding',
      direction: 'rising',
      maturityStage: '期望膨胀期',
      momentumScore: 88,
      adoptionRate: 45,
      relatedTechs: ['Draft Model', 'Token Verification'],
      keyPlayers: ['Google', 'Meta'],
      summary: '投机解码技术从实验进入生产，平均2-3x加速',
    },
    {
      name: 'AWQ量化',
      direction: 'stable',
      maturityStage: '生产力高原期',
      momentumScore: 82,
      adoptionRate: 65,
      relatedTechs: ['GGUF', 'GPTQ', 'INT4'],
      keyPlayers: ['MIT', 'Hugging Face'],
      summary: '激活感知量化使消费级硬件也能运行大模型',
    },
  ],
  emergingTechs: ['FlashAttention-3', 'Ring Attention', 'KV Cache压缩'],
  decliningTechs: ['传统ONNX推理', '无优化的HuggingFace推理'],
  dataSourcesCount: 47,
  confidenceScore: 0.92,
};

const DEMO_HYPE_CYCLE_DATA: HypeCyclePosition[] = [
  {
    techName: 'vLLM',
    xPosition: 72,
    yPosition: 42,
    stage: '生产力爬升期',
    yearsToMainstream: '< 1年',
  },
  {
    techName: 'TensorRT-LLM',
    xPosition: 68,
    yPosition: 48,
    stage: '生产力爬升期',
    yearsToMainstream: '< 2年',
  },
  {
    techName: 'Speculative Decoding',
    xPosition: 28,
    yPosition: 18,
    stage: '期望膨胀期',
    yearsToMainstream: '2-5年',
  },
  {
    techName: 'FlashAttention',
    xPosition: 85,
    yPosition: 32,
    stage: '生产力高原期',
    yearsToMainstream: '已主流',
  },
  {
    techName: 'AWQ量化',
    xPosition: 78,
    yPosition: 38,
    stage: '生产力爬升期',
    yearsToMainstream: '< 1年',
  },
];

const DEMO_GRAPH_DATA: GraphData = {
  nodes: [
    { id: '1', name: 'LLM推理', type: 'concept', size: 45 },
    { id: '2', name: 'vLLM', type: 'technology', size: 38 },
    { id: '3', name: 'TensorRT-LLM', type: 'technology', size: 35 },
    { id: '4', name: 'PagedAttention', type: 'concept', size: 30 },
    { id: '5', name: 'FlashAttention', type: 'concept', size: 32 },
    { id: '6', name: '量化', type: 'concept', size: 28 },
    { id: '7', name: 'NVIDIA', type: 'company', size: 25 },
  ],
  edges: [
    { source: '1', target: '2', type: 'uses', label: '实现', weight: 0.9 },
    { source: '1', target: '3', type: 'uses', label: '实现', weight: 0.85 },
    { source: '2', target: '4', type: 'uses', label: '核心技术', weight: 1 },
    { source: '2', target: '5', type: 'uses', label: '集成', weight: 0.8 },
    {
      source: '3',
      target: '7',
      type: 'created_by',
      label: '开发',
      weight: 0.9,
    },
    {
      source: '1',
      target: '6',
      type: 'related',
      label: '优化方向',
      weight: 0.7,
    },
  ],
};

const DEMO_COMPARISON_DATA: TechComparisonData = {
  techA: {
    name: 'vLLM',
    mentionCount: 1850,
    scores: {
      performance: 92,
      scalability: 95,
      ease_of_use: 88,
      community_support: 90,
      documentation: 85,
      maturity: 82,
      cost: 90,
      ecosystem: 88,
    },
    strengths: ['PagedAttention内存优化', '高吞吐量', '活跃社区', 'Ray集成'],
    weaknesses: ['NVIDIA GPU依赖', '新功能稳定性'],
  },
  techB: {
    name: 'TensorRT-LLM',
    mentionCount: 1420,
    scores: {
      performance: 96,
      scalability: 90,
      ease_of_use: 72,
      community_support: 75,
      documentation: 88,
      maturity: 85,
      cost: 70,
      ecosystem: 82,
    },
    strengths: ['极致性能', 'NVIDIA官方支持', '企业级稳定性'],
    weaknesses: ['学习曲线陡峭', 'NVIDIA锁定', '部署复杂'],
  },
  recommendation:
    'vLLM适合需要快速迭代和灵活部署的场景；TensorRT-LLM适合追求极致性能的NVIDIA环境。',
  useCases: {
    preferA: ['云端API服务', '多模型切换', '快速原型', '开源项目'],
    preferB: ['生产环境极致优化', 'NVIDIA数据中心', '低延迟场景'],
    either: ['批量推理', '模型服务化', 'A/B测试'],
  },
};

const DEMO_RESEARCH_PLAN: ResearchPlanData = {
  query: '分析 2024 年 LLM 推理优化的技术演进',
  id: 'plan-1',
  status: 'running',
  createdAt: new Date(),
  steps: [
    {
      id: '1',
      title: '搜索 arXiv 论文',
      description: 'LLM inference optimization 2024',
      status: 'completed',
      progress: 100,
    },
    {
      id: '2',
      title: '分析 GitHub 热门项目',
      description: 'vLLM, TensorRT-LLM, llama.cpp',
      status: 'completed',
      progress: 100,
    },
    {
      id: '3',
      title: '收集技术博客',
      description: 'HuggingFace, NVIDIA 技术博客',
      status: 'in_progress',
      progress: 65,
    },
    {
      id: '4',
      title: '生成趋势报告',
      description: '技术演进时间线 + 趋势预测',
      status: 'pending',
      progress: 0,
    },
  ],
  estimatedTime: 180,
};

// LeftNavigation 已移至全局 Sidebar（通过 layout.tsx 引入）

// ==================== 研究中枢组件 ====================
type SearchSource = 'all' | 'local' | 'internet';

function ResearchHub({
  resources,
  selectedIds,
  onToggleResource,
  searchQuery,
  onSearchChange,
  researchPlan,
  onSearch,
}: {
  resources: Resource[];
  selectedIds: Set<string>;
  onToggleResource: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  researchPlan: ResearchPlanData | null;
  onSearch?: (query: string, source: SearchSource) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchSource, setSearchSource] = useState<SearchSource>('all');
  const [isSearching, setIsSearching] = useState(false);

  const getTypeIcon = (type: Resource['type']) => {
    switch (type) {
      case 'paper':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'github':
        return <Github className="h-4 w-4 text-gray-700" />;
      case 'news':
        return <Newspaper className="h-4 w-4 text-orange-500" />;
      default:
        return <BookOpen className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim() && onSearch) {
      setIsSearching(true);
      onSearch(searchQuery.trim(), searchSource);
      // 模拟搜索完成
      setTimeout(() => setIsSearching(false), 2000);
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
            disabled={!searchQuery.trim() || isSearching}
            className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            搜索
          </button>
        </div>

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
          <span className="text-sm font-medium text-gray-700">已选资源</span>
          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-600">
            {selectedIds.size}
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
          {resources.map((resource) => (
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
                    {resource.score && (
                      <span className="shrink-0 rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700">
                        {resource.score}分
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                    <span>{resource.source}</span>
                    <span>•</span>
                    <span>{resource.date}</span>
                    {resource.citationCount && (
                      <>
                        <span>•</span>
                        <span>
                          引用 {resource.citationCount.toLocaleString()}
                        </span>
                      </>
                    )}
                    {resource.stars && (
                      <>
                        <span>•</span>
                        <span>⭐ {resource.stars.toLocaleString()}</span>
                      </>
                    )}
                  </div>
                  {resource.summary && (
                    <p className="mt-1 line-clamp-1 text-xs text-gray-600">
                      {resource.summary}
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
          ))}
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
}: {
  messages: ChatMessage[];
  onSend: (message: string) => void;
  isLoading: boolean;
  onStartResearch?: (query: string) => void;
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
      {/* 深度研究输入框 - 醒目位置 */}
      <div className="border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50 p-6">
        <div className="mx-auto max-w-3xl">
          <div className="mb-3 flex items-center gap-2">
            <div className="rounded-lg bg-purple-600 p-2">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">深度研究</h2>
              <p className="text-sm text-gray-500">
                输入研究问题，AI 将自动搜索、分析并生成洞察
              </p>
            </div>
          </div>
          <form onSubmit={handleStartResearch} className="relative">
            <textarea
              value={researchInput}
              onChange={(e) => setResearchInput(e.target.value)}
              placeholder="例如：分析 2024 年 LLM 推理优化的技术演进，对比 vLLM、TensorRT-LLM 和 llama.cpp 的技术路线..."
              className="min-h-[100px] w-full resize-none rounded-xl border-2 border-purple-200 bg-white p-4 pr-24 text-base shadow-sm placeholder:text-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              rows={3}
            />
            <button
              type="submit"
              disabled={!researchInput.trim() || isLoading}
              className="absolute bottom-4 right-4 flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              开始研究
            </button>
          </form>
          {/* 快捷模板 */}
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs text-gray-500">快捷模板:</span>
            {[
              '分析 [技术] 的最新进展',
              '对比 [A] vs [B] 的技术路线',
              '[领域] 2024 年趋势预测',
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
              等待研究结果
            </h3>
            <p className="mt-2 max-w-sm text-sm text-gray-500">
              在上方输入研究问题，或使用命令进行快速操作
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {['/trend LLM', '/compare vLLM vs TRT', '/graph Transformer'].map(
                (cmd) => (
                  <button
                    key={cmd}
                    onClick={() => setInput(cmd)}
                    className="rounded-full border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:border-purple-300 hover:bg-purple-50"
                  >
                    {cmd}
                  </button>
                )
              )}
            </div>
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
                    分析中...
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
            placeholder="追问或使用 / 命令..."
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
              使用 /trend、/compare 等命令生成
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

// ==================== 洞察详情组件 ====================
function InsightDetail({
  insightId,
  onClose,
}: {
  insightId: string;
  onClose: () => void;
}) {
  // 根据 insightId 渲染不同的内容
  const insight = DEMO_INSIGHTS.find((i) => i.id === insightId);
  if (!insight) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-8">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {insight.title}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {insight.type === 'trend' && <TrendReport report={DEMO_TREND_DATA} />}
          {insight.type === 'compare' && (
            <ComparisonMatrix comparison={DEMO_COMPARISON_DATA} />
          )}
          {insight.type === 'graph' && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <KnowledgeGraph data={DEMO_GRAPH_DATA} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== 主页面组件 ====================
export default function StudioPage() {
  // 全局 Sidebar 通过 layout.tsx 控制，无需本地状态
  const [selectedResourceIds, setSelectedResourceIds] = useState<Set<string>>(
    new Set(['1', '2'])
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(DEMO_MESSAGES);
  const [insights, setInsights] = useState<InsightItem[]>(DEMO_INSIGHTS);
  const [activeInsight, setActiveInsight] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [researchPlan, setResearchPlan] = useState<ResearchPlanData | null>(
    DEMO_RESEARCH_PLAN
  );

  const { isOpen, open, close } = useCommandPalette();

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

  const handleSendMessage = async (message: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          '基于您选择的资源进行分析...\n\n这是一个演示响应。在实际应用中，这里会显示 AI 基于选定资源生成的深度分析结果。',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
  };

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

      {/* Insight Detail Modal */}
      {activeInsight && (
        <InsightDetail
          insightId={activeInsight}
          onClose={() => setActiveInsight(null)}
        />
      )}

      {/* Main Layout - Sidebar 通过 layout.tsx 引入 */}
      <div className="flex flex-1 overflow-hidden">
        {/* Center: Research Hub + Deep Analysis */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Research Hub (Top) */}
          <ResearchHub
            resources={DEMO_RESOURCES}
            selectedIds={selectedResourceIds}
            onToggleResource={handleToggleResource}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            researchPlan={researchPlan}
            onSearch={(query, source) => {
              console.log(`Searching "${query}" in ${source}`);
              // TODO: 实际调用后端 API
              // source === 'local' -> 搜索本地数据库
              // source === 'internet' -> 搜索 arXiv, GitHub 等
              // source === 'all' -> 同时搜索
            }}
          />

          {/* Deep Analysis (Bottom) */}
          <DeepAnalysis
            messages={messages}
            onSend={handleSendMessage}
            isLoading={isLoading}
            onStartResearch={(query) => {
              // 创建新的研究计划
              const newPlan: ResearchPlanData = {
                id: `plan-${Date.now()}`,
                query,
                status: 'running',
                createdAt: new Date(),
                estimatedTime: 180,
                steps: [
                  {
                    id: '1',
                    title: '搜索 arXiv 论文',
                    description: query,
                    status: 'in_progress',
                    progress: 30,
                  },
                  {
                    id: '2',
                    title: '分析 GitHub 项目',
                    description: '相关开源项目',
                    status: 'pending',
                    progress: 0,
                  },
                  {
                    id: '3',
                    title: '收集技术博客',
                    description: '技术文章和评测',
                    status: 'pending',
                    progress: 0,
                  },
                  {
                    id: '4',
                    title: '生成趋势报告',
                    description: '综合分析结果',
                    status: 'pending',
                    progress: 0,
                  },
                ],
              };
              setResearchPlan(newPlan);
              // 同时发送消息
              handleSendMessage(query);
            }}
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
