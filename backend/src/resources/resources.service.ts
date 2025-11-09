import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { MongoDBService } from '../common/mongodb/mongodb.service';
import { ensureError } from '../common/utils/error.utils';
import { Prisma } from '@prisma/client';

/**
 * 资源管理服务
 */
@Injectable()
export class ResourcesService {
  private readonly logger = new Logger(ResourcesService.name);

  constructor(
    private prisma: PrismaService,
    private mongodb: MongoDBService,
  ) {}

  /**
   * 获取资源列表（分页+过滤）
   */
  async findAll(params: {
    skip?: number;
    take?: number;
    type?: string;
    category?: string;
    search?: string;
    sortBy?: 'publishedAt' | 'qualityScore' | 'trendingScore';
    sortOrder?: 'asc' | 'desc';
  }) {
    const {
      skip = 0,
      take = 20,
      type,
      category,
      search,
      sortBy = 'publishedAt',
      sortOrder = 'desc',
    } = params;

    // 构建查询条件
    const where: Prisma.ResourceWhereInput = {};

    if (type) {
      where.type = type as any;
    }

    if (category) {
      // For JSON array fields in Prisma, we need to use path and array_contains with an array
      where.categories = {
        path: [],
        array_contains: [category],
      } as any;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { abstract: { contains: search, mode: 'insensitive' } },
      ];
    }

    // 执行查询
    const [resources, total] = await Promise.all([
      this.prisma.resource.findMany({
        where,
        skip,
        take,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      this.prisma.resource.count({ where }),
    ]);

    this.logger.log(`Found ${resources.length}/${total} resources (skip: ${skip}, take: ${take})`);

    return {
      data: resources,
      pagination: {
        total,
        skip,
        take,
        hasMore: skip + take < total,
      },
    };
  }

  /**
   * 获取单个资源详情
   */
  async findOne(id: string) {
    const resource = await this.prisma.resource.findUnique({
      where: { id },
    });

    if (!resource) {
      throw new NotFoundException(`Resource with ID ${id} not found`);
    }

    // 如果有 rawDataId，获取完整原始数据
    let rawData = null;
    if (resource.rawDataId) {
      rawData = await this.mongodb.findRawDataById(resource.rawDataId);
    }

    this.logger.log(`Retrieved resource ${id}`);

    return {
      ...resource,
      rawData: rawData?.data || null,
    };
  }

  /**
   * 创建资源
   */
  async create(data: Prisma.ResourceCreateInput) {
    const resource = await this.prisma.resource.create({
      data,
    });

    this.logger.log(`Created resource ${resource.id}`);

    return resource;
  }

  /**
   * 更新资源
   */
  async update(id: string, data: Prisma.ResourceUpdateInput) {
    try {
      const resource = await this.prisma.resource.update({
        where: { id },
        data,
      });

      this.logger.log(`Updated resource ${id}`);

      return resource;
    } catch (error) {
      const err = error as { code?: string };
      if (err.code === 'P2025') {
        throw new NotFoundException(`Resource with ID ${id} not found`);
      }
      throw ensureError(error);
    }
  }

  /**
   * 删除资源
   */
  async remove(id: string) {
    try {
      const resource = await this.prisma.resource.delete({
        where: { id },
      });

      this.logger.log(`Deleted resource ${id}`);

      return resource;
    } catch (error) {
      const err = error as { code?: string };
      if (err.code === 'P2025') {
        throw new NotFoundException(`Resource with ID ${id} not found`);
      }
      throw ensureError(error);
    }
  }

  /**
   * 按类型统计资源数量
   */
  async getStats() {
    const stats = await this.prisma.resource.groupBy({
      by: ['type'],
      _count: {
        id: true,
      },
    });

    const totalCount = await this.prisma.resource.count();

    return {
      total: totalCount,
      byType: stats.map((s) => ({
        type: s.type,
        count: s._count.id,
      })),
    };
  }

  /**
   * 搜索建议（实时）
   * 混合搜索：全文搜索 + 相关性排序
   */
  async searchSuggestions(query: string, limit: number = 5) {
    const searchQuery = query.trim().toLowerCase();

    // 执行全文搜索
    const results = await this.prisma.resource.findMany({
      where: {
        OR: [
          { title: { contains: searchQuery, mode: 'insensitive' } },
          { abstract: { contains: searchQuery, mode: 'insensitive' } },
          { content: { contains: searchQuery, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        type: true,
        title: true,
        abstract: true,
        publishedAt: true,
        qualityScore: true,
      },
      take: limit * 2, // 获取更多结果用于排序
      orderBy: {
        qualityScore: 'desc', // 按质量分数排序
      },
    });

    // 计算相关性分数并排序
    const scoredResults = results.map((resource) => {
      let score = 0;

      // 标题匹配权重更高
      if (resource.title?.toLowerCase().includes(searchQuery)) {
        score += 10;
        // 精确匹配额外加分
        if (resource.title?.toLowerCase() === searchQuery) {
          score += 20;
        }
        // 开头匹配加分
        if (resource.title?.toLowerCase().startsWith(searchQuery)) {
          score += 5;
        }
      }

      // 摘要匹配
      if (resource.abstract?.toLowerCase().includes(searchQuery)) {
        score += 5;
      }

      // 质量分数加权
      score += (resource.qualityScore || 0) * 0.1;

      // 新鲜度加权（最近发布的加分）
      if (resource.publishedAt) {
        const daysSincePublished = Math.floor(
          (Date.now() - new Date(resource.publishedAt).getTime()) / (1000 * 60 * 60 * 24),
        );
        if (daysSincePublished < 7) score += 3;
        else if (daysSincePublished < 30) score += 2;
        else if (daysSincePublished < 90) score += 1;
      }

      return {
        ...resource,
        searchScore: score,
        highlight: this.generateHighlight(resource.title, resource.abstract, searchQuery),
      };
    });

    // 按分数排序并返回前N个
    const topResults = scoredResults
      .sort((a, b) => b.searchScore - a.searchScore)
      .slice(0, limit);

    return topResults.map((r) => ({
      id: r.id,
      title: r.title,
      type: r.type,
      abstract: r.abstract?.substring(0, 150) + '...',
      highlight: r.highlight,
    }));
  }

  /**
   * 生成搜索高亮片段
   */
  private generateHighlight(
    title: string | null,
    abstract: string | null,
    query: string,
  ): string {
    const text = title || abstract || '';
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();

    const index = lowerText.indexOf(lowerQuery);
    if (index === -1) return text.substring(0, 100) + '...';

    // 获取匹配周围的文本
    const start = Math.max(0, index - 30);
    const end = Math.min(text.length, index + query.length + 30);

    let snippet = text.substring(start, end);
    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';

    return snippet;
  }
}
