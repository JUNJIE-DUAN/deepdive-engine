/**
 * RawData-Resource 关系修复脚本
 *
 * 功能：
 * 1. 查找所有没有关联 Resource 的 RawData 记录
 * 2. 根据 source 和 externalId 匹配对应的 Resource
 * 3. 建立双向关联关系
 * 4. 生成修复报告
 *
 * 使用方法：
 *   npx ts-node scripts/fix-rawdata-relations.ts --dry-run    # 预览模式
 *   npx ts-node scripts/fix-rawdata-relations.ts              # 执行修复
 */

import { PrismaClient, ResourceType } from "@prisma/client";

const prisma = new PrismaClient();

interface FixResult {
  rawDataId: string;
  source: string;
  externalId: string | null;
  action: "linked" | "created" | "skipped" | "error";
  resourceId?: string;
  reason?: string;
}

interface FixStats {
  total: number;
  linked: number;
  created: number;
  skipped: number;
  errors: number;
}

// 从 source 推断 ResourceType
function inferResourceType(source: string): ResourceType {
  const typeMap: Record<string, ResourceType> = {
    arxiv: "PAPER",
    semantic_scholar: "PAPER",
    ieee: "PAPER",
    acm: "PAPER",
    openreview: "PAPER",
    github: "PROJECT",
    gitlab: "PROJECT",
    hackernews: "NEWS",
    techcrunch: "NEWS",
    venturebeat: "NEWS",
    youtube: "YOUTUBE_VIDEO",
    medium: "BLOG",
    devto: "BLOG",
    substack: "BLOG",
    rss: "RSS",
    blog: "BLOG",
  };

  return typeMap[source.toLowerCase()] || "BLOG";
}

// 从 RawData 中提取资源信息
function extractResourceInfo(rawData: any): {
  title: string;
  abstract?: string;
  sourceUrl: string;
  authors?: string[];
  publishedAt?: Date;
} {
  const data = rawData.data;
  const source = rawData.source?.toLowerCase();

  // arXiv
  if (source === "arxiv") {
    return {
      title: data.title || "Untitled Paper",
      abstract: data.summary || data.abstract,
      sourceUrl: data.link || `https://arxiv.org/abs/${rawData.externalId}`,
      authors: data.authors?.map((a: any) =>
        typeof a === "string" ? a : a.name,
      ),
      publishedAt: data.published ? new Date(data.published) : undefined,
    };
  }

  // GitHub
  if (source === "github") {
    return {
      title: data.full_name || data.name || "Untitled Project",
      abstract: data.description,
      sourceUrl: data.html_url || `https://github.com/${rawData.externalId}`,
      authors: data.owner ? [data.owner.login] : undefined,
      publishedAt: data.created_at ? new Date(data.created_at) : undefined,
    };
  }

  // HackerNews
  if (source === "hackernews" || source === "hn") {
    return {
      title: data.title || "Untitled",
      abstract: data.text || undefined,
      sourceUrl:
        data.url ||
        `https://news.ycombinator.com/item?id=${rawData.externalId}`,
      authors: data.by ? [data.by] : undefined,
      publishedAt: data.time ? new Date(data.time * 1000) : undefined,
    };
  }

  // YouTube
  if (source === "youtube") {
    return {
      title: data.title || data.snippet?.title || "Untitled Video",
      abstract: data.description || data.snippet?.description,
      sourceUrl:
        data.url || `https://www.youtube.com/watch?v=${rawData.externalId}`,
      authors: data.channelTitle ? [data.channelTitle] : undefined,
      publishedAt: data.publishedAt
        ? new Date(data.publishedAt)
        : data.snippet?.publishedAt
          ? new Date(data.snippet.publishedAt)
          : undefined,
    };
  }

  // RSS / Blog / Medium / Dev.to
  if (["rss", "blog", "medium", "devto"].includes(source)) {
    return {
      title: data.title || "Untitled",
      abstract: data.summary || data.description || data.content?.slice(0, 500),
      sourceUrl: data.link || data.url || "",
      authors: data.author ? [data.author] : data.authors,
      publishedAt: data.pubDate
        ? new Date(data.pubDate)
        : data.published
          ? new Date(data.published)
          : undefined,
    };
  }

  // 通用处理
  return {
    title: data.title || data.name || "Untitled",
    abstract: data.abstract || data.summary || data.description,
    sourceUrl: data.url || data.link || data.sourceUrl || "",
    authors: data.authors || (data.author ? [data.author] : undefined),
    publishedAt:
      data.publishedAt || data.published || data.createdAt
        ? new Date(data.publishedAt || data.published || data.createdAt)
        : undefined,
  };
}

// 规范化 URL 用于匹配
function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // 移除追踪参数
    const trackingParams = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "ref",
      "source",
    ];
    trackingParams.forEach((p) => parsed.searchParams.delete(p));

    let normalized = parsed.toString();
    if (normalized.endsWith("/")) {
      normalized = normalized.slice(0, -1);
    }
    return normalized.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

async function fixRawDataRelations(dryRun: boolean = false): Promise<FixStats> {
  console.log("========================================");
  console.log("RawData-Resource 关系修复脚本");
  console.log(`模式: ${dryRun ? "预览 (DRY RUN)" : "执行"}`);
  console.log("========================================\n");

  const stats: FixStats = {
    total: 0,
    linked: 0,
    created: 0,
    skipped: 0,
    errors: 0,
  };

  const results: FixResult[] = [];

  // 1. 查找所有没有关联 Resource 的 RawData
  const orphanRawData = await prisma.rawData.findMany({
    where: {
      resourceId: null,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  console.log(`找到 ${orphanRawData.length} 条未关联的 RawData 记录\n`);
  stats.total = orphanRawData.length;

  if (orphanRawData.length === 0) {
    console.log("没有需要修复的记录。");
    return stats;
  }

  // 2. 遍历每条 RawData，尝试匹配或创建 Resource
  for (const rawData of orphanRawData) {
    const result: FixResult = {
      rawDataId: rawData.id,
      source: rawData.source,
      externalId: rawData.externalId,
      action: "skipped",
    };

    try {
      const resourceInfo = extractResourceInfo(rawData);

      // 跳过没有有效 URL 的记录
      if (!resourceInfo.sourceUrl) {
        result.action = "skipped";
        result.reason = "No valid URL";
        results.push(result);
        stats.skipped++;
        continue;
      }

      // 尝试通过 externalId 匹配
      let existingResource = null;

      if (rawData.externalId) {
        existingResource = await prisma.resource.findFirst({
          where: {
            OR: [
              { externalId: rawData.externalId },
              { sourceUrl: { contains: rawData.externalId } },
            ],
          },
        });
      }

      // 尝试通过 URL 匹配
      if (!existingResource && resourceInfo.sourceUrl) {
        const normalizedUrl = normalizeUrl(resourceInfo.sourceUrl);
        existingResource = await prisma.resource.findFirst({
          where: {
            sourceUrl: {
              contains: normalizedUrl.split("/").pop() || "",
            },
          },
        });
      }

      if (existingResource) {
        // 找到匹配的 Resource，建立关联
        if (!dryRun) {
          await prisma.rawData.update({
            where: { id: rawData.id },
            data: { resourceId: existingResource.id },
          });

          // 如果 Resource 没有 rawDataId，也更新它
          if (!existingResource.rawDataId) {
            await prisma.resource.update({
              where: { id: existingResource.id },
              data: { rawDataId: rawData.id },
            });
          }
        }

        result.action = "linked";
        result.resourceId = existingResource.id;
        stats.linked++;
      } else {
        // 没有找到匹配的 Resource，创建新的
        const resourceType = inferResourceType(rawData.source);

        if (!dryRun) {
          const newResource = await prisma.resource.create({
            data: {
              type: resourceType,
              title: resourceInfo.title,
              abstract: resourceInfo.abstract,
              sourceUrl: resourceInfo.sourceUrl,
              authors: resourceInfo.authors ? resourceInfo.authors : undefined,
              publishedAt: resourceInfo.publishedAt,
              sourceType: rawData.source,
              externalId: rawData.externalId,
              rawDataId: rawData.id,
              metadata: {},
            },
          });

          // 更新 RawData 的 resourceId
          await prisma.rawData.update({
            where: { id: rawData.id },
            data: { resourceId: newResource.id },
          });

          result.resourceId = newResource.id;
        }

        result.action = "created";
        stats.created++;
      }
    } catch (error) {
      result.action = "error";
      result.reason = error instanceof Error ? error.message : String(error);
      stats.errors++;
    }

    results.push(result);

    // 进度输出
    if (results.length % 100 === 0) {
      console.log(`进度: ${results.length}/${orphanRawData.length}`);
    }
  }

  // 3. 输出详细报告
  console.log("\n========================================");
  console.log("修复报告");
  console.log("========================================");
  console.log(`总记录数: ${stats.total}`);
  console.log(`已关联: ${stats.linked}`);
  console.log(`新创建: ${stats.created}`);
  console.log(`已跳过: ${stats.skipped}`);
  console.log(`错误数: ${stats.errors}`);

  // 按 source 分组统计
  const bySource: Record<string, { linked: number; created: number }> = {};
  for (const r of results) {
    if (!bySource[r.source]) {
      bySource[r.source] = { linked: 0, created: 0 };
    }
    if (r.action === "linked") bySource[r.source].linked++;
    if (r.action === "created") bySource[r.source].created++;
  }

  console.log("\n按来源统计:");
  for (const [source, counts] of Object.entries(bySource)) {
    console.log(`  ${source}: 关联 ${counts.linked}, 创建 ${counts.created}`);
  }

  // 输出错误详情
  const errors = results.filter((r) => r.action === "error");
  if (errors.length > 0) {
    console.log("\n错误详情:");
    for (const err of errors.slice(0, 10)) {
      console.log(`  - ${err.rawDataId}: ${err.reason}`);
    }
    if (errors.length > 10) {
      console.log(`  ... 还有 ${errors.length - 10} 个错误`);
    }
  }

  // 输出跳过的记录
  const skipped = results.filter((r) => r.action === "skipped");
  if (skipped.length > 0) {
    console.log("\n跳过原因统计:");
    const reasons: Record<string, number> = {};
    for (const s of skipped) {
      const reason = s.reason || "Unknown";
      reasons[reason] = (reasons[reason] || 0) + 1;
    }
    for (const [reason, count] of Object.entries(reasons)) {
      console.log(`  ${reason}: ${count}`);
    }
  }

  return stats;
}

// 补充检查：验证双向关联完整性
async function verifyBidirectionalLinks(): Promise<void> {
  console.log("\n========================================");
  console.log("验证双向关联完整性");
  console.log("========================================\n");

  // 检查 Resource 有 rawDataId 但 RawData 没有 resourceId 的情况
  const resourcesWithRawData = await prisma.resource.findMany({
    where: {
      rawDataId: { not: null },
    },
    select: {
      id: true,
      rawDataId: true,
    },
  });

  let inconsistentCount = 0;
  for (const resource of resourcesWithRawData) {
    if (resource.rawDataId) {
      const rawData = await prisma.rawData.findUnique({
        where: { id: resource.rawDataId },
        select: { resourceId: true },
      });

      if (rawData && rawData.resourceId !== resource.id) {
        console.log(
          `不一致: Resource ${resource.id} -> RawData ${resource.rawDataId} -> Resource ${rawData.resourceId}`,
        );
        inconsistentCount++;
      }
    }
  }

  if (inconsistentCount === 0) {
    console.log("所有双向关联一致！");
  } else {
    console.log(`发现 ${inconsistentCount} 个不一致的关联`);
  }

  // 统计当前关联状态
  const totalRawData = await prisma.rawData.count();
  const linkedRawData = await prisma.rawData.count({
    where: { resourceId: { not: null } },
  });
  const totalResources = await prisma.resource.count();
  const resourcesWithRawDataCount = await prisma.resource.count({
    where: { rawDataId: { not: null } },
  });

  console.log("\n当前关联状态:");
  console.log(`  RawData 总数: ${totalRawData}`);
  console.log(
    `  已关联 Resource 的 RawData: ${linkedRawData} (${((linkedRawData / totalRawData) * 100).toFixed(1)}%)`,
  );
  console.log(`  Resource 总数: ${totalResources}`);
  console.log(
    `  有 RawData 引用的 Resource: ${resourcesWithRawDataCount} (${((resourcesWithRawDataCount / totalResources) * 100).toFixed(1)}%)`,
  );
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const verifyOnly = args.includes("--verify");

  try {
    if (verifyOnly) {
      await verifyBidirectionalLinks();
    } else {
      await fixRawDataRelations(dryRun);
      await verifyBidirectionalLinks();
    }
  } catch (error) {
    console.error("脚本执行错误:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
