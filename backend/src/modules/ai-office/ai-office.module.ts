import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { QuickGenerateController } from './quick-generate.controller';
import { QuickGenerateService } from './quick-generate.service';

@Module({
    imports: [HttpModule, ConfigModule],
    controllers: [QuickGenerateController],
    providers: [QuickGenerateService],
    exports: [QuickGenerateService],
})
export class AiOfficeModule { }
