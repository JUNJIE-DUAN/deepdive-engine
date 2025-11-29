import { Module } from "@nestjs/common";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { AiModule } from "../ai/ai.module";
import { AiStudioController } from "./ai-studio.controller";
import { AiStudioService } from "./ai-studio.service";
import { AiStudioSourceService } from "./ai-studio-source.service";
import { AiStudioChatService } from "./ai-studio-chat.service";
import { AiStudioOutputService } from "./ai-studio-output.service";

@Module({
  imports: [PrismaModule, AiModule],
  controllers: [AiStudioController],
  providers: [
    AiStudioService,
    AiStudioSourceService,
    AiStudioChatService,
    AiStudioOutputService,
  ],
  exports: [
    AiStudioService,
    AiStudioSourceService,
    AiStudioChatService,
    AiStudioOutputService,
  ],
})
export class AiStudioModule {}
