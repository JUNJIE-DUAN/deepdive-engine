import { Module, Global } from "@nestjs/common";
import { Neo4jService } from "./neo4j.service.postgres";
import { GraphModule } from "../graph/graph.module";

/**
 * Neo4j 模块（全局，使用 PostgreSQL 实现）
 */
@Global()
@Module({
  imports: [GraphModule],
  providers: [Neo4jService],
  exports: [Neo4jService],
})
export class Neo4jModule {}
