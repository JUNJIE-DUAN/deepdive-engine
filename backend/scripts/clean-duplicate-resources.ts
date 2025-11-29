/**
 * 数据清洗脚本 - 清理重复资源
 *
 * 功能：
 * 1. 识别重复资源（基于 URL、标题、内容指纹）
 * 2. 合并重复资源（保留质量最高的版本）
 * 3. 更新关联关系（RawData -> Resource）
 * 4. 生成清洗报告
 *
 * 使用方法：
 * npx ts-node scripts/clean-duplicate-resources.ts --dry-run  # 预览模式
 * npx ts-node scripts/clean-duplicate-resources.ts            # 执行清洗
 */

import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";

const prisma = new PrismaClient();

interface DuplicateGroup {
  canonicalId: string;
  duplicateIds: string[];
  reason: string;
  similarity: number;
}

interface CleaningReport {
  startTime: Date;
  endTime?: Date;
  totalResources: number;
  duplicateGroups: number;
  mergedResources: number;
  deletedResources: number;
  updatedRelations: number;
  errors: string[];
}

// URL 规范化
function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const trackingParams = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "ref",
      "source",
      "fbclid",
      "gclid",
      "msclkid",
      "_ga",
    ];
    trackingParams.forEach((param) => parsed.searchParams.delete(param));
    parsed.protocol = "https:";

    let normalized = parsed.toString();
    if (normalized.endsWith("/")) {
      normalized = normalized.slice(0, -1);
    }

    // 平台特定规范化
    if (normalized.includes("arxiv.org")) {
      const match = normalized.match(/arxiv\.org\/(?:abs|pdf)\/(\d+\.\d+)/);
      if (match) return `https://arxiv.org/abs/${match[1]}`;
    }
    if (normalized.includes("github.com") && !normalized.includes("/blob/")) {
      const match = normalized.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (match) return `https://github.com/${match[1]}/${match[2]}`;
    }

    return normalized.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

// 计算内容指纹
function computeFingerprint(content: string): string {
  if (!content || content.length < 50) return "";
  const normalized = content
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fa5]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .sort()
    .slice(0, 100)
    .join(" ");
  return createHash("sha256").update(normalized).digest("hex").slice(0, 32);
}

// 计算标题指纹
function computeTitleFingerprint(title: string): string {
  if (!title || title.length < 5) return "";
  const normalized = title
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fa5]/g, "")
    .trim();
  return createHash("sha256").update(normalized).digest("hex").slice(0, 16);
}

// Jaccard 相似度
function calculateJaccardSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  const set1 = new Set(str1.toLowerCase().split(/\s+/));
  const set2 = new Set(str2.toLowerCase().split(/\s+/));
  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return intersection.size / union.size;
}

// 评估资源质量
function assessQuality(resource: {
  source?: string | null;
  content?: string | null;
  abstract?: string | null;
  citationCount?: number | null;
  publishedAt?: Date | null;
  authors?: unknown;
}): number {
  let score = 0;

  // 来源可信度
  const sourceScores: Record<string, number> = {
    arxiv: 95,
    semantic_scholar: 90,
    github: 85,
    ieee: 90,
    acm: 90,
    hackernews: 70,
  };
  if (resource.source) {
    score += sourceScores[resource.source.toLowerCase()] || 50;
  }

  // 内容完整度
  if (resource.abstract && resource.abstract.length > 100) score += 20;
  if (resource.content && resource.content.length > 500) score += 30;
  if (resource.authors) score += 10;

  // 新鲜度
  if (resource.publishedAt) {
    const days =
      (Date.now() - new Date(resource.publishedAt).getTime()) / 86400000;
    if (days <= 30) score += 20;
    else if (days <= 90) score += 15;
    else if (days <= 365) score += 10;
  }

  // 引用数
  if (resource.citationCount) {
    score += Math.min(20, resource.citationCount / 5);
  }

  return score;
}

async function findDuplicates(): Promise<DuplicateGroup[]> {
  console.log("正在查找重复资源...");

  const resources = await prisma.resource.findMany({
    select: {
      id: true,
      sourceUrl: true,
      title: true,
      abstract: true,
      content: true,
      source: true,
      publishedAt: true,
      citationCount: true,
      authors: true,
    },
  });

  console.log(`共有 ${resources.length} 个资源`);

  const duplicateGroups: DuplicateGroup[] = [];
  const processed = new Set<string>();

  // 1. 基于 URL 查找重复
  const urlMap = new Map<string, typeof resources>();
  for (const resource of resources) {
    if (!resource.sourceUrl) continue;
    const normalized = normalizeUrl(resource.sourceUrl);
    if (!urlMap.has(normalized)) {
      urlMap.set(normalized, []);
    }
    urlMap.get(normalized)!.push(resource);
  }

  for (const [url, group] of urlMap) {
    if (group.length > 1) {
      // 选择质量最高的作为规范版本
      const sorted = group.sort((a, b) => assessQuality(b) - assessQuality(a));
      const canonical = sorted[0];
      const duplicates = sorted.slice(1).map((r) => r.id);

      duplicates.forEach((id) => processed.add(id));
      processed.add(canonical.id);

      duplicateGroups.push({
        canonicalId: canonical.id,
        duplicateIds: duplicates,
        reason: "url_match",
        similarity: 1.0,
      });
    }
  }

  // 2. 基于标题相似度查找重复
  const remainingResources = resources.filter((r) => !processed.has(r.id));

  for (let i = 0; i < remainingResources.length; i++) {
    if (processed.has(remainingResources[i].id)) continue;

    const resource = remainingResources[i];
    if (!resource.title || resource.title.length < 10) continue;

    const duplicates: string[] = [];
    let maxSimilarity = 0;

    for (let j = i + 1; j < remainingResources.length; j++) {
      if (processed.has(remainingResources[j].id)) continue;

      const other = remainingResources[j];
      if (!other.title) continue;

      const similarity = calculateJaccardSimilarity(
        resource.title,
        other.title,
      );
      if (similarity >= 0.85) {
        duplicates.push(other.id);
        processed.add(other.id);
        maxSimilarity = Math.max(maxSimilarity, similarity);
      }
    }

    if (duplicates.length > 0) {
      processed.add(resource.id);
      duplicateGroups.push({
        canonicalId: resource.id,
        duplicateIds: duplicates,
        reason: "title_similarity",
        similarity: maxSimilarity,
      });
    }
  }

  // 3. 基于内容指纹查找重复
  const fingerprintMap = new Map<string, typeof resources>();
  for (const resource of resources) {
    if (processed.has(resource.id)) continue;
    const content = resource.content || resource.abstract || "";
    const fingerprint = computeFingerprint(content);
    if (!fingerprint) continue;

    if (!fingerprintMap.has(fingerprint)) {
      fingerprintMap.set(fingerprint, []);
    }
    fingerprintMap.get(fingerprint)!.push(resource);
  }

  for (const [fp, group] of fingerprintMap) {
    if (group.length > 1) {
      const sorted = group.sort((a, b) => assessQuality(b) - assessQuality(a));
      const canonical = sorted[0];
      const duplicates = sorted.slice(1).map((r) => r.id);

      duplicateGroups.push({
        canonicalId: canonical.id,
        duplicateIds: duplicates,
        reason: "content_fingerprint",
        similarity: 0.95,
      });
    }
  }

  console.log(`发现 ${duplicateGroups.length} 组重复`);
  return duplicateGroups;
}

async function mergeDuplicates(
  groups: DuplicateGroup[],
  dryRun: boolean,
): Promise<CleaningReport> {
  const report: CleaningReport = {
    startTime: new Date(),
    totalResources: await prisma.resource.count(),
    duplicateGroups: groups.length,
    mergedResources: 0,
    deletedResources: 0,
    updatedRelations: 0,
    errors: [],
  };

  for (const group of groups) {
    try {
      console.log(`\n处理重复组: ${group.canonicalId} (${group.reason})`);
      console.log(`  重复数量: ${group.duplicateIds.length}`);

      if (dryRun) {
        report.mergedResources += group.duplicateIds.length;
        continue;
      }

      // 获取规范资源和重复资源
      const [canonical, ...duplicates] = await Promise.all([
        prisma.resource.findUnique({ where: { id: group.canonicalId } }),
        ...group.duplicateIds.map((id) =>
          prisma.resource.findUnique({ where: { id } }),
        ),
      ]);

      if (!canonical) {
        report.errors.push(`找不到规范资源: ${group.canonicalId}`);
        continue;
      }

      // 合并数据：选择更完整的版本
      const updates: Record<string, unknown> = {};
      for (const dup of duplicates) {
        if (!dup) continue;

        if (
          dup.title &&
          (!canonical.title || dup.title.length > canonical.title.length)
        ) {
          updates.title = dup.title;
        }
        if (
          dup.abstract &&
          (!canonical.abstract ||
            dup.abstract.length > canonical.abstract.length)
        ) {
          updates.abstract = dup.abstract;
        }
        if (
          dup.content &&
          (!canonical.content ||
            dup.content.length > (canonical.content?.length || 0))
        ) {
          updates.content = dup.content;
        }
        if (
          dup.aiSummary &&
          (!canonical.aiSummary ||
            dup.aiSummary.length > canonical.aiSummary.length)
        ) {
          updates.aiSummary = dup.aiSummary;
        }
      }

      // 更新规范资源
      if (Object.keys(updates).length > 0) {
        await prisma.resource.update({
          where: { id: group.canonicalId },
          data: updates,
        });
        report.mergedResources++;
      }

      // 更新 RawData 关联
      const updatedRawData = await prisma.rawData.updateMany({
        where: { resourceId: { in: group.duplicateIds } },
        data: { resourceId: group.canonicalId },
      });
      report.updatedRelations += updatedRawData.count;

      // 删除重复资源
      await prisma.resource.deleteMany({
        where: { id: { in: group.duplicateIds } },
      });
      report.deletedResources += group.duplicateIds.length;

      // 记录去重决策
      await prisma.deduplicationRecord.create({
        data: {
          resourceId: group.canonicalId,
          duplicateOfId: group.duplicateIds[0],
          method: group.reason,
          similarity: group.similarity,
          decision: "MERGED",
          urlHash: "",
          originalData: { mergedIds: group.duplicateIds },
          processedBy: "clean-duplicate-resources.ts",
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      report.errors.push(`处理 ${group.canonicalId} 时出错: ${message}`);
      console.error(`处理 ${group.canonicalId} 时出错:`, error);
    }
  }

  report.endTime = new Date();
  return report;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  console.log("========================================");
  console.log("资源去重清洗脚本");
  console.log(`模式: ${dryRun ? "预览 (dry-run)" : "执行"}`);
  console.log("========================================\n");

  try {
    // 查找重复
    const duplicateGroups = await findDuplicates();

    if (duplicateGroups.length === 0) {
      console.log("\n没有发现重复资源。");
      return;
    }

    // 执行合并
    const report = await mergeDuplicates(duplicateGroups, dryRun);

    // 输出报告
    console.log("\n========================================");
    console.log("清洗报告");
    console.log("========================================");
    console.log(`开始时间: ${report.startTime.toISOString()}`);
    console.log(`结束时间: ${report.endTime?.toISOString() || "N/A"}`);
    console.log(`总资源数: ${report.totalResources}`);
    console.log(`重复组数: ${report.duplicateGroups}`);
    console.log(`合并资源: ${report.mergedResources}`);
    console.log(`删除资源: ${report.deletedResources}`);
    console.log(`更新关联: ${report.updatedRelations}`);

    if (report.errors.length > 0) {
      console.log(`\n错误 (${report.errors.length}):`);
      report.errors.forEach((err) => console.log(`  - ${err}`));
    }

    if (dryRun) {
      console.log("\n[预览模式] 以上操作未实际执行。");
      console.log("移除 --dry-run 参数以执行清洗。");
    }
  } catch (error) {
    console.error("脚本执行失败:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
