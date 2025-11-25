import { Module } from "@nestjs/common";
import { AiGroupController, UsersController } from "./ai-group.controller";
import { AiGroupService } from "./ai-group.service";
import { AiGroupGateway } from "./ai-group.gateway";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { AiModule } from "../ai/ai.module";

@Module({
  imports: [PrismaModule, AiModule],
  controllers: [AiGroupController, UsersController],
  providers: [AiGroupService, AiGroupGateway],
  exports: [AiGroupService],
})
export class AiGroupModule {}
