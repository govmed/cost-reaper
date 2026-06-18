import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { type AuthUser, MAX_DOCUMENT_BYTES } from '@cost-reaper/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { DocumentsService, type UploadedDoc } from './documents.service';

// Supporting-document catalog for an estimate (FR-29). Upload/delete require the
// estimate.author permission; list/download are open to any authenticated user.
@ApiTags('documents')
@ApiBearerAuth()
@Controller('estimates/:id/documents')
export class DocumentsController {
  constructor(private readonly docs: DocumentsService) {}

  @Get()
  list(@Param('id') id: string) {
    return this.docs.list(id);
  }

  @Post()
  @RequirePermission('estimate.author')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_DOCUMENT_BYTES } }))
  upload(
    @Param('id') id: string,
    @UploadedFile() file: UploadedDoc,
    @Body('documentType') documentType: string,
    @Body('description') description: string | undefined,
    @CurrentUser() u: AuthUser,
  ) {
    return this.docs.create(id, file, documentType, description, u.id);
  }

  @Get(':docId/download')
  async download(
    @Param('id') id: string,
    @Param('docId') docId: string,
    @Res() res: Response,
  ): Promise<void> {
    const d = await this.docs.download(id, docId);
    res.setHeader('Content-Type', d.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${d.fileName}"`);
    res.send(d.content);
  }

  @Delete(':docId')
  @RequirePermission('estimate.author')
  @HttpCode(200)
  remove(@Param('id') id: string, @Param('docId') docId: string, @CurrentUser() u: AuthUser) {
    return this.docs.remove(id, docId, u.id);
  }
}
