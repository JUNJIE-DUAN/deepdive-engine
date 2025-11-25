import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { AiModule } from "../ai/ai.module";

@Module({
  imports: [PrismaModule, AiModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
