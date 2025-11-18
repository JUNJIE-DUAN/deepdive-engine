import { Module } from "@nestjs/common";
import { YoutubeController } from "./youtube.controller";
import { YoutubeService } from "./youtube.service";
import { PdfGeneratorService } from "./pdf-generator.service";

@Module({
  controllers: [YoutubeController],
  providers: [YoutubeService, PdfGeneratorService],
  exports: [YoutubeService, PdfGeneratorService],
})
export class YoutubeModule {}
