import { Module } from "@nestjs/common";
import { YoutubeVideosController } from "./youtube-videos.controller";
import { YoutubeVideosService } from "./youtube-videos.service";
import { PrismaModule } from "../common/prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [YoutubeVideosController],
  providers: [YoutubeVideosService],
  exports: [YoutubeVideosService],
})
export class YoutubeVideosModule {}
