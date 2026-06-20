import { Injectable } from '@nestjs/common';
import { DOCUMENT_UPLOAD_DEFAULT_MB, DOCUMENT_UPLOAD_MAX_MB } from '@cost-reaper/types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';

const DOC_LIMIT_KEY = 'documents.maxUploadMb';

/** Clamp to [1, hard ceiling] integer MB. */
function clampMb(n: number): number {
  if (!Number.isFinite(n)) return DOCUMENT_UPLOAD_DEFAULT_MB;
  return Math.min(DOCUMENT_UPLOAD_MAX_MB, Math.max(1, Math.trunc(n)));
}

/** Admin-configurable application settings (key/value), e.g. the document upload limit. */
@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getDocumentUploadLimitMb(): Promise<number> {
    const row = await this.prisma.appSetting.findUnique({ where: { key: DOC_LIMIT_KEY } });
    return row ? clampMb(Number.parseInt(row.value, 10)) : DOCUMENT_UPLOAD_DEFAULT_MB;
  }

  async setDocumentUploadLimitMb(mb: number, userId: string): Promise<number> {
    const value = clampMb(mb);
    await this.prisma.appSetting.upsert({
      where: { key: DOC_LIMIT_KEY },
      update: { value: String(value), updatedById: userId },
      create: { key: DOC_LIMIT_KEY, value: String(value), updatedById: userId },
    });
    await this.audit.record('AppSetting', DOC_LIMIT_KEY, 'UPDATE', userId);
    return value;
  }
}
