import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { AiController } from "./ai.controller";
import { AiService } from "./ai.service";
import { AiChatService } from "./ai-chat.service";

@Module({
  imports: [HttpModule],
  controllers: [AiController],
  providers: [AiService, AiChatService],
  exports: [AiService, AiChatService],
})
export class AiModule {}
