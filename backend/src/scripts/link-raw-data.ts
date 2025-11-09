import { PrismaClient } from '@prisma/client';
import { MongoClient } from 'mongodb';
import { getErrorMessage } from '../common/utils/error.utils';

/**
 * 脚本：为现有的 MongoDB raw_data 添加 resourceId 反向引用
 *
 * 解决问题：
 * - MongoDB raw_data 集合缺少 resource ID 引用
 * - 建立双向引用关系
 */
async function linkRawDataToResources() {
  const prisma = new PrismaClient();
  const mongoClient = new MongoClient('mongodb://deepdive:mongo_dev_password@localhost:27017/deepdive?authSource=admin');

  try {
    await mongoClient.connect();
    const db = mongoClient.db();
    const rawDataCollection = db.collection('data_collection_raw_data');

    console.log('🔗 开始链接 raw_data 到 resources...\n');

    // 获取所有有 rawDataId 的 resources
    const resources = await prisma.resource.findMany({
      where: {
        rawDataId: {
          not: null,
        },
      },
      select: {
        id: true,
        rawDataId: true,
        title: true,
      },
    });

    console.log(`📊 找到 ${resources.length} 个需要链接的 resources\n`);

    let successCount = 0;
    let failCount = 0;

    const { ObjectId } = await import('mongodb');

    for (const resource of resources) {
      if (!resource.rawDataId) {
        console.log(`❌ 资源 ${resource.id} 没有 rawDataId，跳过`);
        failCount++;
        continue;
      }

      try {
        const result = await rawDataCollection.updateOne(
          { _id: new ObjectId(resource.rawDataId as string) },
          {
            $set: {
              resourceId: resource.id,
              updatedAt: new Date(),
            },
          },
        );

        if (result.matchedCount > 0) {
          console.log(`✅ ${resource.title.substring(0, 60)}...`);
          console.log(`   rawDataId: ${resource.rawDataId} → resourceId: ${resource.id}`);
          successCount++;
        } else {
          console.log(`❌ 未找到 rawData: ${resource.rawDataId}`);
          failCount++;
        }
      } catch (error) {
        console.error(`❌ 链接失败 ${resource.id}:`, getErrorMessage(error));
        failCount++;
      }
    }

    console.log(`\n✅ 链接完成！`);
    console.log(`   成功: ${successCount}`);
    console.log(`   失败: ${failCount}`);
  } catch (error) {
    console.error('❌ 脚本执行失败:', error);
  } finally {
    await prisma.$disconnect();
    await mongoClient.close();
  }
}

void linkRawDataToResources();
