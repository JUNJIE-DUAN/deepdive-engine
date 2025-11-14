import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { Prisma } from "@prisma/client";

/**
 * Feed 流服务
 */
@Injectable()
export class FeedService {
  private readonly logger = new Logger(FeedService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 获取 Feed 流（时间倒序）
   */
  async getFeed(params: {
    skip?: number;
    take?: number;
    type?: string;
    category?: string;
    minQualityScore?: number;
    sortBy?: "publishedAt" | "qualityScore" | "trendingScore";
  }) {
    const {
      skip = 0,
      take = 20,
      type,
      category,
      minQualityScore,
      sortBy = "publishedAt",
    } = params;

    const where: Prisma.ResourceWhereInput = {};

    if (type) {
      where.type = type as any;
    }

    if (category) {
      where.categories = {
        array_contains: category,
      };
    }

    if (minQualityScore) {
      where.qualityScore = {
        gte: minQualityScore.toString(),
      };
    }

    const [resources, total] = await Promise.all([
      this.prisma.resource.findMany({
        where,
        skip,
        take,
        orderBy: {
          [sortBy]: "desc",
        },
        select: {
          id: true,
          type: true,
          title: true,
          abstract: true,
          sourceUrl: true,
          pdfUrl: true,
          codeUrl: true,
          authors: true,
          publishedAt: true,
          aiSummary: true,
          primaryCategory: true,
          categories: true,
          tags: true,
          qualityScore: true,
          trendingScore: true,
          viewCount: true,
          upvoteCount: true,
          commentCount: true,
          createdAt: true,
        },
      }),
      this.prisma.resource.count({ where }),
    ]);

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
   * 搜索资源
   */
  async search(params: {
    query: string;
    skip?: number;
    take?: number;
    type?: string;
    category?: string;
  }) {
    const { query, skip = 0, take = 20, type, category } = params;

    const where: Prisma.ResourceWhereInput = {
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { abstract: { contains: query, mode: "insensitive" } },
        { content: { contains: query, mode: "insensitive" } },
      ],
    };

    if (type) {
      where.type = type as any;
    }

    if (category) {
      where.categories = {
        array_contains: category,
      };
    }

    const [resources, total] = await Promise.all([
      this.prisma.resource.findMany({
        where,
        skip,
        take,
        orderBy: {
          publishedAt: "desc",
        },
      }),
      this.prisma.resource.count({ where }),
    ]);

    this.logger.log(
      `Search query "${query}" returned ${resources.length} results`,
    );

    return {
      query,
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
   * 获取热门资源
   */
  async getTrending(take = 10) {
    const resources = await this.prisma.resource.findMany({
      take,
      orderBy: {
        trendingScore: "desc",
      },
      where: {
        trendingScore: {
          not: "0",
        },
      },
    });

    return resources;
  }

  /**
   * 获取相关资源
   */
  async getRelated(resourceId: string, take = 5) {
    // 获取目标资源
    const resource = await this.prisma.resource.findUnique({
      where: { id: resourceId },
      select: { categories: true, tags: true, type: true },
    });

    if (!resource) {
      return [];
    }

    // 查找相关资源（相同类型和类别）
    const related = await this.prisma.resource.findMany({
      where: {
        id: { not: resourceId },
        type: resource.type,
        OR: [
          ...(Array.isArray(resource.categories)
            ? (resource.categories as string[]).map((cat) => ({
                categories: { array_contains: cat },
              }))
            : []),
          ...(Array.isArray(resource.tags)
            ? (resource.tags as string[]).map((tag) => ({
                tags: { array_contains: tag },
              }))
            : []),
        ],
      },
      take,
      orderBy: {
        qualityScore: "desc",
      },
    });

    return related;
  }
}
