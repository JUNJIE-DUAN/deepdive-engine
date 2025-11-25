import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { AiController } from "./ai.controller";
import { AiService } from "./ai.service";
import { AiChatService } from "./ai-chat.service";
import { SearchService } from "./search.service";
import { PrismaModule } from "../../common/prisma/prisma.module";

@Module({
  imports: [HttpModule, PrismaModule],
  controllers: [AiController],
  providers: [AiService, AiChatService, SearchService],
  exports: [AiService, AiChatService, SearchService],
})
export class AiModule {}
