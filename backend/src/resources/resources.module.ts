import { Module } from '@nestjs/common';
import { ResourcesController } from './resources.controller';
import { ResourcesService } from './resources.service';
import { AIEnrichmentService } from './ai-enrichment.service';
// import { PdfThumbnailService } from './pdf-thumbnail.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { MongoDBModule } from '../common/mongodb/mongodb.module';

/**
 * 资源管理模块
 */
@Module({
  imports: [PrismaModule, MongoDBModule],
  controllers: [ResourcesController],
  providers: [ResourcesService, AIEnrichmentService], // PdfThumbnailService requires complex native deps
  exports: [ResourcesService, AIEnrichmentService],
})
export class ResourcesModule {}
