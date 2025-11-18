import { Module, OnModuleInit } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { SourceWhitelistService } from "./services/source-whitelist.service";
import { SourceWhitelistController } from "./controllers/source-whitelist.controller";
import { CollectionRuleService } from "./services/collection-rule.service";
import { CollectionRuleController } from "./controllers/collection-rule.controller";

/**
 * Data Management Module
 * 整合数据管理相关的服务、控制器和子模块
 * 包括：
 * - 来源白名单管理
 * - 采集规则引擎
 * - 采集任务监控
 * - 数据质量管理
 */
@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [SourceWhitelistService, CollectionRuleService],
  controllers: [SourceWhitelistController, CollectionRuleController],
  exports: [SourceWhitelistService, CollectionRuleService],
})
export class DataManagementModule implements OnModuleInit {
  constructor(
    private sourceWhitelistService: SourceWhitelistService,
    private collectionRuleService: CollectionRuleService,
  ) {}

  /**
   * 模块初始化时初始化默认白名单和采集规则
   */
  async onModuleInit() {
    try {
      await this.sourceWhitelistService.initializeDefaultWhitelists();
      await this.collectionRuleService.initializeDefaultRules();
    } catch (error) {
      // 不要让初始化错误阻止应用启动
      console.warn("Failed to initialize data management defaults:", error);
    }
  }
}
