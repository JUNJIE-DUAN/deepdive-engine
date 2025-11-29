'use client';

import { useState } from 'react';
import {
  TrendingUp,
  Network,
  FileText,
  BarChart3,
  Sparkles,
  ArrowRight,
  Play,
  Zap,
} from 'lucide-react';
import {
  TrendReport,
  HypeCycleChart,
  KnowledgeGraph,
  ComparisonMatrix,
} from '@/components/ai-studio';
import type { TrendReportData } from '@/components/ai-studio/TrendReport';
import type { HypeCyclePosition } from '@/components/ai-studio/HypeCycleChart';
import type { GraphData } from '@/components/ai-studio/KnowledgeGraph';
import type { TechComparisonData } from '@/components/ai-studio/ComparisonMatrix';

// 示例数据 - 符合 TrendReportData 类型
const DEMO_TREND_DATA: TrendReportData = {
  title: 'Large Language Models 趋势报告',
  generatedAt: new Date().toISOString(),
  timeRange: '过去 30 天',
  executiveSummary:
    'LLM 领域在过去 30 天内持续高速发展，多模态能力和推理优化成为主要方向。开源模型与闭源模型的差距进一步缩小，企业级应用落地加速。',
  topTrends: [
    {
      name: 'GPT-4 Turbo',
      direction: 'rising',
      maturityStage: '生产力爬升期',
      momentumScore: 95,
      adoptionRate: 88,
      relatedTechs: ['OpenAI API', 'Function Calling', 'JSON Mode'],
      keyPlayers: ['OpenAI', 'Microsoft', 'Azure'],
      summary:
        '128K 上下文窗口成为标配，JSON Mode 提升结构化输出能力，价格下降 3 倍推动企业采用。',
    },
    {
      name: 'Claude 3',
      direction: 'rising',
      maturityStage: '期望膨胀期',
      momentumScore: 92,
      adoptionRate: 75,
      relatedTechs: ['Anthropic API', 'Constitutional AI', 'RLHF'],
      keyPlayers: ['Anthropic', 'Amazon', 'Google'],
      summary:
        'Opus 版本在推理任务上表现优异，200K 超长上下文窗口，多模态能力显著提升。',
    },
    {
      name: 'Llama 3',
      direction: 'rising',
      maturityStage: '技术萌芽期',
      momentumScore: 88,
      adoptionRate: 65,
      relatedTechs: ['Meta AI', 'Hugging Face', 'vLLM'],
      keyPlayers: ['Meta', 'Together AI', 'Fireworks'],
      summary:
        '开源社区活跃度持续上升，微调版本在专业领域表现出色，企业私有化部署增加。',
    },
    {
      name: 'RAG',
      direction: 'stable',
      maturityStage: '生产力高原期',
      momentumScore: 85,
      adoptionRate: 92,
      relatedTechs: ['Vector DB', 'Embedding', 'LangChain'],
      keyPlayers: ['Pinecone', 'Weaviate', 'Chroma'],
      summary:
        '向量数据库性能持续优化，混合检索策略普及，知识图谱增强 RAG 成为趋势。',
    },
    {
      name: 'AI Agent',
      direction: 'rising',
      maturityStage: '期望膨胀期',
      momentumScore: 82,
      adoptionRate: 45,
      relatedTechs: ['Tool Use', 'ReAct', 'AutoGPT'],
      keyPlayers: ['OpenAI', 'Anthropic', 'LangChain'],
      summary:
        '工具调用能力标准化，多 Agent 协作框架涌现，企业工作流自动化场景落地。',
    },
  ],
  emergingTechs: [
    'Mixture of Experts',
    'Multimodal AI',
    'AI Code Generation',
    'Voice AI',
  ],
  decliningTechs: ['Traditional NLP', 'Rule-based Systems', 'Legacy Chatbots'],
  dataSourcesCount: 1250,
  confidenceScore: 87,
};

const DEMO_HYPE_CYCLE_DATA: HypeCyclePosition[] = [
  {
    techName: 'GPT-4 Turbo',
    xPosition: 70,
    yPosition: 45,
    stage: '生产力爬升期',
    yearsToMainstream: '< 2 年',
  },
  {
    techName: 'Claude 3',
    xPosition: 65,
    yPosition: 50,
    stage: '生产力爬升期',
    yearsToMainstream: '< 2 年',
  },
  {
    techName: 'Llama 3',
    xPosition: 52,
    yPosition: 72,
    stage: '泡沫破灭低谷期',
    yearsToMainstream: '2-5 年',
  },
  {
    techName: 'AI Agent',
    xPosition: 25,
    yPosition: 15,
    stage: '期望膨胀期',
    yearsToMainstream: '5-10 年',
  },
  {
    techName: 'AGI',
    xPosition: 8,
    yPosition: 55,
    stage: '技术萌芽期',
    yearsToMainstream: '> 10 年',
  },
  {
    techName: 'RAG',
    xPosition: 88,
    yPosition: 35,
    stage: '生产力高原期',
    yearsToMainstream: '已主流',
  },
];

const DEMO_GRAPH_DATA: GraphData = {
  nodes: [
    { id: '1', name: 'LLM', type: 'concept', size: 40 },
    { id: '2', name: 'GPT-4', type: 'technology', size: 35 },
    { id: '3', name: 'Claude', type: 'technology', size: 30 },
    { id: '4', name: 'RAG', type: 'concept', size: 28 },
    { id: '5', name: 'Vector DB', type: 'technology', size: 22 },
    { id: '6', name: 'Embedding', type: 'concept', size: 20 },
    { id: '7', name: 'Fine-tuning', type: 'concept', size: 25 },
    { id: '8', name: 'AI Agent', type: 'concept', size: 30 },
    { id: '9', name: 'Tool Use', type: 'concept', size: 18 },
    { id: '10', name: 'Llama', type: 'technology', size: 28 },
  ],
  edges: [
    {
      source: '1',
      target: '2',
      type: 'related',
      label: 'implements',
      weight: 1,
    },
    {
      source: '1',
      target: '3',
      type: 'related',
      label: 'implements',
      weight: 1,
    },
    {
      source: '1',
      target: '10',
      type: 'related',
      label: 'implements',
      weight: 1,
    },
    { source: '4', target: '1', type: 'uses', label: 'enhances', weight: 0.8 },
    { source: '4', target: '5', type: 'uses', label: 'uses', weight: 0.9 },
    { source: '4', target: '6', type: 'uses', label: 'requires', weight: 0.7 },
    {
      source: '7',
      target: '1',
      type: 'related',
      label: 'optimizes',
      weight: 0.6,
    },
    {
      source: '8',
      target: '1',
      type: 'uses',
      label: 'powered by',
      weight: 0.9,
    },
    {
      source: '8',
      target: '9',
      type: 'part_of',
      label: 'enables',
      weight: 0.8,
    },
    {
      source: '2',
      target: '9',
      type: 'related',
      label: 'supports',
      weight: 0.7,
    },
    {
      source: '3',
      target: '9',
      type: 'related',
      label: 'supports',
      weight: 0.7,
    },
  ],
};

const DEMO_COMPARISON_DATA: TechComparisonData = {
  techA: {
    name: 'GPT-4 Turbo',
    mentionCount: 1250,
    scores: {
      performance: 95,
      scalability: 90,
      ease_of_use: 88,
      community_support: 95,
      documentation: 92,
      maturity: 90,
      cost: 65,
      ecosystem: 95,
    },
    strengths: ['推理能力强', 'API 稳定', '工具生态丰富', '多模态能力出色'],
    weaknesses: ['成本较高', '无法私有化部署', '速率限制严格'],
  },
  techB: {
    name: 'Claude 3 Opus',
    mentionCount: 980,
    scores: {
      performance: 93,
      scalability: 88,
      ease_of_use: 90,
      community_support: 75,
      documentation: 88,
      maturity: 85,
      cost: 70,
      ecosystem: 72,
    },
    strengths: ['超长上下文 200K', '安全性高', '推理细腻', '输出质量稳定'],
    weaknesses: ['生态相对较小', '暂无开源版本', 'API 限额较紧'],
  },
  recommendation:
    'GPT-4 Turbo 适合需要广泛工具集成和强大生态支持的场景；Claude 3 Opus 在长文档处理和复杂推理任务上表现更佳，且安全性更高。',
  useCases: {
    preferA: [
      '代码生成与调试',
      '多模态图像分析',
      '大规模 API 集成',
      '复杂工具调用',
    ],
    preferB: ['长文档摘要', '学术论文分析', '敏感内容处理', '精细化文本创作'],
    either: ['日常对话助手', '知识问答', '文本翻译', '内容审核'],
  },
};

type DemoView = 'overview' | 'trend' | 'hype' | 'graph' | 'compare';

export default function StudioPage() {
  const [activeView, setActiveView] = useState<DemoView>('overview');

  const features = [
    {
      id: 'trend' as const,
      title: '趋势报告',
      description: '生成科技趋势分析报告，追踪热门技术动态',
      icon: TrendingUp,
      color: 'purple',
      demo: true,
    },
    {
      id: 'hype' as const,
      title: 'Hype Cycle',
      description: '技术成熟度曲线，洞察技术发展阶段',
      icon: BarChart3,
      color: 'pink',
      demo: true,
    },
    {
      id: 'graph' as const,
      title: '知识图谱',
      description: '可视化概念关系网络，发现知识关联',
      icon: Network,
      color: 'blue',
      demo: true,
    },
    {
      id: 'compare' as const,
      title: '技术对比',
      description: '多维度技术方案对比分析',
      icon: FileText,
      color: 'emerald',
      demo: true,
    },
  ];

  const colorClasses = {
    purple: {
      bg: 'bg-purple-100',
      text: 'text-purple-600',
      border: 'border-purple-200',
      gradient: 'from-purple-500 to-purple-600',
    },
    pink: {
      bg: 'bg-pink-100',
      text: 'text-pink-600',
      border: 'border-pink-200',
      gradient: 'from-pink-500 to-pink-600',
    },
    blue: {
      bg: 'bg-blue-100',
      text: 'text-blue-600',
      border: 'border-blue-200',
      gradient: 'from-blue-500 to-blue-600',
    },
    emerald: {
      bg: 'bg-emerald-100',
      text: 'text-emerald-600',
      border: 'border-emerald-200',
      gradient: 'from-emerald-500 to-emerald-600',
    },
  };

  if (activeView !== 'overview') {
    return (
      <div className="h-full overflow-auto bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl">
          {/* Back button */}
          <button
            onClick={() => setActiveView('overview')}
            className="mb-4 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            返回概览
          </button>

          {/* Demo content */}
          {activeView === 'trend' && <TrendReport report={DEMO_TREND_DATA} />}

          {activeView === 'hype' && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-xl font-semibold">
                AI/LLM 技术成熟度曲线
              </h2>
              <HypeCycleChart positions={DEMO_HYPE_CYCLE_DATA} />
            </div>
          )}

          {activeView === 'graph' && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-xl font-semibold">LLM 知识图谱</h2>
              <KnowledgeGraph
                data={DEMO_GRAPH_DATA}
                onNodeClick={(node) => console.log('Clicked node:', node)}
              />
            </div>
          )}

          {activeView === 'compare' && (
            <ComparisonMatrix comparison={DEMO_COMPARISON_DATA} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-8">
      <div className="mx-auto max-w-6xl">
        {/* Hero Section */}
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 p-8 text-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                <span className="text-sm font-medium opacity-90">
                  AI Studio
                </span>
              </div>
              <h1 className="mb-2 text-3xl font-bold">科技洞察工作台</h1>
              <p className="max-w-xl text-white/80">
                利用 AI
                能力深度分析科技趋势、可视化知识关系、生成专业报告。探索技术发展脉络，把握创新机遇。
              </p>
            </div>
            <div className="hidden rounded-xl bg-white/10 p-4 backdrop-blur-sm md:block">
              <Zap className="h-12 w-12 text-yellow-300" />
            </div>
          </div>

          {/* Quick stats */}
          <div className="mt-6 grid grid-cols-4 gap-4">
            <div className="rounded-lg bg-white/10 p-3 backdrop-blur-sm">
              <div className="text-2xl font-bold">4</div>
              <div className="text-sm text-white/70">分析工具</div>
            </div>
            <div className="rounded-lg bg-white/10 p-3 backdrop-blur-sm">
              <div className="text-2xl font-bold">8</div>
              <div className="text-sm text-white/70">斜杠命令</div>
            </div>
            <div className="rounded-lg bg-white/10 p-3 backdrop-blur-sm">
              <div className="text-2xl font-bold">344</div>
              <div className="text-sm text-white/70">知识资源</div>
            </div>
            <div className="rounded-lg bg-white/10 p-3 backdrop-blur-sm">
              <div className="text-2xl font-bold">∞</div>
              <div className="text-sm text-white/70">洞察潜力</div>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {features.map((feature) => {
            const Icon = feature.icon;
            const colors =
              colorClasses[feature.color as keyof typeof colorClasses];

            return (
              <div
                key={feature.id}
                className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg"
              >
                <div
                  className={`absolute right-4 top-4 rounded-full ${colors.bg} p-3`}
                >
                  <Icon className={`h-6 w-6 ${colors.text}`} />
                </div>

                <h3 className="text-xl font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  {feature.description}
                </p>

                <button
                  onClick={() => setActiveView(feature.id)}
                  className={`mt-4 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r ${colors.gradient} px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md`}
                >
                  <Play className="h-4 w-4" />
                  查看演示
                </button>
              </div>
            );
          })}
        </div>

        {/* Usage Tips */}
        <div className="mt-8 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-blue-100 p-2">
              <Zap className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">快速使用提示</h4>
              <p className="mt-1 text-sm text-gray-600">
                在 AI Office 的聊天界面中，输入{' '}
                <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-purple-600">
                  /
                </code>{' '}
                即可调出斜杠命令菜单，支持{' '}
                <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono">
                  /trend
                </code>
                、
                <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono">
                  /compare
                </code>
                、
                <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono">
                  /graph
                </code>{' '}
                等命令。 按{' '}
                <kbd className="rounded border border-gray-300 bg-gray-50 px-1.5 py-0.5 text-xs">
                  Cmd+K
                </kbd>{' '}
                打开命令面板快速访问所有功能。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
