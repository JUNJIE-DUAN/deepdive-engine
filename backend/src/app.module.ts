import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './common/prisma/prisma.module';
import { MongoDBModule } from './common/mongodb/mongodb.module';
import { Neo4jModule } from './common/neo4j/neo4j.module';
import { CrawlerModule } from './crawler/crawler.module';
import { ResourcesModule } from './resources/resources.module';
import { FeedModule } from './feed/feed.module';
import { KnowledgeGraphModule } from './knowledge-graph/knowledge-graph.module';
import { ProxyModule } from './proxy/proxy.module';
// import { RecommendationsModule } from './recommendations/recommendations.module';
// import { AuthModule } from './auth/auth.module';
// import { CollectionsModule } from './collections/collections.module';
// import { LearningPathsModule } from './learning-paths/learning-paths.module';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
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
    // RecommendationsModule, // TODO: Fix schema mismatch
    // AuthModule,          // TODO: Fix schema mismatch
    // CollectionsModule,   // TODO: Fix schema mismatch
    // LearningPathsModule, // TODO: Fix schema mismatch
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
