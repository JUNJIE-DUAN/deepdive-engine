import { Module } from '@nestjs/common';
import { KnowledgeGraphService } from './knowledge-graph.service';
import { KnowledgeGraphController } from './knowledge-graph.controller';
import { Neo4jModule } from '../common/neo4j/neo4j.module';
import { PrismaModule } from '../common/prisma/prisma.module';

/**
 * 知识图谱模块
 */
@Module({
  imports: [Neo4jModule, PrismaModule],
  controllers: [KnowledgeGraphController],
  providers: [KnowledgeGraphService],
  exports: [KnowledgeGraphService],
})
export class KnowledgeGraphModule {}
