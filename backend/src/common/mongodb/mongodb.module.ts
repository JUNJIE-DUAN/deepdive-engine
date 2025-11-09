import { Global, Module } from '@nestjs/common';
import { MongoDBService } from './mongodb.service';

/**
 * MongoDB 全局模块
 */
@Global()
@Module({
  providers: [MongoDBService],
  exports: [MongoDBService],
})
export class MongoDBModule {}
