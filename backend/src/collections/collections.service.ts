import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateCollectionDto, UpdateCollectionDto, AddToCollectionDto } from './dto';

/**
 * 收藏系统服务
 *
 * 核心功能：
 * 1. 创建和管理收藏集
 * 2. 添加/移除资源到收藏集
 * 3. 收藏集排序和组织
 * 4. 收藏集分享（公开/私有）
 */
@Injectable()
export class CollectionsService {
  private readonly logger = new Logger(CollectionsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 创建收藏集
   */
  async createCollection(userId: string, dto: CreateCollectionDto) {
    const collection = await this.prisma.collection.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description,
        isPublic: dto.isPublic ?? false,
      },
      include: {
        items: {
          include: {
            resource: true,
          },
        },
      },
    });

    this.logger.log(`Collection created: ${collection.name} by user ${userId}`);

    return collection;
  }

  /**
   * 获取用户的所有收藏集
   */
  async getUserCollections(userId: string) {
    const collections = await this.prisma.collection.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            resource: {
              select: {
                id: true,
                type: true,
                title: true,
                thumbnailUrl: true,
                publishedAt: true,
              },
            },
          },
          orderBy: {
            position: 'asc',
          },
        },
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });

    return collections.map((collection) => ({
      ...collection,
      itemCount: collection.items.length,
    }));
  }

  /**
   * 获取单个收藏集详情
   */
  async getCollection(collectionId: string, userId?: string) {
    const collection = await this.prisma.collection.findUnique({
      where: { id: collectionId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        items: {
          include: {
            resource: true,
          },
          orderBy: {
            position: 'asc',
          },
        },
      },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    // 如果是私有收藏集，只有所有者可以查看
    if (!collection.isPublic && collection.userId !== userId) {
      throw new ForbiddenException('You do not have access to this collection');
    }

    return {
      ...collection,
      itemCount: collection.items.length,
    };
  }

  /**
   * 更新收藏集
   */
  async updateCollection(collectionId: string, userId: string, dto: UpdateCollectionDto) {
    // 验证所有权
    const collection = await this.prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    if (collection.userId !== userId) {
      throw new ForbiddenException('You can only update your own collections');
    }

    const updated = await this.prisma.collection.update({
      where: { id: collectionId },
      data: {
        name: dto.name,
        description: dto.description,
        isPublic: dto.isPublic,
        sortOrder: dto.sortOrder,
      },
      include: {
        items: {
          include: {
            resource: true,
          },
        },
      },
    });

    this.logger.log(`Collection updated: ${updated.name}`);

    return updated;
  }

  /**
   * 删除收藏集
   */
  async deleteCollection(collectionId: string, userId: string) {
    // 验证所有权
    const collection = await this.prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    if (collection.userId !== userId) {
      throw new ForbiddenException('You can only delete your own collections');
    }

    await this.prisma.collection.delete({
      where: { id: collectionId },
    });

    this.logger.log(`Collection deleted: ${collection.name}`);

    return { success: true };
  }

  /**
   * 添加资源到收藏集
   */
  async addToCollection(collectionId: string, userId: string, dto: AddToCollectionDto) {
    // 验证所有权
    const collection = await this.prisma.collection.findUnique({
      where: { id: collectionId },
      include: {
        items: true,
      },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    if (collection.userId !== userId) {
      throw new ForbiddenException('You can only add to your own collections');
    }

    // 检查是否已存在
    const existingItem = collection.items.find((item) => item.resourceId === dto.resourceId);
    if (existingItem) {
      return { success: true, message: 'Resource already in collection' };
    }

    // 添加到收藏集
    const item = await this.prisma.collectionItem.create({
      data: {
        collectionId,
        resourceId: dto.resourceId,
        note: dto.note,
        position: collection.items.length,
      },
      include: {
        resource: true,
      },
    });

    this.logger.log(`Resource ${dto.resourceId} added to collection ${collectionId}`);

    return { success: true, item };
  }

  /**
   * 从收藏集移除资源
   */
  async removeFromCollection(collectionId: string, resourceId: string, userId: string) {
    // 验证所有权
    const collection = await this.prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    if (collection.userId !== userId) {
      throw new ForbiddenException('You can only remove from your own collections');
    }

    // 查找并删除
    const item = await this.prisma.collectionItem.findFirst({
      where: {
        collectionId,
        resourceId,
      },
    });

    if (!item) {
      throw new NotFoundException('Item not found in collection');
    }

    await this.prisma.collectionItem.delete({
      where: { id: item.id },
    });

    this.logger.log(`Resource ${resourceId} removed from collection ${collectionId}`);

    return { success: true };
  }

  /**
   * 更新收藏项笔记
   */
  async updateCollectionItemNote(collectionId: string, resourceId: string, userId: string, note: string) {
    // 验证所有权
    const collection = await this.prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    if (collection.userId !== userId) {
      throw new ForbiddenException('You can only update your own collections');
    }

    // 更新笔记
    const item = await this.prisma.collectionItem.findFirst({
      where: {
        collectionId,
        resourceId,
      },
    });

    if (!item) {
      throw new NotFoundException('Item not found in collection');
    }

    const updated = await this.prisma.collectionItem.update({
      where: { id: item.id },
      data: { note },
      include: {
        resource: true,
      },
    });

    return updated;
  }

  /**
   * 检查资源是否在用户的某个收藏集中
   */
  async isResourceInUserCollections(userId: string, resourceId: string) {
    const items = await this.prisma.collectionItem.findMany({
      where: {
        resourceId,
        collection: {
          userId,
        },
      },
      include: {
        collection: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      isCollected: items.length > 0,
      collections: items.map((item) => item.collection),
    };
  }
}
