/**
 * 文档导出服务
 * 支持导出为 Word、PPT、PDF、Markdown 等格式
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";
import PptxGenJS from "pptxgenjs";
// @ts-ignore - turndown types not available
import TurndownService from "turndown";

interface PPTTemplate {
  id: string;
  name: string;
  nameCn: string;
  description: string;
  descriptionCn: string;
  category: "corporate" | "minimal" | "modern" | "creative" | "academic";
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    backgroundOverlay?: string;
    text: string;
    textLight: string;
    textSecondary: string;
    textTertiary: string;
    decorative: string;
    cardBackground?: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  typography: {
    title: number;
    heading1: number;
    heading2: number;
    body: number;
    caption: number;
    small: number;
  };
  decorations: {
    showTopBar: boolean;
    showBottomBar: boolean;
    showTitleUnderline: boolean;
    showCardBorder: boolean;
    useCardLayout: boolean;
  };
  style: {
    borderRadius: string;
    spacing: "compact" | "normal" | "spacious";
    imageStyle: "rounded" | "sharp" | "circle";
    layoutStyle: "light" | "dark";
  };
}

// 默认模板配置（与前端保持一致）
const defaultTemplates: Record<string, PPTTemplate> = {
  corporate: {
    id: "corporate",
    name: "Corporate Professional",
    nameCn: "企业商务",
    description: "Professional dark theme inspired by Genspark",
    descriptionCn: "专业深色风格，适合商务演示、财务报告、企业汇报",
    category: "corporate",
    colors: {
      primary: "#0A2B4E",
      secondary: "#164577",
      accent: "#3B82F6",
      background: "#0A2B4E",
      backgroundOverlay: "rgba(22, 69, 119, 0.5)",
      text: "#E5E7EB",
      textLight: "#FFFFFF",
      textSecondary: "#93C5FD",
      textTertiary: "#9CA3AF",
      decorative: "#3B82F6",
      cardBackground: "rgba(255, 255, 255, 0.1)",
    },
    fonts: {
      heading: "Noto Sans SC, Inter, system-ui, sans-serif",
      body: "Noto Sans SC, Inter, system-ui, sans-serif",
    },
    typography: {
      title: 36,
      heading1: 16,
      heading2: 15,
      body: 12,
      caption: 11,
      small: 10,
    },
    decorations: {
      showTopBar: false,
      showBottomBar: true,
      showTitleUnderline: true,
      showCardBorder: true,
      useCardLayout: true,
    },
    style: {
      borderRadius: "8px",
      spacing: "normal",
      imageStyle: "rounded",
      layoutStyle: "dark",
    },
  },
};

function getTemplateById(id: string): PPTTemplate {
  return defaultTemplates[id] || defaultTemplates.corporate;
}

interface ExportOptions {
  title: string;
  content: string; // HTML 或 Markdown
  format: "word" | "ppt" | "pdf" | "markdown";
  template?: PPTTemplate; // 可选的模板配置
}

class DocumentExportService {
  // private turndownService: TurndownService;

  constructor() {
    // this.turndownService = new TurndownService({
    //   headingStyle: 'atx',
    //   codeBlockStyle: 'fenced',
    // });
  }

  /**
   * 导出文档
   * @param options 导出选项
   * @returns 导出的文件 buffer
   */
  async exportDocument(options: ExportOptions): Promise<Buffer> {
    switch (options.format) {
      case "word":
        return this.exportToWord(options);
      case "ppt":
        return this.exportToPPT(options);
      case "pdf":
        return this.exportToPDF(options);
      case "markdown":
        return this.exportToMarkdown(options);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * 导出为 Word 文档
   */
  private async exportToWord(options: ExportOptions): Promise<Buffer> {
    const { title, content } = options;

    // content已经是Markdown格式，直接使用
    const markdown = content;

    // 解析 Markdown 并创建 Word 文档
    const paragraphs = this.markdownToDocxParagraphs(markdown, title);

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: paragraphs,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    return buffer;
  }

  /**
   * 导出为 PPT - V2.0 专业模板系统
   */
  private async exportToPPT(options: ExportOptions): Promise<Buffer> {
    const { title, content, template: templateOption } = options;
    const pptx = new PptxGenJS();

    // 设置文档属性
    pptx.author = "AI Office";
    pptx.company = "DeepDive Engine";
    pptx.title = title;

    // 获取完整模板配置
    const templateId = templateOption?.id || "corporate";
    const template = getTemplateById(templateId);

    // 获取模板颜色（移除#前缀，PPTXGenJS需要6位十六进制）
    const bgColor = template.colors.background.replace("#", "");
    const primaryColor = template.colors.primary.replace("#", "");
    const secondaryColor = template.colors.secondary.replace("#", "");
    const accentColor = template.colors.decorative.replace("#", "");
    const textColor = template.colors.text.replace("#", "");
    const textLightColor = template.colors.textLight.replace("#", "");
    const textSecondaryColor = template.colors.textSecondary.replace("#", "");
    const textTertiaryColor = template.colors.textTertiary.replace("#", "");

    // content已经是Markdown格式，直接使用
    const markdown = content;

    // 解析 Markdown 并创建幻灯片
    const slides = this.markdownToSlides(markdown);

    // 添加标题幻灯片（应用模板配置）
    const titleSlide = pptx.addSlide();
    titleSlide.background = { color: bgColor };

    // 顶部装饰条
    if (template.decorations.showTopBar) {
      titleSlide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 0,
        w: "100%",
        h: 0.08,
        fill: { color: accentColor },
        line: { type: "none" },
      });
    }

    // 底部装饰条
    if (template.decorations.showBottomBar) {
      titleSlide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 7.42,
        w: "100%",
        h: 0.08,
        fill: { color: accentColor },
        line: { type: "none" },
      });
    }

    titleSlide.addText(title, {
      x: 0.5,
      y: "40%",
      w: "90%",
      fontSize: template.typography.title,
      bold: true,
      color:
        template.style.layoutStyle === "dark" ? textLightColor : primaryColor,
      align: "center",
      fontFace: template.fonts.heading,
    });
    titleSlide.addText(`AI Office 生成 · ${template.nameCn}风格`, {
      x: 0.5,
      y: "55%",
      w: "90%",
      fontSize: template.typography.caption,
      color:
        template.style.layoutStyle === "dark"
          ? textSecondaryColor
          : textTertiaryColor,
      align: "center",
      fontFace: template.fonts.body,
    });

    // 添加内容幻灯片（应用完整模板系统）
    slides.forEach((slideContent, index) => {
      const slide = pptx.addSlide();

      // 背景颜色
      slide.background = { color: bgColor };

      // 顶部装饰条
      if (template.decorations.showTopBar) {
        slide.addShape(pptx.ShapeType.rect, {
          x: 0,
          y: 0,
          w: "100%",
          h: 0.08,
          fill: { color: accentColor },
          line: { type: "none" },
        });
      }

      // 底部装饰条
      if (template.decorations.showBottomBar) {
        slide.addShape(pptx.ShapeType.rect, {
          x: 0,
          y: 7.42,
          w: "100%",
          h: 0.08,
          fill: { color: accentColor },
          line: { type: "none" },
        });
      }

      // 半透明右侧覆盖层（深色主题专用，Genspark风格）
      if (
        template.style.layoutStyle === "dark" &&
        template.colors.backgroundOverlay &&
        !template.colors.backgroundOverlay.startsWith("linear")
      ) {
        const overlayColor = template.colors.backgroundOverlay;
        // 提取rgba值并转换为透明度百分比
        const alphaMatch = overlayColor.match(
          /rgba?\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/,
        );
        const alpha = alphaMatch
          ? Math.round(parseFloat(alphaMatch[1]) * 100)
          : 50;

        slide.addShape(pptx.ShapeType.rect, {
          x: "33%",
          y: 0,
          w: "67%",
          h: "100%",
          fill: {
            color: secondaryColor,
            transparency: 100 - alpha,
          },
          line: { type: "none" },
        });
      }

      const startY = template.decorations.showTopBar ? 0.6 : 0.5;

      // 添加标题
      if (slideContent.title) {
        slide.addText(slideContent.title, {
          x: 0.5,
          y: startY,
          w: "90%",
          fontSize: template.typography.heading1 * 2, // PPT中需要更大的字号
          bold: true,
          color:
            template.style.layoutStyle === "dark"
              ? textLightColor
              : primaryColor,
          fontFace: template.fonts.heading,
        });

        // 标题下划线
        if (template.decorations.showTitleUnderline) {
          slide.addShape(pptx.ShapeType.rect, {
            x: 0.5,
            y: startY + 0.35,
            w: 0.8,
            h: 0.04,
            fill: { color: accentColor },
            line: { type: "none" },
          });
        }
      }

      // 添加内容（卡片布局或普通布局）
      if (slideContent.content && slideContent.content.length > 0) {
        const contentY = slideContent.title
          ? template.decorations.showTitleUnderline
            ? startY + 0.7
            : startY + 0.5
          : startY;

        // 处理内容文本，移除Markdown符号
        const processedContent = slideContent.content.map((line) => {
          // 移除列表符号
          let text = line.replace(/^[-•*]\s*/, "");
          // 移除加粗符号
          text = text.replace(/\*\*(.+?)\*\*/g, "$1");
          // 移除斜体符号
          text = text.replace(/\*(.+?)\*/g, "$1");
          return text;
        });

        if (template.decorations.useCardLayout) {
          // 卡片布局：为每个内容项创建卡片容器
          const cardHeight = 0.6;
          const cardSpacing = 0.15;
          const maxCards = Math.min(processedContent.length, 5); // 最多显示5个卡片

          for (let i = 0; i < maxCards; i++) {
            const cardY = contentY + i * (cardHeight + cardSpacing);

            // 卡片背景（半透明白色）
            if (template.colors.cardBackground) {
              const cardBgMatch = template.colors.cardBackground.match(
                /rgba?\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/,
              );
              const cardAlpha = cardBgMatch
                ? Math.round(parseFloat(cardBgMatch[1]) * 100)
                : 10;

              slide.addShape(pptx.ShapeType.rect, {
                x: 0.5,
                y: cardY,
                w: 9,
                h: cardHeight,
                fill: {
                  color: "FFFFFF",
                  transparency: 100 - cardAlpha,
                },
                line: { type: "none" },
              });
            }

            // 卡片左侧蓝色边框
            if (template.decorations.showCardBorder) {
              slide.addShape(pptx.ShapeType.rect, {
                x: 0.5,
                y: cardY,
                w: 0.08,
                h: cardHeight,
                fill: { color: accentColor },
                line: { type: "none" },
              });
            }

            // 卡片内容文本
            slide.addText(processedContent[i], {
              x: 0.8,
              y: cardY + 0.15,
              w: 8.4,
              h: cardHeight - 0.3,
              fontSize: template.typography.body + 2,
              color:
                template.style.layoutStyle === "dark"
                  ? textColor
                  : textColor.replace("E5E7EB", "1F2937"),
              fontFace: template.fonts.body,
              valign: "middle",
            });
          }
        } else {
          // 普通列表布局
          const contentText = processedContent
            .map((line) => `• ${line}`)
            .join("\n");
          slide.addText(contentText, {
            x: 0.5,
            y: contentY,
            w: "90%",
            h: 5,
            fontSize: template.typography.body + 2,
            color:
              template.style.layoutStyle === "dark"
                ? textColor
                : textColor.replace("E5E7EB", "1F2937"),
            fontFace: template.fonts.body,
            valign: "top",
          });
        }
      }

      // 添加页码（右下角，使用次要颜色）
      slide.addText(`${index + 1}`, {
        x: "92%",
        y: "90%",
        w: "6%",
        h: "6%",
        fontSize: template.typography.caption,
        color:
          template.style.layoutStyle === "dark"
            ? textSecondaryColor
            : secondaryColor,
        align: "right",
        fontFace: template.fonts.body,
      });
    });

    // 生成 PPT buffer
    const buffer = await pptx.write({ outputType: "nodebuffer" });
    return buffer as Buffer;
  }

  /**
   * 导出为 PDF
   */
  private async exportToPDF(options: ExportOptions): Promise<Buffer> {
    // PDF 导出需要使用 puppeteer 或其他 PDF 生成库
    // 这里暂时返回 HTML 内容的简单实现
    const { content } = options;

    // 简单实现：返回 HTML 内容作为文本
    // 实际应该使用 puppeteer 将 HTML 渲染为 PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${options.title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
            h1, h2, h3 { color: #333; }
            code { background: #f4f4f4; padding: 2px 5px; }
            pre { background: #f4f4f4; padding: 15px; overflow-x: auto; }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `;

    return Buffer.from(htmlContent, "utf-8");
  }

  /**
   * 导出为 Markdown
   */
  private async exportToMarkdown(options: ExportOptions): Promise<Buffer> {
    const { title, content } = options;

    // content已经是Markdown格式，直接使用
    const markdown = content;

    // 添加标题
    const fullMarkdown = `# ${title}\n\n${markdown}`;

    return Buffer.from(fullMarkdown, "utf-8");
  }

  /**
   * 将 Markdown 转换为 Word 段落
   */
  private markdownToDocxParagraphs(
    markdown: string,
    title: string,
  ): Paragraph[] {
    const paragraphs: Paragraph[] = [];

    // 添加标题
    paragraphs.push(
      new Paragraph({
        text: title,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
    );

    // 解析 Markdown 内容
    const lines = markdown.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (!line) {
        // 空行
        paragraphs.push(new Paragraph({ text: "" }));
        continue;
      }

      // 标题
      if (line.startsWith("#")) {
        const level = line.match(/^#+/)?.[0].length || 1;
        const text = line.replace(/^#+\s*/, "");

        const headingLevel =
          level === 1
            ? HeadingLevel.HEADING_1
            : level === 2
              ? HeadingLevel.HEADING_2
              : HeadingLevel.HEADING_3;

        paragraphs.push(
          new Paragraph({
            text,
            heading: headingLevel,
            spacing: { before: 240, after: 120 },
          }),
        );
      }
      // 列表项
      else if (line.startsWith("- ") || line.startsWith("* ")) {
        const text = line.replace(/^[-*]\s*/, "");
        paragraphs.push(
          new Paragraph({
            text: `• ${text}`,
            bullet: { level: 0 },
          }),
        );
      }
      // 普通段落
      else {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun(line)],
            spacing: { after: 120 },
          }),
        );
      }
    }

    return paragraphs;
  }

  /**
   * 将 Markdown 转换为幻灯片内容
   * 与 DocumentEditor 的 parseMarkdownToSlides 逻辑保持一致
   */
  private markdownToSlides(markdown: string): Array<{
    title?: string;
    content: string[];
  }> {
    const slides: Array<{ title?: string; content: string[] }> = [];
    let currentSlide: { title?: string; content: string[] } | null = null;

    const lines = markdown.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();

      // 检测幻灯片标题（支持多种格式）
      // ### Slide 1, ## 第X页, #### 第X页, ### 封面, ## Slide X: 标题
      const slideHeaderMatch = trimmed.match(
        /^#{2,4}\s*(Slide\s*\d+|第\s*\d+\s*[页页]|封面|目录|.*页[:：])/i,
      );

      if (slideHeaderMatch) {
        if (currentSlide) {
          slides.push(currentSlide);
        }
        // 提取标题（冒号后的内容，或整个标题）
        const titleMatch =
          trimmed.match(/[:：]\s*(.+)/) || trimmed.match(/^#{2,4}\s*(.+)/);
        currentSlide = {
          title: titleMatch
            ? titleMatch[1].trim()
            : trimmed.replace(/^#{2,4}\s*/, ""),
          content: [],
        };
      } else if (trimmed === "---") {
        // 分隔符，开始新幻灯片
        if (currentSlide) {
          slides.push(currentSlide);
          currentSlide = null;
        }
      } else if (currentSlide && trimmed) {
        // 跳过图片标记，只添加文本内容
        const imageMatch = trimmed.match(/!\[.*?\]\((.+?)\)/);
        if (!imageMatch) {
          // 添加内容行（不在这里移除列表符号，保留原始格式）
          currentSlide.content.push(trimmed);
        }
      } else if (
        !currentSlide &&
        trimmed &&
        !trimmed.startsWith("#") &&
        trimmed !== "---"
      ) {
        // 如果还没有幻灯片，创建第一张
        currentSlide = {
          title: "Slide " + (slides.length + 1),
          content: [trimmed],
        };
      }
    }

    if (currentSlide) {
      slides.push(currentSlide);
    }

    return slides;
  }
}

// 单例导出
export const documentExportService = new DocumentExportService();
