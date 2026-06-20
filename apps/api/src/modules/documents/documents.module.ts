import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { ReferenceModule } from '../reference/reference.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [ReferenceModule, SettingsModule],
  controllers: [DocumentsController],
  providers: [DocumentsService],
})
export class DocumentsModule {}
