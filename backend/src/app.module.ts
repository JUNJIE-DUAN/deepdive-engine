import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "./common/prisma/prisma.module";
import { MongoDBModule } from "./common/mongodb/mongodb.module";
import { Neo4jModule } from "./common/neo4j/neo4j.module";
import { CrawlerModule } from "./crawler/crawler.module";
import { ResourcesModule } from "./resources/resources.module";
import { FeedModule } from "./feed/feed.module";
import { KnowledgeGraphModule } from "./knowledge-graph/knowledge-graph.module";
import { ProxyModule } from "./proxy/proxy.module";
import { RecommendationsModule } from "./recommendations/recommendations.module";
import { AuthModule } from "./auth/auth.module";
import { CollectionsModule } from "./collections/collections.module";
import { NotesModule } from "./notes/notes.module";
import { CommentsModule } from "./comments/comments.module";
import { ReportsModule } from "./reports/reports.module";
import { YoutubeVideosModule } from "./youtube-videos/youtube-videos.module";
import { YoutubeModule } from "./youtube/youtube.module";
import { WorkspaceModule } from "./workspace/workspace.module";
// import { LearningPathsModule } from './learning-paths/learning-paths.module'; // TODO: Enable later

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),

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
    // LearningPathsModule, // TODO: Enable later
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
