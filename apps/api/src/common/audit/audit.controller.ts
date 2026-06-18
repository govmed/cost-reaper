import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuditListQuery } from '@cost-reaper/types';
import { RequirePermission } from '../decorators/permissions.decorator';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';
import { AuditService } from './audit.service';

// Read-only view of the immutable audit trail (FR-11). No write routes — the log
// is append-only and can only be read, gated by the `audit.view` permission.
@ApiTags('audit')
@ApiBearerAuth()
@Controller('audit')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  @RequirePermission('audit.view')
  list(@Query(new ZodValidationPipe(AuditListQuery)) query: AuditListQuery) {
    return this.audit.list(query);
  }

  @Get('entity-types')
  @RequirePermission('audit.view')
  entityTypes() {
    return this.audit.entityTypes();
  }
}
