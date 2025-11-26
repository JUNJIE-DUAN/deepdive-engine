/**
 * 数据修复脚本
 * 为已存在的论文补充MongoDB原始数据和rawDataId引用
 *
 * 使用方式:
 * npx ts-node src/scripts/repair-paper-raw-data.ts
 */

import { PrismaClient } from "@prisma/client";
import { MongoClient, Db, Collection } from "mongodb";

const prisma = new PrismaClient();

class PaperDataRepair {
  private mongoUrl: string;
  private mongoDb: Db | null = null;
  private mongoClient: MongoClient | null = null;

  constructor() {
    this.mongoUrl =
      process.env.MONGO_URL || "mongodb://localhost:27017/deepdive";
  }

  async connect() {
    try {
      this.mongoClient = new MongoClient(this.mongoUrl);
      await this.mongoClient.connect();
      this.mongoDb = this.mongoClient.db();
      console.log("✅ MongoDB connected");
    } catch (error) {
      console.error("❌ MongoDB connection failed:", error);
      process.exit(1);
    }
  }

  async disconnect() {
    await prisma.$disconnect();
    if (this.mongoClient) {
      await this.mongoClient.close();
    }
  }

  /**
   * 获取MongoDB原始数据集合
   */
  private getRawDataCollection(): Collection {
    if (!this.mongoDb) throw new Error("MongoDB not connected");
    return this.mongoDb.collection("data_collection_raw_data");
  }

  /**
   * 修复缺少rawDataId的论文
   */
  async repairPapersWithoutRawData() {
    console.log("\n🔍 扫描缺少rawDataId的论文...");

    // 查找所有没有rawDataId的论文
    const papersWithoutRawData = await prisma.resource.findMany({
      where: {
        type: "PAPER",
        rawDataId: null,
      },
      select: {
        id: true,
        title: true,
        abstract: true,
        sourceUrl: true,
        pdfUrl: true,
        publishedAt: true,
        authors: true,
        createdAt: true,
      },
    });

    console.log(`📊 找到 ${papersWithoutRawData.length} 篇论文缺少原始数据`);

    if (papersWithoutRawData.length === 0) {
      console.log("✅ 所有论文都已有原始数据");
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    const rawDataCollection = this.getRawDataCollection();

    for (const paper of papersWithoutRawData) {
      try {
        // 1. 为论文构建原始数据对象
        const rawData = {
          sourceUrl: paper.sourceUrl,
          title: paper.title,
          description: paper.abstract,
          language: "en",
          contentType: "paper",
          authors: paper.authors || [],
          publishedDate: paper.publishedAt?.toISOString() || null,
          domain: new URL(paper.sourceUrl).hostname,
          pdfUrl: paper.pdfUrl,
          wordCount: null,
          contentHash: null,
          repairMethod: "auto_repair_script",
          repairedAt: new Date().toISOString(),
          _raw: {
            title: paper.title,
            abstract: paper.abstract,
            sourceUrl: paper.sourceUrl,
            pdfUrl: paper.pdfUrl,
          },
        };

        // 2. 插入到MongoDB
        const insertResult = await rawDataCollection.insertOne({
          source: "manual_import",
          data: rawData,
          resourceId: paper.id,
          createdAt: paper.createdAt,
          updatedAt: new Date(),
        });

        const rawDataId = insertResult.insertedId.toString();

        // 3. 更新PostgreSQL Resource记录，设置rawDataId
        await prisma.resource.update({
          where: { id: paper.id },
          data: { rawDataId },
        });

        console.log(
          `✅ [${successCount + 1}/${papersWithoutRawData.length}] ${paper.title.substring(0, 50)}... → rawDataId: ${rawDataId}`,
        );
        successCount++;
      } catch (error) {
        errorCount++;
        console.error(
          `❌ 修复失败: ${paper.title} - ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }

    console.log(`\n📈 修复结果: ${successCount} 成功, ${errorCount} 失败`);
    return { successCount, errorCount };
  }

  /**
   * 验证双向引用完整性
   */
  async validateBidirectionalReferences() {
    console.log("\n🔍 验证双向引用完整性...");

    const rawDataCollection = this.getRawDataCollection();

    // 1. 检查PostgreSQL中有rawDataId但MongoDB中不存在的数据
    const resourcesWithRawDataId = await prisma.resource.findMany({
      where: {
        rawDataId: { not: null },
      },
      select: {
        id: true,
        rawDataId: true,
        title: true,
      },
    });

    console.log(
      `📊 PostgreSQL中有rawDataId的记录: ${resourcesWithRawDataId.length}`,
    );

    let brokenReferences = 0;
    let validReferences = 0;

    for (const resource of resourcesWithRawDataId) {
      if (!resource.rawDataId) continue;

      try {
        const rawData = await rawDataCollection.findOne({
          _id: require("mongodb").ObjectId.createFromHexString(
            resource.rawDataId,
          ),
        });

        if (!rawData) {
          console.error(
            `❌ 断裂引用: Resource ${resource.id} (${resource.title}) → rawDataId ${resource.rawDataId} 在MongoDB中不存在`,
          );
          brokenReferences++;
        } else if (rawData.resourceId !== resource.id) {
          console.warn(
            `⚠️  不一致引用: MongoDB中的resourceId (${rawData.resourceId}) 与PostgreSQL中的id (${resource.id}) 不匹配`,
          );
          // 尝试修复
          await rawDataCollection.updateOne(
            {
              _id: require("mongodb").ObjectId.createFromHexString(
                resource.rawDataId,
              ),
            },
            { $set: { resourceId: resource.id, updatedAt: new Date() } },
          );
          console.log(`✅ 修复不一致引用: ${resource.id}`);
        } else {
          validReferences++;
        }
      } catch (error) {
        console.error(
          `❌ 验证失败: ${resource.id} - ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        brokenReferences++;
      }
    }

    console.log(
      `\n📈 验证结果: ${validReferences} 有效, ${brokenReferences} 断裂`,
    );

    // 2. 检查MongoDB中有resourceId但PostgreSQL中不存在的数据
    console.log("\n🔍 检查孤立的MongoDB数据...");
    const orphanedRawData = await rawDataCollection
      .find({
        resourceId: { $ne: null },
      })
      .toArray();

    let orphanCount = 0;
    for (const rawData of orphanedRawData) {
      const resource = await prisma.resource.findUnique({
        where: { id: rawData.resourceId },
      });

      if (!resource) {
        orphanCount++;
        console.warn(
          `⚠️  孤立数据: MongoDB ${rawData._id} → resourceId ${rawData.resourceId} 在PostgreSQL中不存在`,
        );
      }
    }

    if (orphanCount === 0) {
      console.log("✅ 没有孤立的MongoDB数据");
    }

    return {
      validReferences,
      brokenReferences,
      orphanedCount: orphanCount,
    };
  }

  /**
   * 生成数据一致性报告
   */
  async generateReport() {
    console.log("\n📋 生成数据一致性报告...\n");

    // 统计信息
    const totalPapers = await prisma.resource.count({
      where: { type: "PAPER" },
    });

    const papersWithRawData = await prisma.resource.count({
      where: {
        type: "PAPER",
        rawDataId: { not: null },
      },
    });

    const papersWithoutRawData = totalPapers - papersWithRawData;

    const rawDataCollection = this.getRawDataCollection();
    const totalRawData = await rawDataCollection.countDocuments({
      source: "manual_import",
    });
    const rawDataWithResourceId = await rawDataCollection.countDocuments({
      source: "manual_import",
      resourceId: { $ne: null },
    });

    console.log("=".repeat(60));
    console.log("数据一致性报告");
    console.log("=".repeat(60));
    console.log(`\n📊 PostgreSQL (Resources):`);
    console.log(`   总论文数: ${totalPapers}`);
    console.log(`   有rawDataId: ${papersWithRawData}`);
    console.log(`   缺少rawDataId: ${papersWithoutRawData}`);
    console.log(
      `   完整性: ${((papersWithRawData / totalPapers) * 100).toFixed(2)}%`,
    );

    console.log(`\n📊 MongoDB (Raw Data):`);
    console.log(`   总原始数据: ${totalRawData}`);
    console.log(`   有resourceId: ${rawDataWithResourceId}`);
    console.log(`   缺少resourceId: ${totalRawData - rawDataWithResourceId}`);

    console.log(
      `\n${papersWithoutRawData > 0 ? "⚠️" : "✅"} 数据完整性: ${papersWithoutRawData === 0 ? "完整" : "需要修复"}`,
    );
    console.log("=".repeat(60) + "\n");
  }

  /**
   * 运行所有修复操作
   */
  async runAll() {
    try {
      await this.connect();

      // 1. 生成初始报告
      await this.generateReport();

      // 2. 修复缺少rawDataId的论文
      await this.repairPapersWithoutRawData();

      // 3. 验证双向引用
      const validationResult = await this.validateBidirectionalReferences();

      // 4. 生成最终报告
      await this.generateReport();

      // 总结
      console.log("\n✅ 修复完成！\n");
      if (validationResult.brokenReferences > 0) {
        console.warn(
          `⚠️  仍有 ${validationResult.brokenReferences} 个断裂的引用，可能需要手动检查`,
        );
      }
    } catch (error) {
      console.error("❌ 脚本执行失败:", error);
      process.exit(1);
    } finally {
      await this.disconnect();
    }
  }
}

// 执行修复
const repair = new PaperDataRepair();
repair.runAll();
