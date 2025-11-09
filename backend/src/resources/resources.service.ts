import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { MongoDBService } from '../common/mongodb/mongodb.service';
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
      if (error.code === 'P2025') {
        throw new NotFoundException(`Resource with ID ${id} not found`);
      }
      throw error;
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
      if (error.code === 'P2025') {
        throw new NotFoundException(`Resource with ID ${id} not found`);
      }
      throw error;
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
}
