import { PrismaClient } from "@prisma/client";
import { MongoClient } from "mongodb";
import { getErrorMessage } from "../common/utils/error.utils";

/**
 * 脚本：修复GitHub资源缺失的title
 *
 * 问题：30条GitHub资源没有title
 * 方案：从raw_data中提取fullName或name作为title
 */
async function fixGitHubTitles() {
  const prisma = new PrismaClient();
  const mongoClient = new MongoClient(
    "mongodb://deepdive:mongo_dev_password@localhost:27017/deepdive?authSource=admin",
  );

  try {
    await mongoClient.connect();
    const db = mongoClient.db();
    const rawDataCollection = db.collection("data_collection_raw_data");

    console.log("🔧 开始修复GitHub资源的title...\n");

    // 获取所有type=PROJECT的资源（我们会检查哪些没有title）
    const resources = await prisma.resource.findMany({
      where: {
        type: "PROJECT",
      },
      select: {
        id: true,
        title: true,
        rawDataId: true,
      },
    });

    console.log(`📊 找到 ${resources.length} 个需要修复的GitHub资源\n`);

    let successCount = 0;
    let failCount = 0;

    for (const resource of resources) {
      // 跳过已有title的资源
      if (resource.title && resource.title.trim() !== "") {
        continue;
      }

      if (!resource.rawDataId) {
        console.log(`❌ 资源 ${resource.id} 没有rawDataId，跳过`);
        failCount++;
        continue;
      }

      try {
        // 从MongoDB获取raw_data
        const { ObjectId } = await import("mongodb");
        const rawData = await rawDataCollection.findOne({
          _id: new ObjectId(resource.rawDataId),
        });

        if (!rawData) {
          console.log(`❌ 未找到rawData: ${resource.rawDataId}`);
          failCount++;
          continue;
        }

        // 提取title（优先使用fullName，其次name）
        const title =
          rawData.data?.fullName ||
          rawData.data?.name ||
          rawData.data?.externalId;

        if (!title) {
          console.log(`❌ rawData中没有可用的title数据: ${resource.rawDataId}`);
          failCount++;
          continue;
        }

        // 更新resource
        await prisma.resource.update({
          where: { id: resource.id },
          data: { title: title },
        });

        console.log(`✅ ${title}`);
        console.log(`   resourceId: ${resource.id}`);
        successCount++;
      } catch (error) {
        console.error(`❌ 修复失败 ${resource.id}:`, getErrorMessage(error));
        failCount++;
      }
    }

    console.log(`\n✅ 修复完成！`);
    console.log(`   成功: ${successCount}`);
    console.log(`   失败: ${failCount}`);
  } catch (error) {
    console.error("❌ 脚本执行失败:", error);
  } finally {
    await prisma.$disconnect();
    await mongoClient.close();
  }
}

void fixGitHubTitles();
