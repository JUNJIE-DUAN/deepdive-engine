import { Module } from "@nestjs/common";
import { CrawlerController } from "./crawler.controller";
import { ArxivService } from "./arxiv.service";
import { GithubService } from "./github.service";
import { HackernewsService } from "./hackernews.service";
import { HackernewsCommentsService } from "./hackernews-comments.service";
import { DeduplicationService } from "./deduplication.service";
import { ResourcesModule } from "../resources/resources.module";

/**
 * 数据采集器模块
 */
@Module({
  imports: [ResourcesModule],
  controllers: [CrawlerController],
  providers: [
    ArxivService,
    GithubService,
    HackernewsService,
    HackernewsCommentsService,
    DeduplicationService,
  ],
  exports: [
    ArxivService,
    GithubService,
    HackernewsService,
    HackernewsCommentsService,
    DeduplicationService,
  ],
})
export class CrawlerModule {}
