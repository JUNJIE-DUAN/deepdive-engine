import express from "express";
import { unsplashService } from "../../services/unsplash.service";

const router = express.Router();

/**
 * POST /api/v1/ai-office/search-images
 * 搜索相关图片
 */
router.post("/", async (req, res) => {
  try {
    const { query, text, count = 10 } = req.body;

    let images = [];

    if (query) {
      // 直接使用查询关键词搜索
      images = await unsplashService.searchImages(query, count);
    } else if (text) {
      // 从文本中提取关键词并搜索
      images = await unsplashService.searchImagesFromText(text, count);
    } else {
      return res.status(400).json({
        success: false,
        error: "Query or text is required",
      });
    }

    // 如果提供了查询词，按相关性排序
    if (query && images.length > 0) {
      images = unsplashService.rankImagesByRelevance(images, query);
    }

    res.json({
      success: true,
      images,
      total: images.length,
    });
  } catch (error) {
    console.error("Image search error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      images: [],
      total: 0,
    });
  }
});

export default router;
