import { Module } from "@nestjs/common";
import { AiImageController } from "./ai-image.controller";
import { AiImageService } from "./ai-image.service";
import { PrismaModule } from "../../common/prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [AiImageController],
  providers: [AiImageService],
  exports: [AiImageService],
})
export class AiImageModule {}
