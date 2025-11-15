/**
 * 文档模板配置
 * 定义所有可用的文档类型和模板
 */

export type DocumentCategory =
  | 'research_report' // 研究报告
  | 'academic_review' // 学术综述
  | 'technical_doc' // 技术文档
  | 'business_proposal' // 商业提案
  | 'presentation' // PPT演示
  | 'blog_article' // 博客文章
  | 'custom'; // 自定义

export interface TemplateSection {
  id: string;
  title: string;
  aiPrompt: string;
  required: boolean;
  order: number;
  estimatedWords?: number;
}

export interface DocumentTemplateConfig {
  id: string;
  name: string;
  category: DocumentCategory;
  description: string;
  icon: string;
  estimatedTime: string; // "3-5分钟"
  sections: TemplateSection[];
  styleGuide: {
    citationFormat?: 'APA' | 'MLA' | 'IEEE' | 'GB/T7714';
    headingStyle: 'numbered' | 'unnumbered';
    tone: 'academic' | 'business' | 'casual' | 'technical';
  };
  supportedExtensions: boolean; // 是否支持智能资源扩展
}

// ============================================================================
// 文档类型定义
// ============================================================================

export const DOCUMENT_CATEGORIES = [
  {
    id: 'research_report' as const,
    name: '📊 研究报告',
    description: '深度分析型文档，包含数据、图表、引用',
    color: 'blue',
  },
  {
    id: 'academic_review' as const,
    name: '📄 学术综述',
    description: '系统性文献综述，严谨的学术格式',
    color: 'purple',
  },
  {
    id: 'technical_doc' as const,
    name: '📑 技术文档',
    description: '技术说明、API文档、使用手册',
    color: 'green',
  },
  {
    id: 'business_proposal' as const,
    name: '💼 商业提案',
    description: '商业计划、项目提案、市场分析',
    color: 'orange',
  },
  {
    id: 'presentation' as const,
    name: '🎯 PPT演示',
    description: '幻灯片格式，适合演讲展示',
    color: 'red',
  },
  {
    id: 'blog_article' as const,
    name: '✍️ 博客文章',
    description: '轻松的写作风格，适合传播',
    color: 'pink',
  },
];

// ============================================================================
// 模板定义
// ============================================================================

export const DOCUMENT_TEMPLATES: Record<
  DocumentCategory,
  DocumentTemplateConfig[]
> = {
  research_report: [
    {
      id: 'standard-research-report',
      name: '标准研究报告',
      category: 'research_report',
      description: '包含摘要、引言、方法、结果、讨论、结论的完整研究报告',
      icon: '📊',
      estimatedTime: '5-8分钟',
      sections: [
        {
          id: 'abstract',
          title: '摘要',
          aiPrompt:
            '生成一个200-300字的研究摘要，包含研究背景、目的、方法、主要结果和结论',
          required: true,
          order: 1,
          estimatedWords: 250,
        },
        {
          id: 'introduction',
          title: '引言',
          aiPrompt: '撰写引言部分，介绍研究背景、研究问题、研究意义和文献综述',
          required: true,
          order: 2,
          estimatedWords: 800,
        },
        {
          id: 'methodology',
          title: '研究方法',
          aiPrompt: '详细描述研究方法、数据来源、分析工具和研究设计',
          required: true,
          order: 3,
          estimatedWords: 600,
        },
        {
          id: 'results',
          title: '研究结果',
          aiPrompt: '展示研究结果，包含数据分析、图表说明和关键发现',
          required: true,
          order: 4,
          estimatedWords: 1000,
        },
        {
          id: 'discussion',
          title: '讨论',
          aiPrompt: '讨论研究结果的含义、与已有研究的对比、研究局限性',
          required: true,
          order: 5,
          estimatedWords: 800,
        },
        {
          id: 'conclusion',
          title: '结论',
          aiPrompt: '总结研究的主要发现、理论和实践意义、未来研究方向',
          required: true,
          order: 6,
          estimatedWords: 400,
        },
        {
          id: 'references',
          title: '参考文献',
          aiPrompt: '整理所有引用的文献，按照规范格式排列',
          required: true,
          order: 7,
        },
      ],
      styleGuide: {
        citationFormat: 'APA',
        headingStyle: 'numbered',
        tone: 'academic',
      },
      supportedExtensions: true,
    },
    {
      id: 'industry-analysis-report',
      name: '行业分析报告',
      category: 'research_report',
      description: '市场概况、竞争分析、趋势预测',
      icon: '📈',
      estimatedTime: '4-6分钟',
      sections: [
        {
          id: 'executive-summary',
          title: '执行摘要',
          aiPrompt: '生成简明的执行摘要，概述行业现状和关键洞察',
          required: true,
          order: 1,
          estimatedWords: 300,
        },
        {
          id: 'market-overview',
          title: '市场概况',
          aiPrompt: '分析当前市场规模、增长趋势、市场细分',
          required: true,
          order: 2,
          estimatedWords: 1000,
        },
        {
          id: 'competitive-analysis',
          title: '竞争格局',
          aiPrompt: '分析主要竞争者、市场份额、竞争优势',
          required: true,
          order: 3,
          estimatedWords: 1200,
        },
        {
          id: 'trend-forecast',
          title: '趋势预测',
          aiPrompt: '预测未来发展趋势、机遇和挑战',
          required: true,
          order: 4,
          estimatedWords: 800,
        },
        {
          id: 'recommendations',
          title: '建议',
          aiPrompt: '提出战略建议和行动计划',
          required: false,
          order: 5,
          estimatedWords: 500,
        },
      ],
      styleGuide: {
        headingStyle: 'numbered',
        tone: 'business',
      },
      supportedExtensions: true,
    },
  ],

  academic_review: [
    {
      id: 'literature-review',
      name: '文献综述',
      category: 'academic_review',
      description: '系统性回顾和评价某一主题的学术文献',
      icon: '📚',
      estimatedTime: '6-10分钟',
      sections: [
        {
          id: 'abstract',
          title: '摘要',
          aiPrompt: '概述综述的目的、方法、主要发现和结论',
          required: true,
          order: 1,
          estimatedWords: 250,
        },
        {
          id: 'introduction',
          title: '引言',
          aiPrompt: '介绍综述的背景、目的、范围和研究问题',
          required: true,
          order: 2,
          estimatedWords: 600,
        },
        {
          id: 'methodology',
          title: '文献检索方法',
          aiPrompt: '说明文献搜索策略、纳入标准、排除标准',
          required: true,
          order: 3,
          estimatedWords: 400,
        },
        {
          id: 'thematic-review',
          title: '主题综述',
          aiPrompt: '按主题组织和分析相关文献，识别研究趋势和知识空白',
          required: true,
          order: 4,
          estimatedWords: 2000,
        },
        {
          id: 'critical-analysis',
          title: '批判性分析',
          aiPrompt: '评价现有研究的优缺点、方法学问题、理论贡献',
          required: true,
          order: 5,
          estimatedWords: 1000,
        },
        {
          id: 'conclusion',
          title: '结论与展望',
          aiPrompt: '总结主要发现、理论贡献、实践意义、未来研究方向',
          required: true,
          order: 6,
          estimatedWords: 500,
        },
      ],
      styleGuide: {
        citationFormat: 'APA',
        headingStyle: 'numbered',
        tone: 'academic',
      },
      supportedExtensions: true,
    },
  ],

  technical_doc: [
    {
      id: 'api-documentation',
      name: 'API文档',
      category: 'technical_doc',
      description: 'RESTful API接口文档',
      icon: '⚙️',
      estimatedTime: '3-5分钟',
      sections: [
        {
          id: 'overview',
          title: '概述',
          aiPrompt: '介绍API的用途、主要功能、版本信息',
          required: true,
          order: 1,
          estimatedWords: 300,
        },
        {
          id: 'authentication',
          title: '认证方式',
          aiPrompt: '说明API认证机制、如何获取和使用token',
          required: true,
          order: 2,
          estimatedWords: 400,
        },
        {
          id: 'endpoints',
          title: 'API端点',
          aiPrompt: '列出所有API端点、请求方法、参数、响应格式',
          required: true,
          order: 3,
          estimatedWords: 1500,
        },
        {
          id: 'error-handling',
          title: '错误处理',
          aiPrompt: '说明错误码、错误信息格式、常见错误处理',
          required: true,
          order: 4,
          estimatedWords: 500,
        },
        {
          id: 'examples',
          title: '使用示例',
          aiPrompt: '提供代码示例、常见用例演示',
          required: false,
          order: 5,
          estimatedWords: 800,
        },
      ],
      styleGuide: {
        headingStyle: 'numbered',
        tone: 'technical',
      },
      supportedExtensions: false,
    },
  ],

  business_proposal: [
    {
      id: 'business-plan',
      name: '商业计划书',
      category: 'business_proposal',
      description: '完整的商业计划，包含市场、产品、财务等',
      icon: '💼',
      estimatedTime: '6-10分钟',
      sections: [
        {
          id: 'executive-summary',
          title: '执行摘要',
          aiPrompt: '简明扼要地概述商业计划的核心内容',
          required: true,
          order: 1,
          estimatedWords: 500,
        },
        {
          id: 'problem-solution',
          title: '问题与解决方案',
          aiPrompt: '描述市场痛点和你的解决方案',
          required: true,
          order: 2,
          estimatedWords: 600,
        },
        {
          id: 'market-opportunity',
          title: '市场机会',
          aiPrompt: '分析目标市场、市场规模、增长潜力',
          required: true,
          order: 3,
          estimatedWords: 800,
        },
        {
          id: 'product-service',
          title: '产品/服务',
          aiPrompt: '详细介绍产品或服务、核心功能、竞争优势',
          required: true,
          order: 4,
          estimatedWords: 1000,
        },
        {
          id: 'business-model',
          title: '商业模式',
          aiPrompt: '说明盈利模式、定价策略、收入来源',
          required: true,
          order: 5,
          estimatedWords: 700,
        },
        {
          id: 'team',
          title: '团队介绍',
          aiPrompt: '介绍核心团队成员、背景、专长',
          required: true,
          order: 6,
          estimatedWords: 400,
        },
        {
          id: 'financial',
          title: '财务规划',
          aiPrompt: '提供财务预测、资金需求、使用计划',
          required: true,
          order: 7,
          estimatedWords: 600,
        },
      ],
      styleGuide: {
        headingStyle: 'numbered',
        tone: 'business',
      },
      supportedExtensions: true,
    },
  ],

  presentation: [
    {
      id: 'academic-presentation',
      name: '学术演讲PPT',
      category: 'presentation',
      description: '学术会议演讲幻灯片',
      icon: '🎓',
      estimatedTime: '4-6分钟',
      sections: [
        {
          id: 'title-slide',
          title: '标题页',
          aiPrompt: '生成标题、作者、机构、日期信息',
          required: true,
          order: 1,
        },
        {
          id: 'outline',
          title: '大纲',
          aiPrompt: '列出演讲的主要内容和结构',
          required: true,
          order: 2,
        },
        {
          id: 'background',
          title: '研究背景',
          aiPrompt: '介绍研究背景、问题、意义（3-5张幻灯片）',
          required: true,
          order: 3,
        },
        {
          id: 'methodology',
          title: '研究方法',
          aiPrompt: '说明研究方法和实验设计（2-3张幻灯片）',
          required: true,
          order: 4,
        },
        {
          id: 'results',
          title: '研究结果',
          aiPrompt: '展示关键结果和数据可视化（5-7张幻灯片）',
          required: true,
          order: 5,
        },
        {
          id: 'conclusion',
          title: '结论',
          aiPrompt: '总结主要发现和未来工作（2-3张幻灯片）',
          required: true,
          order: 6,
        },
        {
          id: 'qa',
          title: 'Q&A',
          aiPrompt: '感谢页面和问答提示',
          required: false,
          order: 7,
        },
      ],
      styleGuide: {
        headingStyle: 'unnumbered',
        tone: 'academic',
      },
      supportedExtensions: true,
    },
  ],

  blog_article: [
    {
      id: 'tech-blog',
      name: '技术博客',
      category: 'blog_article',
      description: '轻松易读的技术分享文章',
      icon: '💻',
      estimatedTime: '3-5分钟',
      sections: [
        {
          id: 'introduction',
          title: '引言',
          aiPrompt: '用吸引人的方式介绍主题，引起读者兴趣',
          required: true,
          order: 1,
          estimatedWords: 200,
        },
        {
          id: 'main-content',
          title: '主要内容',
          aiPrompt: '详细讲解技术概念、实现方法、代码示例',
          required: true,
          order: 2,
          estimatedWords: 1500,
        },
        {
          id: 'best-practices',
          title: '最佳实践',
          aiPrompt: '分享使用技巧、常见陷阱、注意事项',
          required: false,
          order: 3,
          estimatedWords: 500,
        },
        {
          id: 'conclusion',
          title: '总结',
          aiPrompt: '总结要点，鼓励读者实践或进一步学习',
          required: true,
          order: 4,
          estimatedWords: 200,
        },
      ],
      styleGuide: {
        headingStyle: 'unnumbered',
        tone: 'casual',
      },
      supportedExtensions: true,
    },
  ],

  custom: [
    {
      id: 'custom-document',
      name: '自定义文档',
      category: 'custom',
      description: '自由定义结构和内容',
      icon: '✨',
      estimatedTime: '根据需求而定',
      sections: [],
      styleGuide: {
        headingStyle: 'numbered',
        tone: 'academic',
      },
      supportedExtensions: true,
    },
  ],
};

// ============================================================================
// 生成配置选项
// ============================================================================

export const GENERATION_OPTIONS = {
  detailLevel: [
    { value: 1, label: '简要', description: '简明扼要，突出重点' },
    { value: 2, label: '标准', description: '内容适中，结构完整' },
    { value: 3, label: '详细', description: '内容丰富，深入分析' },
  ],
  tone: [
    { value: 'academic', label: '学术', description: '严谨、正式、专业' },
    { value: 'business', label: '商务', description: '专业、清晰、有说服力' },
    { value: 'casual', label: '通俗', description: '轻松、易读、亲切' },
    { value: 'technical', label: '技术', description: '精确、详细、专业' },
  ],
  extensionOptions: [
    {
      id: 'searchImages',
      label: '搜索相关图片',
      description: '自动查找高质量配图',
    },
    {
      id: 'fetchData',
      label: '获取最新数据',
      description: '从权威来源获取统计数据',
    },
    {
      id: 'citePapers',
      label: '引用学术论文',
      description: '补充相关研究文献',
    },
    {
      id: 'findReports',
      label: '查找分析报告',
      description: '获取行业分析和研究报告',
    },
  ],
};
