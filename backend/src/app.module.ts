import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ServeStaticModule } from "@nestjs/serve-static";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { join } from "path";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "./common/prisma/prisma.module";
import { MongoDBModule } from "./common/mongodb/mongodb.module";
import { Neo4jModule } from "./common/neo4j/neo4j.module";
import { CrawlerModule } from "./modules/crawler/crawler.module";
import { ResourcesModule } from "./modules/resources/resources.module";
import { FeedModule } from "./modules/feed/feed.module";
import { KnowledgeGraphModule } from "./modules/knowledge-graph/knowledge-graph.module";
import { ProxyModule } from "./modules/proxy/proxy.module";
import { RecommendationsModule } from "./modules/recommendations/recommendations.module";
import { AuthModule } from "./modules/auth/auth.module";
import { CollectionsModule } from "./modules/collections/collections.module";
import { NotesModule } from "./modules/notes/notes.module";
import { CommentsModule } from "./modules/comments/comments.module";
import { ReportsModule } from "./modules/reports/reports.module";
import { YoutubeVideosModule } from "./modules/youtube-videos/youtube-videos.module";
import { YoutubeModule } from "./modules/youtube/youtube.module";
import { WorkspaceModule } from "./modules/workspace/workspace.module";
import { AiModule } from "./modules/ai/ai.module";
import { BlogCollectionModule } from "./modules/blog-collection/blog-collection.module";
import { DataManagementModule } from "./modules/data-management/data-management.module";
// import { AiOfficeModule } from "./ai-office/ai-office.module"; // Moved to backup - export handled by frontend
// import { LearningPathsModule } from './modules/learning-paths/learning-paths.module'; // TODO: Enable later

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),

    // API限流保护 - 全局默认60请求/分钟
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 时间窗口：60秒
        limit: 60, // 限制：60次请求
      },
    ]),

    // 静态文件服务
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "..", "public"),
      serveRoot: "/",
    }),

    // 数据库模块
    PrismaModule,
    MongoDBModule,
    Neo4jModule,

    // 功能模块
    CrawlerModule,
    ResourcesModule,
    FeedModule,
    KnowledgeGraphModule,
    ProxyModule,
    RecommendationsModule,
    AuthModule,
    CollectionsModule,
    NotesModule,
    CommentsModule,
    ReportsModule,
    YoutubeModule,
    YoutubeVideosModule,
    WorkspaceModule,
    AiModule,
    BlogCollectionModule,
    DataManagementModule,
    // AiOfficeModule, // Moved to backup - export handled by frontend
    // LearningPathsModule, // TODO: Enable later
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // 全局启用限流守卫
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
