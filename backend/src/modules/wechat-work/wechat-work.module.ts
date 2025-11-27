import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { WechatWorkController } from "./wechat-work.controller";
import { WechatWorkService } from "./wechat-work.service";
import { WechatWorkCryptoService } from "./wechat-work-crypto.service";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { AiModule } from "../ai/ai.module";

@Module({
  imports: [HttpModule, PrismaModule, AiModule],
  controllers: [WechatWorkController],
  providers: [WechatWorkService, WechatWorkCryptoService],
  exports: [WechatWorkService],
})
export class WechatWorkModule {}
