import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { documentExportService } from '../../services/document-export.service';

interface ExportDocumentDto {
  documentId?: string;
  format: 'word' | 'ppt' | 'pdf' | 'markdown';
  content: string;
  title: string;
}

@Controller('ai-office')
export class AiOfficeController {
  @Post('export')
  async exportDocument(
    @Body() dto: ExportDocumentDto,
    @Res() res: Response,
  ) {
    try {
      const { format, content, title } = dto;

      // 验证必填字段
      if (!format || !content || !title) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: 'Missing required fields: format, content, title',
        });
      }

      // 验证格式
      const validFormats = ['word', 'ppt', 'pdf', 'markdown'];
      if (!validFormats.includes(format)) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: `Invalid format. Supported formats: ${validFormats.join(', ')}`,
        });
      }

      // 调用导出服务
      const buffer = await documentExportService.exportDocument({
        title,
        content,
        format,
      });

      // 设置响应头
      const contentType =
        format === 'word'
          ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          : format === 'ppt'
          ? 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
          : format === 'pdf'
          ? 'application/pdf'
          : 'text/markdown';

      const filename =
        format === 'word'
          ? `${title}.docx`
          : format === 'ppt'
          ? `${title}.pptx`
          : format === 'pdf'
          ? `${title}.pdf`
          : `${title}.md`;

      res.setHeader('Content-Type', contentType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(filename)}"`,
      );
      return res.send(buffer);
    } catch (error) {
      console.error('Export error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
