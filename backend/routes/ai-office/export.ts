import express from 'express';
import { documentExportService } from '../../services/document-export.service';

const router = express.Router();

/**
 * POST /api/v1/ai-office/export
 * 导出文档为各种格式
 */
router.post('/', async (req, res) => {
  try {
    const { documentId, format, content, title } = req.body;

    if (!format || !content || !title) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: format, content, title',
      });
    }

    // 验证格式
    const validFormats = ['word', 'ppt', 'pdf', 'markdown'];
    if (!validFormats.includes(format)) {
      return res.status(400).json({
        success: false,
        error: `Invalid format. Supported formats: ${validFormats.join(', ')}`,
      });
    }

    // 调用导出服务
    const buffer = await documentExportService.exportDocument({
      title,
      content,
      format: format as 'word' | 'ppt' | 'pdf' | 'markdown',
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
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
