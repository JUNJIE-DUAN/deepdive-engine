import { Injectable, Logger } from "@nestjs/common";
import { createHash } from "crypto";

/**
 * 去重服务
 * 实现 URL 哈希去重和标题相似度检测
 */
@Injectable()
export class DeduplicationService {
  private readonly logger = new Logger(DeduplicationService.name);

  /**
   * 生成 URL 的 MD5 哈希
   */
  generateUrlHash(url: string): string {
    return createHash("md5").update(url.trim().toLowerCase()).digest("hex");
  }

  /**
   * 生成内容指纹（标题 + 关键字段）
   */
  generateContentFingerprint(
    title: string,
    additionalFields?: string[],
  ): string {
    const content = [title, ...(additionalFields || [])]
      .join("|")
      .trim()
      .toLowerCase();
    return createHash("md5").update(content).digest("hex");
  }

  /**
   * 计算 Levenshtein 距离（字符串相似度）
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;
    const dp: number[][] = Array(m + 1)
      .fill(null)
      .map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]) + 1;
        }
      }
    }

    return dp[m][n];
  }

  /**
   * 计算标题相似度（0-1，1 表示完全相同）
   */
  calculateTitleSimilarity(title1: string, title2: string): number {
    const s1 = title1.toLowerCase().trim();
    const s2 = title2.toLowerCase().trim();

    if (s1 === s2) return 1.0;

    const maxLen = Math.max(s1.length, s2.length);
    if (maxLen === 0) return 1.0;

    const distance = this.levenshteinDistance(s1, s2);
    return 1 - distance / maxLen;
  }

  /**
   * 判断两个标题是否相似（阈值 0.85）
   */
  areTitlesSimilar(title1: string, title2: string, threshold = 0.85): boolean {
    const similarity = this.calculateTitleSimilarity(title1, title2);
    return similarity >= threshold;
  }

  /**
   * 规范化 URL（移除 query 参数、hash、trailing slash，转换为小写）
   */
  normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // 转换为小写
      urlObj.protocol = urlObj.protocol.toLowerCase();
      urlObj.hostname = urlObj.hostname.toLowerCase();
      urlObj.pathname = urlObj.pathname.toLowerCase();
      // 移除 query 参数和 hash
      urlObj.search = "";
      urlObj.hash = "";
      let normalized = urlObj.toString();
      // 移除所有 trailing slash（包括根路径）
      if (normalized.endsWith("/")) {
        normalized = normalized.slice(0, -1);
      }
      return normalized;
    } catch (error) {
      this.logger.warn(`Failed to normalize URL: ${url}`);
      return url.trim().toLowerCase();
    }
  }

  /**
   * 提取域名
   */
  extractDomain(url: string): string | null {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (error) {
      return null;
    }
  }

  /**
   * 批量检测重复（返回重复项的索引）
   * 检测基于：1) URL精确匹配  2) 标题相似度
   * 注意：批量检测使用较低的阈值（0.75）以提高召回率
   */
  detectDuplicatesInBatch(
    items: Array<{ url: string; title: string }>,
    titleSimilarityThreshold = 0.75,
  ): number[] {
    const duplicateIndices: number[] = [];
    const seen = new Map<string, number>();
    const processedItems: Array<{ url: string; title: string; index: number }> =
      [];

    items.forEach((item, index) => {
      const urlHash = this.generateUrlHash(this.normalizeUrl(item.url));
      let isDuplicate = false;

      // 检查URL重复
      if (seen.has(urlHash)) {
        duplicateIndices.push(index);
        isDuplicate = true;
        this.logger.debug(
          `URL duplicate detected: ${item.title} (index ${index})`,
        );
      } else {
        // 检查标题相似度重复
        for (const processed of processedItems) {
          if (
            this.areTitlesSimilar(
              item.title,
              processed.title,
              titleSimilarityThreshold,
            )
          ) {
            duplicateIndices.push(index);
            isDuplicate = true;
            this.logger.debug(
              `Title similarity duplicate detected: "${item.title}" similar to "${processed.title}" (index ${index})`,
            );
            break;
          }
        }
      }

      if (!isDuplicate) {
        seen.set(urlHash, index);
        processedItems.push({ ...item, index });
      }
    });

    return duplicateIndices;
  }

  /**
   * 清理文本（移除多余空格、换行等）
   */
  cleanText(text: string): string {
    if (!text) return "";
    return text
      .replace(/\s+/g, " ") // 多个空格替换为单个
      .replace(/\n+/g, " ") // 换行替换为空格
      .trim();
  }
}
