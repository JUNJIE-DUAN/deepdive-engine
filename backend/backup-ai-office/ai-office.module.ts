import { Module } from '@nestjs/common';
import { AiOfficeController } from './ai-office.controller';

@Module({
  controllers: [AiOfficeController],
  providers: [],
  exports: [],
})
export class AiOfficeModule {}
