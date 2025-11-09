import { Module } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { RecommendationsController } from './recommendations.controller';
import { PrismaModule } from '../common/prisma/prisma.module';
import { Neo4jModule } from '../common/neo4j/neo4j.module';

/**
 * 推荐系统模块
 */
@Module({
  imports: [PrismaModule, Neo4jModule],
  controllers: [RecommendationsController],
  providers: [RecommendationsService],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}
