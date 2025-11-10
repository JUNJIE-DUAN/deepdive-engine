import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { GenerateReportDto } from './dto/generate-report.dto';
import axios from 'axios';

interface ReportSection {
  title: string;
  content: string;
}

interface AIReportResponse {
  title: string;
  summary: string;
  sections: ReportSection[];
  metadata?: Record<string, any>;
}

interface TemplateConfig {
  name: string;
  icon: string;
  model: string;
}

const TEMPLATE_CONFIG: Record<string, TemplateConfig> = {
  comparison: {
    name: '对比分析',
    icon: '📊',
    model: 'gpt-4',
  },
  trend: {
    name: '趋势报告',
    icon: '📈',
    model: 'grok',
  },
  'learning-path': {
    name: '学习路径',
    icon: '🗺️',
    model: 'grok',
  },
  'literature-review': {
    name: '文献综述',
    icon: '📝',
    model: 'gpt-4',
  },
};

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 生成报告
   */
  async generateReport(dto: GenerateReportDto) {
    // 1. 验证资源数量
    if (dto.resourceIds.length < 2 || dto.resourceIds.length > 10) {
      throw new BadRequestException('Please select 2-10 resources');
    }

    // 2. 获取资源详情
    const resources = await this.prisma.resource.findMany({
      where: {
        id: {
          in: dto.resourceIds,
        },
      },
      select: {
        id: true,
        type: true,
        title: true,
        abstract: true,
        authors: true,
        publishedAt: true,
        tags: true,
        pdfUrl: true,
        sourceUrl: true,
      },
    });

    if (resources.length !== dto.resourceIds.length) {
      throw new BadRequestException('Some resources not found');
    }

    // 3. 获取模板配置
    const templateConfig = TEMPLATE_CONFIG[dto.template];
    if (!templateConfig) {
      throw new BadRequestException('Invalid template');
    }

    // 4. 调用AI服务生成报告
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:5000';
    const model = dto.model || templateConfig.model;

    let aiReport: AIReportResponse;
    try {
      const response = await axios.post(`${aiServiceUrl}/api/v1/ai/generate-report`, {
        resources: resources.map((r: typeof resources[0]) => ({
          id: r.id,
          title: r.title,
          abstract: r.abstract,
          authors: r.authors,
          published_date: r.publishedAt,
          tags: r.tags,
          type: r.type,
        })),
        template: dto.template,
        model,
      }, {
        timeout: 120000, // 2 minutes timeout
      });

      aiReport = response.data;
    } catch (error) {
      console.error('AI service error:', error);
      throw new BadRequestException('Failed to generate report. Please try again.');
    }

    // 5. 保存报告到数据库
    const report = await this.prisma.report.create({
      data: {
        userId: dto.userId,
        title: aiReport.title,
        template: dto.template,
        templateName: templateConfig.name,
        templateIcon: templateConfig.icon,
        summary: aiReport.summary,
        sections: aiReport.sections as any,
        resourceIds: dto.resourceIds as any,
        resourceCount: dto.resourceIds.length,
        metadata: {
          model,
          generatedAt: new Date().toISOString(),
          ...aiReport.metadata,
        } as any,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return report;
  }

  /**
   * 获取单个报告
   */
  async findOne(id: string, userId?: string) {
    const report = await this.prisma.report.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    // 如果提供了userId，验证权限
    if (userId && report.userId !== userId) {
      throw new NotFoundException('Report not found');
    }

    // 获取关联的资源
    const resources = await this.prisma.resource.findMany({
      where: {
        id: {
          in: report.resourceIds as string[],
        },
      },
      select: {
        id: true,
        type: true,
        title: true,
        abstract: true,
        authors: true,
        publishedAt: true,
        thumbnailUrl: true,
        sourceUrl: true,
        pdfUrl: true,
        tags: true,
      },
    });

    return {
      ...report,
      resources,
    };
  }

  /**
   * 获取用户的所有报告
   */
  async findByUser(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          template: true,
          templateName: true,
          templateIcon: true,
          summary: true,
          resourceCount: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.report.count({
        where: { userId },
      }),
    ]);

    return {
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 删除报告
   */
  async delete(id: string, userId: string) {
    const report = await this.prisma.report.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    if (report.userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    await this.prisma.report.delete({
      where: { id },
    });

    return { message: 'Report deleted successfully' };
  }
}
