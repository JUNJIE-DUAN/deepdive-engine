import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import helmet from "helmet";
import { Request, Response, NextFunction } from "express";
import * as express from "express";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { isWorkspaceAiV2Enabled } from "./common/utils/feature-flags";
// Force reload after CORS fix

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 增加请求体大小限制，支持大型字幕数据
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // 启用安全头 (Helmet) - 但对代理路由禁用CSP
  app.use((req: Request, res: Response, next: NextFunction) => {
    // 对代理路由禁用CSP和X-Frame-Options
    if (req.path.startsWith("/api/v1/proxy/")) {
      helmet({
        contentSecurityPolicy: false, // 完全禁用CSP
        frameguard: false, // 禁用X-Frame-Options
        crossOriginEmbedderPolicy: false,
      })(req, res, next);
    } else {
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            frameSrc: ["'self'", "http://localhost:*"], // 允许localhost的iframe
            frameAncestors: ["'self'", "http://localhost:*"], // 允许被localhost的页面嵌入
            upgradeInsecureRequests: null, // 开发环境禁用HTTPS升级
          },
        },
        crossOriginEmbedderPolicy: false, // 允许跨域资源嵌入
        frameguard: false, // 禁用X-Frame-Options
      })(req, res, next);
    }
  });

  // 启用CORS - 支持开发和生产环境
  const allowedOrigins = process.env.CORS_ORIGINS?.split(",") || [];
  app.enableCors({
    origin: (origin, callback) => {
      // 允许所有localhost端口（开发环境）
      const isLocalhost =
        !origin ||
        origin.match(/^http:\/\/localhost:\d+$/) ||
        origin.match(/^http:\/\/127\.0\.0\.1:\d+$/) ||
        origin.match(/^http:\/\/\[::1\]:\d+$/);

      // 允许Railway域名（生产环境）
      const isRailway = origin?.includes(".railway.app");

      // 允许配置的域名
      const isAllowed = allowedOrigins.some((allowed) =>
        origin?.includes(allowed),
      );

      if (isLocalhost || isRailway || isAllowed) {
        callback(null, true);
      } else {
        console.error("CORS rejected origin:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  });

  // 启用全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // 启用全局异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter());

  // 添加根路径健康检查（供Railway healthcheck使用，不受全局前缀影响）
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get("/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "DeepDive Backend",
      version: "1.0.0",
    });
  });

  // API前缀
  app.setGlobalPrefix("api/v1");

  // Railway uses PORT, fallback to BACKEND_PORT for local dev
  const port = process.env.PORT || process.env.BACKEND_PORT || 4000;
  await app.listen(port);

  console.log(`🚀 DeepDive Backend running on http://localhost:${port}`);
  console.log(`📚 API Docs: http://localhost:${port}/api/v1`);
  console.log(`🧩 Workspace AI v2 enabled: ${isWorkspaceAiV2Enabled()}`);
}

void bootstrap();
