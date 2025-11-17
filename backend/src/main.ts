import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { isWorkspaceAiV2Enabled } from './common/utils/feature-flags';
// Force reload after CORS fix

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 启用安全头 (Helmet) - 但对代理路由禁用CSP
  app.use((req: Request, res: Response, next: NextFunction) => {
    // 对代理路由禁用CSP和X-Frame-Options
    if (req.path.startsWith('/api/v1/proxy/')) {
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
            imgSrc: ["'self'", 'data:', 'https:'],
            frameSrc: ["'self'", 'http://localhost:*'], // 允许localhost的iframe
            frameAncestors: ["'self'", 'http://localhost:*'], // 允许被localhost的页面嵌入
            upgradeInsecureRequests: null, // 开发环境禁用HTTPS升级
          },
        },
        crossOriginEmbedderPolicy: false, // 允许跨域资源嵌入
        frameguard: false, // 禁用X-Frame-Options
      })(req, res, next);
    }
  });

  // 启用CORS - 允许所有localhost端口（开发环境）
  app.enableCors({
    origin: (origin, callback) => {
      console.log('CORS origin check:', origin);
      // 允许所有localhost端口、127.0.0.1、IPv6 localhost和undefined（同源请求）
      if (
        !origin ||
        origin.match(/^http:\/\/localhost:\d+$/) ||
        origin.match(/^http:\/\/127\.0\.0\.1:\d+$/) ||
        origin.match(/^http:\/\/\[::1\]:\d+$/)
      ) {
        callback(null, true);
      } else {
        console.error('CORS rejected origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  // 启用全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    })
  );

  // 启用全局异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter());

  // API前缀
  app.setGlobalPrefix('api/v1');

  const port = process.env.BACKEND_PORT || 4000;
  await app.listen(port);

  console.log(`🚀 DeepDive Backend running on http://localhost:${port}`);
  console.log(`📚 API Docs: http://localhost:${port}/api/v1`);
  console.log(`🧩 Workspace AI v2 enabled: ${isWorkspaceAiV2Enabled()}`);
}

void bootstrap();
