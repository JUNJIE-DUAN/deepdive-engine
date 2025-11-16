/**
 * PPT模板配置
 * 参考业界最佳实践：Genspark, Gamma, Canva, Adobe Express
 * V2.0 - 增强版：深色主题 + 卡片式布局 + 丰富装饰元素
 */

export interface PPTTemplate {
  id: string;
  name: string;
  nameCn: string;
  description: string;
  descriptionCn: string;
  category: 'corporate' | 'minimal' | 'modern' | 'creative' | 'academic';
  // 增强的颜色体系 - 支持深色主题和多层次文字
  colors: {
    primary: string; // 主色
    secondary: string; // 辅色
    accent: string; // 强调色
    background: string; // 背景色
    backgroundOverlay?: string; // 背景覆盖层（半透明渐变）
    text: string; // 主文字色
    textLight: string; // 浅色文字（用于深色背景）
    textSecondary: string; // 次要文字
    textTertiary: string; // 三级文字（最浅）
    decorative: string; // 装饰色（装饰条、强调线等）
    cardBackground?: string; // 卡片背景色
  };
  fonts: {
    heading: string; // 标题字体
    body: string; // 正文字体
  };
  // 文字大小层次体系（单位：pt）
  typography: {
    title: number; // 主标题 (26-36pt)
    subtitle: number; // 副标题 (18-24pt)
    heading1: number; // 一级标题 (16pt)
    heading2: number; // 二级标题 (13-15pt)
    body: number; // 正文 (12pt)
    caption: number; // 说明文字 (10-11pt)
    small: number; // 小字/页码 (9pt)
  };
  // 装饰元素配置
  decorations: {
    showTopBar: boolean; // 顶部装饰条
    showBottomBar: boolean; // 底部装饰条
    showTitleUnderline: boolean; // 标题下划线
    showCardBorder: boolean; // 卡片左侧边框
    useCardLayout: boolean; // 使用卡片式布局
  };
  style: {
    borderRadius: string; // 圆角大小
    spacing: 'compact' | 'normal' | 'spacious'; // 间距
    imageStyle: 'rounded' | 'sharp' | 'circle'; // 图片样式
    layoutStyle: 'light' | 'dark'; // 明暗风格
  };
}

/**
 * 预定义模板库
 */
export const PPT_TEMPLATES: Record<string, PPTTemplate> = {
  // 1. 企业商务模板 - 专业深色 Genspark风格
  corporate: {
    id: 'corporate',
    name: 'Corporate Professional',
    nameCn: '企业商务',
    description: 'Professional dark theme inspired by Genspark',
    descriptionCn: '专业深色风格，适合商务演示、财务报告、企业汇报',
    category: 'corporate',
    colors: {
      primary: '#0A2B4E', // 深海军蓝 (Genspark背景色)
      secondary: '#164577', // 中蓝
      accent: '#3B82F6', // 亮蓝色强调
      background: '#0A2B4E', // 深色背景
      backgroundOverlay: 'rgba(22, 69, 119, 0.5)', // 半透明覆盖层
      text: '#E5E7EB', // 浅灰正文
      textLight: '#FFFFFF', // 白色标题
      textSecondary: '#93C5FD', // 浅蓝副标题
      textTertiary: '#9CA3AF', // 灰色次要文字
      decorative: '#3B82F6', // 蓝色装饰
      cardBackground: 'rgba(255, 255, 255, 0.1)', // 10%透明白色卡片
    },
    fonts: {
      heading: 'Noto Sans SC, Inter, system-ui, sans-serif',
      body: 'Noto Sans SC, Inter, system-ui, sans-serif',
    },
    typography: {
      title: 36, // 主标题
      subtitle: 22, // 副标题
      heading1: 16, // 一级标题
      heading2: 15, // 二级标题
      body: 12, // 正文
      caption: 11, // 说明
      small: 10, // 小字
    },
    decorations: {
      showTopBar: false,
      showBottomBar: true, // 底部蓝色装饰条
      showTitleUnderline: true, // 标题下划线
      showCardBorder: true, // 卡片左侧边框
      useCardLayout: true, // 使用卡片布局
    },
    style: {
      borderRadius: '8px',
      spacing: 'normal',
      imageStyle: 'rounded',
      layoutStyle: 'dark', // 深色风格
    },
  },

  // 2. 简约现代模板 - 黑白极简
  minimal: {
    id: 'minimal',
    name: 'Minimal Clean',
    nameCn: '简约现代',
    description: 'Clean monochrome design with minimal distractions',
    descriptionCn: '黑白极简，适合产品发布、设计展示、创意提案',
    category: 'minimal',
    colors: {
      primary: '#000000', // 纯黑
      secondary: '#374151', // 深灰
      accent: '#10B981', // 翠绿强调
      background: '#FFFFFF', // 白色背景
      backgroundOverlay: 'rgba(0, 0, 0, 0.02)', // 微妙灰色覆盖
      text: '#111827', // 深灰黑
      textLight: '#FFFFFF', // 白色
      textSecondary: '#6B7280', // 中灰
      textTertiary: '#9CA3AF', // 浅灰
      decorative: '#000000', // 黑色装饰
      cardBackground: 'rgba(0, 0, 0, 0.03)', // 浅灰卡片
    },
    fonts: {
      heading: 'system-ui, -apple-system, sans-serif',
      body: 'system-ui, -apple-system, sans-serif',
    },
    typography: {
      title: 40,
      subtitle: 24,
      heading1: 18,
      heading2: 14,
      body: 12,
      caption: 10,
      small: 9,
    },
    decorations: {
      showTopBar: false,
      showBottomBar: false,
      showTitleUnderline: false,
      showCardBorder: true, // 细黑色左边框
      useCardLayout: false, // 极简不用卡片
    },
    style: {
      borderRadius: '2px', // 极小圆角
      spacing: 'spacious',
      imageStyle: 'sharp', // 锐利边缘
      layoutStyle: 'light',
    },
  },

  // 3. 现代渐变模板 - 时尚活力
  modern: {
    id: 'modern',
    name: 'Modern Gradient',
    nameCn: '现代渐变',
    description: 'Contemporary design with vibrant gradients',
    descriptionCn: '现代时尚，适合科技产品、创业路演、趋势分析',
    category: 'modern',
    colors: {
      primary: '#6366F1', // 靛蓝
      secondary: '#8B5CF6', // 紫色
      accent: '#EC4899', // 粉红
      background: '#F9FAFB', // 浅灰背景
      backgroundOverlay:
        'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))',
      text: '#1F2937', // 深灰
      textLight: '#FFFFFF', // 白色
      textSecondary: '#8B5CF6', // 紫色
      textTertiary: '#9CA3AF', // 浅灰
      decorative: '#6366F1', // 靛蓝装饰
      cardBackground: 'rgba(255, 255, 255, 0.8)', // 半透明白卡片
    },
    fonts: {
      heading: 'Poppins, Inter, sans-serif',
      body: 'Inter, system-ui, sans-serif',
    },
    typography: {
      title: 38,
      subtitle: 22,
      heading1: 17,
      heading2: 14,
      body: 12,
      caption: 11,
      small: 9,
    },
    decorations: {
      showTopBar: true, // 渐变顶部条
      showBottomBar: false,
      showTitleUnderline: false,
      showCardBorder: true, // 渐变左边框
      useCardLayout: true,
    },
    style: {
      borderRadius: '12px',
      spacing: 'normal',
      imageStyle: 'rounded',
      layoutStyle: 'light',
    },
  },

  // 4. 创意活泼模板 - 多彩个性
  creative: {
    id: 'creative',
    name: 'Creative Vibrant',
    nameCn: '创意活泼',
    description: 'Colorful and expressive design',
    descriptionCn: '色彩丰富，适合创意设计、营销策划、品牌宣传',
    category: 'creative',
    colors: {
      primary: '#F59E0B', // 橙色
      secondary: '#EF4444', // 红色
      accent: '#8B5CF6', // 紫色
      background: '#FFFBEB', // 浅黄背景
      backgroundOverlay: 'rgba(245, 158, 11, 0.05)',
      text: '#1F2937', // 深灰
      textLight: '#FFFFFF', // 白色
      textSecondary: '#F59E0B', // 橙色
      textTertiary: '#9CA3AF', // 浅灰
      decorative: '#EF4444', // 红色装饰
      cardBackground: 'rgba(255, 255, 255, 0.9)',
    },
    fonts: {
      heading: 'Montserrat, sans-serif',
      body: 'Open Sans, sans-serif',
    },
    typography: {
      title: 36,
      subtitle: 20,
      heading1: 16,
      heading2: 14,
      body: 12,
      caption: 10,
      small: 9,
    },
    decorations: {
      showTopBar: true,
      showBottomBar: true, // 多彩装饰条
      showTitleUnderline: true,
      showCardBorder: true,
      useCardLayout: true,
    },
    style: {
      borderRadius: '16px', // 大圆角
      spacing: 'normal',
      imageStyle: 'rounded',
      layoutStyle: 'light',
    },
  },

  // 5. 学术专业模板 - 严谨清晰
  academic: {
    id: 'academic',
    name: 'Academic Professional',
    nameCn: '学术专业',
    description: 'Formal design for academic presentations',
    descriptionCn: '严谨清晰，适合学术报告、研究成果、教学演示',
    category: 'academic',
    colors: {
      primary: '#1E3A8A', // 深蓝
      secondary: '#0F766E', // 青色
      accent: '#059669', // 绿色
      background: '#FFFFFF', // 白色背景
      backgroundOverlay: 'rgba(30, 58, 138, 0.02)',
      text: '#374151', // 深灰
      textLight: '#FFFFFF', // 白色
      textSecondary: '#1E3A8A', // 深蓝
      textTertiary: '#9CA3AF', // 浅灰
      decorative: '#1E3A8A', // 深蓝装饰
      cardBackground: 'rgba(30, 58, 138, 0.05)', // 浅蓝卡片
    },
    fonts: {
      heading: 'Georgia, serif',
      body: 'system-ui, sans-serif',
    },
    typography: {
      title: 34,
      subtitle: 20,
      heading1: 16,
      heading2: 14,
      body: 12,
      caption: 10,
      small: 9,
    },
    decorations: {
      showTopBar: false,
      showBottomBar: true, // 细蓝色底部线
      showTitleUnderline: true,
      showCardBorder: false,
      useCardLayout: false, // 学术风格不用卡片
    },
    style: {
      borderRadius: '4px',
      spacing: 'normal',
      imageStyle: 'sharp',
      layoutStyle: 'light',
    },
  },

  // 6. 科技蓝模板 - 科技专业
  tech: {
    id: 'tech',
    name: 'Tech Blue',
    nameCn: '科技蓝',
    description: 'Modern tech-focused blue design',
    descriptionCn: '科技感十足，适合技术分享、产品演示、数据分析',
    category: 'modern',
    colors: {
      primary: '#0EA5E9', // 天蓝
      secondary: '#0284C7', // 深蓝
      accent: '#06B6D4', // 青色
      background: '#F8FAFC', // 浅蓝灰
      backgroundOverlay: 'rgba(14, 165, 233, 0.05)',
      text: '#0F172A', // 深蓝黑
      textLight: '#FFFFFF', // 白色
      textSecondary: '#0EA5E9', // 天蓝
      textTertiary: '#64748B', // 灰蓝
      decorative: '#06B6D4', // 青色装饰
      cardBackground: 'rgba(255, 255, 255, 0.8)',
    },
    fonts: {
      heading: 'Roboto, sans-serif',
      body: 'Roboto, sans-serif',
    },
    typography: {
      title: 36,
      subtitle: 22,
      heading1: 16,
      heading2: 14,
      body: 12,
      caption: 10,
      small: 9,
    },
    decorations: {
      showTopBar: true, // 蓝色顶部线
      showBottomBar: false,
      showTitleUnderline: true,
      showCardBorder: true,
      useCardLayout: true,
    },
    style: {
      borderRadius: '8px',
      spacing: 'normal',
      imageStyle: 'rounded',
      layoutStyle: 'light',
    },
  },
};

/**
 * 获取所有模板列表
 */
export function getAllTemplates(): PPTTemplate[] {
  return Object.values(PPT_TEMPLATES);
}

/**
 * 根据ID获取模板
 */
export function getTemplateById(id: string): PPTTemplate {
  return PPT_TEMPLATES[id] || PPT_TEMPLATES.corporate;
}

/**
 * 根据类别获取模板
 */
export function getTemplatesByCategory(
  category: PPTTemplate['category']
): PPTTemplate[] {
  return getAllTemplates().filter((template) => template.category === category);
}

/**
 * 获取模板的CSS样式
 */
export function getTemplateStyles(template: PPTTemplate): string {
  return `
    --template-primary: ${template.colors.primary};
    --template-secondary: ${template.colors.secondary};
    --template-accent: ${template.colors.accent};
    --template-background: ${template.colors.background};
    --template-text: ${template.colors.text};
    --template-text-light: ${template.colors.textLight};
    --template-font-heading: ${template.fonts.heading};
    --template-font-body: ${template.fonts.body};
    --template-border-radius: ${template.style.borderRadius};
  `;
}
