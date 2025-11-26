import { Module } from "@nestjs/common";
import { RawDataService } from "./rawdata.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  providers: [RawDataService],
  exports: [RawDataService],
})
export class RawDataModule {}
