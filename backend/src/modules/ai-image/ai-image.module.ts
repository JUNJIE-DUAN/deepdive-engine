import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { AiImageController } from "./ai-image.controller";
import { AiImageService } from "./ai-image.service";
import { PrismaModule } from "../../common/prisma/prisma.module";

@Module({
  imports: [PrismaModule, HttpModule],
  controllers: [AiImageController],
  providers: [AiImageService],
  exports: [AiImageService],
})
export class AiImageModule {}
