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
import TurndownService from "turndown";

interface ExportOptions {
  title: string;
  content: string; // HTML 或 Markdown
  format: "word" | "ppt" | "pdf" | "markdown";
}

class DocumentExportService {
  private turndownService: TurndownService;

  constructor() {
    this.turndownService = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
    });
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

    // 将 HTML 转换为 Markdown（简化处理）
    const markdown = this.htmlToMarkdown(content);

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
   * 导出为 PPT
   */
  private async exportToPPT(options: ExportOptions): Promise<Buffer> {
    const { title, content } = options;
    const pptx = new PptxGenJS();

    // 设置文档属性
    pptx.author = "AI Office";
    pptx.company = "DeepDive Engine";
    pptx.title = title;

    // 将 HTML 转换为 Markdown
    const markdown = this.htmlToMarkdown(content);

    // 解析 Markdown 并创建幻灯片
    const slides = this.markdownToSlides(markdown);

    // 添加标题幻灯片
    const titleSlide = pptx.addSlide();
    titleSlide.background = { color: "0088CC" };
    titleSlide.addText(title, {
      x: 0.5,
      y: "40%",
      w: "90%",
      fontSize: 44,
      bold: true,
      color: "FFFFFF",
      align: "center",
    });
    titleSlide.addText("AI Office 生成", {
      x: 0.5,
      y: "55%",
      w: "90%",
      fontSize: 18,
      color: "FFFFFF",
      align: "center",
    });

    // 添加内容幻灯片
    slides.forEach((slideContent) => {
      const slide = pptx.addSlide();
      slide.background = { color: "FFFFFF" };

      // 添加标题
      if (slideContent.title) {
        slide.addText(slideContent.title, {
          x: 0.5,
          y: 0.5,
          w: "90%",
          fontSize: 32,
          bold: true,
          color: "363636",
        });
      }

      // 添加内容
      if (slideContent.content && slideContent.content.length > 0) {
        const contentY = slideContent.title ? 1.5 : 0.5;
        // Join array of strings into a single string with line breaks
        const contentText = Array.isArray(slideContent.content)
          ? slideContent.content.join("\n")
          : slideContent.content;
        slide.addText(contentText, {
          x: 0.5,
          y: contentY,
          w: "90%",
          h: "70%",
          fontSize: 18,
          color: "363636",
          valign: "top",
        });
      }
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

    // 将 HTML 转换为 Markdown
    const markdown = this.htmlToMarkdown(content);

    // 添加标题
    const fullMarkdown = `# ${title}\n\n${markdown}`;

    return Buffer.from(fullMarkdown, "utf-8");
  }

  /**
   * 将 HTML 转换为 Markdown
   */
  private htmlToMarkdown(html: string): string {
    return this.turndownService.turndown(html);
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
   */
  private markdownToSlides(markdown: string): Array<{
    title?: string;
    content: string[];
  }> {
    const slides: Array<{ title?: string; content: string[] }> = [];
    let currentSlide: { title?: string; content: string[] } = { content: [] };

    const lines = markdown.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();

      // H1 或 H2 标题创建新幻灯片
      if (trimmed.startsWith("# ") || trimmed.startsWith("## ")) {
        // 保存当前幻灯片
        if (currentSlide.title || currentSlide.content.length > 0) {
          slides.push(currentSlide);
        }

        // 创建新幻灯片
        const title = trimmed.replace(/^#+\s*/, "");
        currentSlide = { title, content: [] };
      }
      // 其他内容添加到当前幻灯片
      else if (trimmed) {
        currentSlide.content.push(trimmed.replace(/^[-*]\s*/, "• "));
      }
    }

    // 添加最后一个幻灯片
    if (currentSlide.title || currentSlide.content.length > 0) {
      slides.push(currentSlide);
    }

    return slides;
  }
}

// 单例导出
export const documentExportService = new DocumentExportService();
