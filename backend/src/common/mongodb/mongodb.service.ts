import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongoClient, Db, Collection, ObjectId } from 'mongodb';

/**
 * MongoDB 服务
 * 用于存储原始采集数据（data_collection_raw_data 集合）
 */
@Injectable()
export class MongoDBService implements OnModuleInit, OnModuleDestroy {
  private client: MongoClient;
  private db: Db;
  private readonly logger = new Logger(MongoDBService.name);

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const mongoUrl = this.configService.get<string>('MONGO_URL');

    try {
      this.client = new MongoClient(mongoUrl);
      await this.client.connect();
      this.db = this.client.db();
      this.logger.log('✅ MongoDB connected successfully');
    } catch (error) {
      this.logger.error('❌ MongoDB connection failed:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.close();
      this.logger.log('MongoDB connection closed');
    }
  }

  /**
   * 获取原始数据集合
   */
  getRawDataCollection(): Collection {
    return this.db.collection('data_collection_raw_data');
  }

  /**
   * 插入原始数据（完整数据存储）
   * @param source 数据源类型（arxiv, github, hackernews 等）
   * @param data 完整的原始数据对象
   * @param resourceId 可选的资源ID（用于建立反向引用）
   * @returns MongoDB _id
   */
  async insertRawData(source: string, data: any, resourceId?: string): Promise<string> {
    const collection = this.getRawDataCollection();

    const document = {
      source, // 数据源
      data, // 完整原始数据（JSON 格式）
      resourceId: resourceId || null, // ⚠️ 关键：反向引用到PostgreSQL resource
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(document);
    this.logger.log(`Inserted raw data from ${source}, _id: ${result.insertedId}${resourceId ? `, resourceId: ${resourceId}` : ''}`);

    return result.insertedId.toString();
  }

  /**
   * 根据 ID 获取原始数据
   */
  async getRawDataById(id: string): Promise<any> {
    const collection = this.getRawDataCollection();
    return collection.findOne({ _id: new ObjectId(id) });
  }

  /**
   * 根据 ID 获取原始数据（别名方法）
   */
  async findRawDataById(id: string): Promise<any> {
    return this.getRawDataById(id);
  }

  /**
   * 根据数据源和外部 ID 查找原始数据（用于去重）
   * @param source 数据源
   * @param externalId 外部ID（如 arXiv ID, GitHub repo full_name 等）
   */
  async findRawDataByExternalId(source: string, externalId: string): Promise<any> {
    const collection = this.getRawDataCollection();
    return collection.findOne({
      source,
      'data.externalId': externalId,
    });
  }

  /**
   * 更新原始数据
   */
  async updateRawData(id: string, data: any, resourceId?: string): Promise<void> {
    const collection = this.getRawDataCollection();

    const updateFields: any = {
      data,
      updatedAt: new Date(),
    };

    if (resourceId) {
      updateFields.resourceId = resourceId;
    }

    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields },
    );

    this.logger.log(`Updated raw data _id: ${id}${resourceId ? `, resourceId: ${resourceId}` : ''}`);
  }

  /**
   * 添加 resourceId 引用到已存在的原始数据
   */
  async linkResourceToRawData(rawDataId: string, resourceId: string): Promise<void> {
    const collection = this.getRawDataCollection();

    await collection.updateOne(
      { _id: new ObjectId(rawDataId) },
      {
        $set: {
          resourceId,
          updatedAt: new Date(),
        },
      },
    );

    this.logger.log(`Linked resource ${resourceId} to raw data ${rawDataId}`);
  }

  /**
   * 批量插入原始数据
   */
  async insertManyRawData(source: string, dataArray: any[]): Promise<string[]> {
    const collection = this.getRawDataCollection();

    const documents = dataArray.map(data => ({
      source,
      data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const result = await collection.insertMany(documents);
    const ids = Object.values(result.insertedIds).map(id => id.toString());

    this.logger.log(`Inserted ${ids.length} raw data items from ${source}`);

    return ids;
  }

  /**
   * 获取指定数据源的数据数量
   */
  async countBySource(source: string): Promise<number> {
    const collection = this.getRawDataCollection();
    return collection.countDocuments({ source });
  }
}
