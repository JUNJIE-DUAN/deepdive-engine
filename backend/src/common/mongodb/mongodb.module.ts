import { Global, Module } from "@nestjs/common";
import { MongoDBService } from "./mongodb.service.postgres";
import { RawDataModule } from "../rawdata/rawdata.module";

/**
 * MongoDB 兼容模块 (使用 PostgreSQL)
 * Drop-in replacement using PostgreSQL JSONB instead of MongoDB
 */
@Global()
@Module({
  imports: [RawDataModule],
  providers: [MongoDBService],
  exports: [MongoDBService],
})
export class MongoDBModule {}
