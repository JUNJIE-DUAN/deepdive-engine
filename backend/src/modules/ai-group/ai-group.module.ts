import { Module } from "@nestjs/common";
import { AiGroupController } from "./ai-group.controller";
import { AiGroupService } from "./ai-group.service";
// TODO: Enable WebSocket gateway after installing @nestjs/websockets and socket.io
// import { AiGroupGateway } from './ai-group.gateway';
import { PrismaModule } from "../../common/prisma/prisma.module";
import { AiModule } from "../ai/ai.module";

@Module({
  imports: [PrismaModule, AiModule],
  controllers: [AiGroupController],
  providers: [AiGroupService],
  // TODO: Add AiGroupGateway after installing WebSocket dependencies:
  // npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
  exports: [AiGroupService],
})
export class AiGroupModule {}
