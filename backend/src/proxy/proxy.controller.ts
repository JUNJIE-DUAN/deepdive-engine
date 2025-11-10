import {
  Controller,
  Get,
  Query,
  Res,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Response } from "express";
import axios from "axios";

/**
 * 代理控制器 - 用于代理外部资源（如 PDF），绕过 CORS 和 X-Frame-Options 限制
 */
@Controller("proxy")
export class ProxyController {
  /**
   * 代理 PDF 文件
   *
   * 解决问题：
   * 1. arXiv 等网站的 X-Frame-Options: DENY 阻止 iframe 嵌入
   * 2. CORS 跨域限制
   *
   * 使用方式：
   * http://localhost:4000/api/v1/proxy/pdf?url=https://arxiv.org/pdf/2511.04676v1
   */
  @Get("pdf")
  async proxyPdf(
    @Query("url") url: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!url) {
      throw new HttpException(
        "URL parameter is required",
        HttpStatus.BAD_REQUEST,
      );
    }

    // 安全检查：只允许代理特定域名的 PDF
    const allowedDomains = [
      "arxiv.org",
      "openreview.net",
      "papers.nips.cc",
      "proceedings.mlr.press",
      "github.com",
      "raw.githubusercontent.com",
      "reddit.com",
      "old.reddit.com",
      "forbes.com",
      "www.forbes.com",
      "medium.com",
      "towardsdatascience.com",
      "blog.google",
      "ai.googleblog.com",
      "openai.com",
      "blog.openai.com",
      "deepmind.com",
      "deepmind.google",
      "techcrunch.com",
      "venturebeat.com",
      "wired.com",
      "theverge.com",
      "arstechnica.com",
      "news.ycombinator.com",
    ];

    try {
      const urlObj = new URL(url);
      const isAllowed = allowedDomains.some(
        (domain) =>
          urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`),
      );

      if (!isAllowed) {
        throw new HttpException(
          `Domain ${urlObj.hostname} is not allowed. Allowed domains: ${allowedDomains.join(", ")}`,
          HttpStatus.FORBIDDEN,
        );
      }

      // 从远程服务器获取 PDF
      const response = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 30000, // 30 seconds timeout
        maxRedirects: 5, // 跟随重定向
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Accept-Encoding": "gzip, deflate, br",
          DNT: "1",
          Connection: "keep-alive",
          "Upgrade-Insecure-Requests": "1",
        },
      });

      // 设置响应头，允许在 iframe 中显示
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "inline");
      // 关键：不设置 X-Frame-Options，允许 iframe 嵌入
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "public, max-age=86400"); // 缓存 24 小时

      // 发送 PDF 数据
      res.send(Buffer.from(response.data));
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      if (axios.isAxiosError(error)) {
        throw new HttpException(
          `Failed to fetch PDF: ${error.message}`,
          error.response?.status || HttpStatus.BAD_GATEWAY,
        );
      }

      throw new HttpException(
        "Internal server error while proxying PDF",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 代理 HTML 页面
   *
   * 解决问题：
   * 1. arXiv 等网站的 X-Frame-Options: SAMEORIGIN 阻止 iframe 嵌入
   * 2. CORS 跨域限制
   *
   * 使用方式：
   * http://localhost:4000/api/v1/proxy/html?url=https://arxiv.org/abs/2511.04675v1
   */
  @Get("html")
  async proxyHtml(
    @Query("url") url: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!url) {
      throw new HttpException(
        "URL parameter is required",
        HttpStatus.BAD_REQUEST,
      );
    }

    // 安全检查：只允许代理特定域名
    const allowedDomains = [
      "arxiv.org",
      "openreview.net",
      "papers.nips.cc",
      "proceedings.mlr.press",
      "github.com",
      "raw.githubusercontent.com",
      "reddit.com",
      "old.reddit.com",
      "forbes.com",
      "www.forbes.com",
      "medium.com",
      "towardsdatascience.com",
      "blog.google",
      "ai.googleblog.com",
      "openai.com",
      "blog.openai.com",
      "deepmind.com",
      "deepmind.google",
      "techcrunch.com",
      "venturebeat.com",
      "wired.com",
      "theverge.com",
      "arstechnica.com",
      "news.ycombinator.com",
    ];

    try {
      const urlObj = new URL(url);
      const isAllowed = allowedDomains.some(
        (domain) =>
          urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`),
      );

      if (!isAllowed) {
        throw new HttpException(
          `Domain ${urlObj.hostname} is not allowed. Allowed domains: ${allowedDomains.join(", ")}`,
          HttpStatus.FORBIDDEN,
        );
      }

      // 从远程服务器获取 HTML
      const response = await axios.get(url, {
        responseType: "text",
        timeout: 30000,
        maxRedirects: 5, // 跟随重定向
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Accept-Encoding": "gzip, deflate, br",
          Referer: "https://www.reddit.com/",
          DNT: "1",
          Connection: "keep-alive",
          "Upgrade-Insecure-Requests": "1",
        },
      });

      // 设置响应头，允许在 iframe 中显示
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      // 关键：不设置 X-Frame-Options，允许 iframe 嵌入
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "public, max-age=3600"); // 缓存 1 小时

      // 修改 HTML，添加 base 标签以正确加载资源
      let html = response.data as string;
      const baseUrl = `${urlObj.protocol}//${urlObj.hostname}`;

      // 在 <head> 标签后插入 <base> 标签
      if (html.includes("<head>")) {
        html = html.replace("<head>", `<head><base href="${baseUrl}/">`);
      } else if (html.includes("<HEAD>")) {
        html = html.replace("<HEAD>", `<HEAD><base href="${baseUrl}/">`);
      }

      // 发送修改后的 HTML 数据
      res.send(html);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      if (axios.isAxiosError(error)) {
        throw new HttpException(
          `Failed to fetch HTML: ${error.message}`,
          error.response?.status || HttpStatus.BAD_GATEWAY,
        );
      }

      throw new HttpException(
        "Internal server error while proxying HTML",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
