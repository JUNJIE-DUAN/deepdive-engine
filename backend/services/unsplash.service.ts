/**
 * Unsplash API 图片搜索服务
 * 用于在文档生成过程中查找相关图片
 */

interface UnsplashImage {
  id: string;
  description: string | null;
  alt_description: string | null;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  user: {
    name: string;
    username: string;
  };
  links: {
    html: string;
    download_location: string;
  };
  width: number;
  height: number;
}

interface UnsplashSearchResult {
  total: number;
  total_pages: number;
  results: UnsplashImage[];
}

export interface ImageSearchResult {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnailUrl: string;
  source: string;
  sourceUrl: string;
  author: string;
  authorUrl: string;
  width: number;
  height: number;
  relevanceScore?: number;
}

class UnsplashService {
  private apiKey: string;
  private baseUrl = "https://api.unsplash.com";

  constructor() {
    this.apiKey = process.env.UNSPLASH_ACCESS_KEY || "";
  }

  /**
   * 搜索图片
   * @param query 搜索关键词
   * @param count 返回数量
   * @returns 图片搜索结果列表
   */
  async searchImages(
    query: string,
    count: number = 10,
  ): Promise<ImageSearchResult[]> {
    if (!this.apiKey) {
      console.warn("Unsplash API key not configured, returning empty results");
      return [];
    }

    try {
      const url = new URL(`${this.baseUrl}/search/photos`);
      url.searchParams.append("query", query);
      url.searchParams.append("per_page", Math.min(count, 30).toString());
      url.searchParams.append("orientation", "landscape");

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Client-ID ${this.apiKey}`,
          "Accept-Version": "v1",
        },
      });

      if (!response.ok) {
        throw new Error(`Unsplash API error: ${response.statusText}`);
      }

      const data: UnsplashSearchResult = await response.json();

      return data.results.map((image) => ({
        id: image.id,
        title: image.description || image.alt_description || "Untitled",
        description: image.alt_description || image.description || "",
        url: image.urls.regular,
        thumbnailUrl: image.urls.thumb,
        source: "Unsplash",
        sourceUrl: image.links.html,
        author: image.user.name,
        authorUrl: `https://unsplash.com/@${image.user.username}`,
        width: image.width,
        height: image.height,
      }));
    } catch (error) {
      console.error("Unsplash search error:", error);
      return [];
    }
  }

  /**
   * 从文本中提取关键词并搜索图片
   * @param text 文本内容
   * @param count 每个关键词返回的图片数量
   * @returns 图片搜索结果列表
   */
  async searchImagesFromText(
    text: string,
    count: number = 5,
  ): Promise<ImageSearchResult[]> {
    // 提取关键词（简单实现，可以使用NLP服务优化）
    const keywords = this.extractKeywords(text);

    if (keywords.length === 0) {
      return [];
    }

    // 搜索所有关键词
    const searchPromises = keywords
      .slice(0, 3)
      .map((keyword) => this.searchImages(keyword, Math.ceil(count / 3)));

    const results = await Promise.all(searchPromises);

    // 合并结果并去重
    const allImages = results.flat();
    const uniqueImages = this.deduplicateImages(allImages);

    return uniqueImages.slice(0, count);
  }

  /**
   * 从文本中提取关键词
   * @param text 文本内容
   * @returns 关键词列表
   */
  private extractKeywords(text: string): string[] {
    // 移除标点符号和特殊字符
    const cleaned = text
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fa5]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // 分词（简单按空格分割，中文需要分词库）
    const words = cleaned.split(" ");

    // 过滤停用词（简化版）
    const stopWords = new Set([
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
      "from",
      "as",
      "is",
      "was",
      "are",
      "were",
      "be",
      "的",
      "了",
      "在",
      "是",
      "我",
      "有",
      "和",
      "就",
      "不",
      "人",
      "都",
      "一",
      "一个",
      "上",
      "也",
      "很",
      "到",
      "说",
      "要",
      "去",
      "你",
      "会",
      "着",
      "没有",
    ]);

    const keywords = words
      .filter((word) => word.length > 2 && !stopWords.has(word))
      .slice(0, 10); // 限制关键词数量

    // 返回前几个关键词
    return [...new Set(keywords)];
  }

  /**
   * 去除重复图片
   * @param images 图片列表
   * @returns 去重后的图片列表
   */
  private deduplicateImages(images: ImageSearchResult[]): ImageSearchResult[] {
    const seen = new Set<string>();
    const unique: ImageSearchResult[] = [];

    for (const image of images) {
      if (!seen.has(image.id)) {
        seen.add(image.id);
        unique.push(image);
      }
    }

    return unique;
  }

  /**
   * 根据相关性对图片进行评分和排序
   * @param images 图片列表
   * @param query 搜索查询
   * @returns 排序后的图片列表
   */
  rankImagesByRelevance(
    images: ImageSearchResult[],
    query: string,
  ): ImageSearchResult[] {
    const queryLower = query.toLowerCase();

    return images
      .map((image) => {
        let score = 0;

        // 标题匹配
        if (image.title.toLowerCase().includes(queryLower)) {
          score += 10;
        }

        // 描述匹配
        if (image.description.toLowerCase().includes(queryLower)) {
          score += 5;
        }

        // 图片尺寸偏好（宽度 > 1000px 加分）
        if (image.width > 1000) {
          score += 2;
        }

        return {
          ...image,
          relevanceScore: score,
        };
      })
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  }
}

// 单例导出
export const unsplashService = new UnsplashService();
