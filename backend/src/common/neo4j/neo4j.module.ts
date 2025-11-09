import { Module, Global } from '@nestjs/common';
import { Neo4jService } from './neo4j.service';

/**
 * Neo4j 模块（全局）
 */
@Global()
@Module({
  providers: [Neo4jService],
  exports: [Neo4jService],
})
export class Neo4jModule {}
