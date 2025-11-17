import { Module } from "@nestjs/common";
import { ProxyController } from "./proxy.controller";
import { AdvancedExtractorService } from "./advanced-extractor.service";

@Module({
  controllers: [ProxyController],
  providers: [AdvancedExtractorService],
})
export class ProxyModule {}
