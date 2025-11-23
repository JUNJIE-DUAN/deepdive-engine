import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MongoClient, Db, Collection, ObjectId } from "mongodb";

/**
 * MongoDB 服务
 * 用于存储原始采集数据（data_collection_raw_data 集合）
 */
@Injectable()
export class MongoDBService implements OnModuleInit, OnModuleDestroy {
  private client!: MongoClient;
  private db!: Db;
  private readonly logger = new Logger(MongoDBService.name);

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const mongoUrl = this.configService.get<string>("MONGO_URL");

    if (!mongoUrl) {
      throw new Error("MONGO_URL is not configured");
    }

    try {
      this.client = new MongoClient(mongoUrl);
      await this.client.connect();
      this.db = this.client.db();
      this.logger.log("✅ MongoDB connected successfully");
    } catch (error) {
      this.logger.error("❌ MongoDB connection failed:", error);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.close();
      this.logger.log("MongoDB connection closed");
    }
  }

  /**
   * 获取原始数据集合
   */
  getRawDataCollection(): Collection {
    return this.db.collection("data_collection_raw_data");
  }

  /**
   * 插入原始数据（完整数据存储）
   * @param source 数据源类型（arxiv, github, hackernews 等）
   * @param data 完整的原始数据对象
   * @param resourceId 可选的资源ID（用于建立反向引用）
   * @returns MongoDB _id
   */
  async insertRawData(
    source: string,
    data: any,
    resourceId?: string,
  ): Promise<string> {
    const collection = this.getRawDataCollection();

    const document = {
      source, // 数据源
      data, // 完整原始数据（JSON 格式）
      resourceId: resourceId ?? null, // ⚠️ 关键：反向引用到PostgreSQL resource
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(document);
    this.logger.log(
      `Inserted raw data from ${source}, _id: ${result.insertedId}${resourceId ? `, resourceId: ${resourceId}` : ""}`,
    );

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
  async findRawDataByExternalId(
    source: string,
    externalId: string,
  ): Promise<any> {
    const collection = this.getRawDataCollection();
    return collection.findOne({
      source,
      "data.externalId": externalId,
    });
  }

  /**
   * 跨数据源查找：根据外部 ID 在所有数据源中查找（用于去重）
   * @param externalId 外部ID
   */
  async findRawDataByExternalIdAcrossAllSources(
    externalId: string,
  ): Promise<any> {
    const collection = this.getRawDataCollection();
    return collection.findOne({
      "data.externalId": externalId,
    });
  }

  /**
   * 跨数据源查找：根据标题查找相似内容（用于跨源去重）
   * @param title 标题
   * @param similarity 相似度阈值（可选，用于模糊匹配）
   */
  async findRawDataByTitleAcrossAllSources(title: string): Promise<any[]> {
    const collection = this.getRawDataCollection();
    // 使用正则表达式进行标题匹配（不区分大小写）
    const titleRegex = new RegExp(
      title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i",
    );
    return collection
      .find({
        "data.title": titleRegex,
      })
      .limit(10)
      .toArray();
  }

  /**
   * 跨数据源查找：根据 URL 查找（用于跨源去重）
   * @param url 原始URL或规范化URL
   */
  async findRawDataByUrlAcrossAllSources(url: string): Promise<any> {
    const collection = this.getRawDataCollection();
    // 尝试匹配多个可能的URL字段
    return collection.findOne({
      $or: [
        { "data.url": url },
        { "data.abstractUrl": url },
        { "data.pdfUrl": url },
        { "data.html_url": url },
        { "data.link": url },
      ],
    });
  }

  /**
   * 更新原始数据
   */
  async updateRawData(
    id: string,
    data: any,
    resourceId?: string,
  ): Promise<void> {
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

    this.logger.log(
      `Updated raw data _id: ${id}${resourceId ? `, resourceId: ${resourceId}` : ""}`,
    );
  }

  /**
   * 添加 resourceId 引用到已存在的原始数据
   */
  async linkResourceToRawData(
    rawDataId: string,
    resourceId: string,
  ): Promise<void> {
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

    const documents = dataArray.map((data) => ({
      source,
      data,
      resourceId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const result = await collection.insertMany(documents);
    const ids = Object.values(result.insertedIds).map((id) => id.toString());

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

  /**
   * 根据 resourceId 查找原始数据
   */
  async findRawDataByResourceId(resourceId: string): Promise<any> {
    const collection = this.getRawDataCollection();
    return collection.findOne({ resourceId });
  }

  /**
   * 查询缺少 resourceId 的原始数据（数据一致性检查）
   * 用于修复孤立的 raw_data 记录
   */
  async findRawDataWithoutResourceId(
    source?: string,
    limit: number = 100,
  ): Promise<any[]> {
    const collection = this.getRawDataCollection();
    const query: any = { resourceId: null };

    if (source) {
      query.source = source;
    }

    return collection.find(query).limit(limit).toArray();
  }

  /**
   * 批量验证 raw_data 和 resource 的一致性
   * 返回不一致的记录统计
   */
  async validateDataConsistency(source?: string): Promise<{
    totalRawData: number;
    withResourceRef: number;
    withoutResourceRef: number;
    orphanedRawData: number;
  }> {
    const collection = this.getRawDataCollection();
    const query = source ? { source } : {};

    const totalRawData = await collection.countDocuments(query);
    const withResourceRef = await collection.countDocuments({
      ...query,
      resourceId: { $ne: null },
    });
    const withoutResourceRef = await collection.countDocuments({
      ...query,
      resourceId: null,
    });

    // 统计已删除对应 resource 的孤立 raw_data
    // （注：这个检查需要访问 PostgreSQL，在 ResourcesModule 中完成）
    const orphanedRawData = 0; // 占位符，由 ResourcesModule 计算

    return {
      totalRawData,
      withResourceRef,
      withoutResourceRef,
      orphanedRawData,
    };
  }

  /**
   * 修复缺少 resourceId 的原始数据
   * 用于数据修复操作
   */
  async repairMissingResourceId(
    rawDataIds: string[],
    resourceId: string,
  ): Promise<number> {
    const collection = this.getRawDataCollection();

    const objectIds = rawDataIds.map((id) => new ObjectId(id));
    const result = await collection.updateMany(
      { _id: { $in: objectIds }, resourceId: null },
      {
        $set: {
          resourceId,
          updatedAt: new Date(),
        },
      },
    );

    this.logger.log(
      `Repaired ${result.modifiedCount} raw data records with resourceId ${resourceId}`,
    );

    return result.modifiedCount;
  }
}
