import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  type AuthUser,
  type DocumentUploadLimitDto,
  UpdateDocumentUploadLimitRequest,
} from '@cost-reaper/types';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SettingsService } from './settings.service';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  // Readable by any authenticated user — the upload UI needs to know the limit.
  @Get('document-upload-limit')
  async getLimit(): Promise<DocumentUploadLimitDto> {
    return { maxUploadMb: await this.settings.getDocumentUploadLimitMb() };
  }

  // Admin-only (settings.manage) — change the configurable limit.
  @Put('document-upload-limit')
  @RequirePermission('settings.manage')
  async setLimit(
    @Body(new ZodValidationPipe(UpdateDocumentUploadLimitRequest))
    dto: UpdateDocumentUploadLimitRequest,
    @CurrentUser() user: AuthUser,
  ): Promise<DocumentUploadLimitDto> {
    return { maxUploadMb: await this.settings.setDocumentUploadLimitMb(dto.maxUploadMb, user.id) };
  }
}
