import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
// Force reload after CORS fix

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 启用CORS - 允许所有localhost端口（开发环境）
  app.enableCors({
    origin: (origin, callback) => {
      // 允许所有localhost端口和undefined（同源请求）
      if (!origin || origin.match(/^http:\/\/localhost:\d+$/)) {
        callback(null, true);
      } else {
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

  // API前缀
  app.setGlobalPrefix('api/v1');

  const port = process.env.BACKEND_PORT || 4000;
  await app.listen(port);

  console.log(`🚀 DeepDive Backend running on http://localhost:${port}`);
  console.log(`📚 API Docs: http://localhost:${port}/api/v1`);
}

void bootstrap();
