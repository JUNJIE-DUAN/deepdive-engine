import { Module } from "@nestjs/common";
import { GlobalDeduplicationService } from "./deduplication.service";

/**
 * 全局去重模块
 *
 * 提供 URL 规范化、内容指纹和相似度检测功能
 * 用于在跨源采集中识别和移除重复数据
 */
@Module({
  providers: [GlobalDeduplicationService],
  exports: [GlobalDeduplicationService],
})
export class DeduplicationModule {}
