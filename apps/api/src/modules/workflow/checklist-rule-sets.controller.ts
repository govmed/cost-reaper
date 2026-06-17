import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  type AuthUser,
  CreateChecklistRuleSetRequest,
  UpdateChecklistRuleSetRequest,
} from '@cost-reaper/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ChecklistService } from './checklist.service';

// FR-25 — a repo of named checklist rule sets. Each has a system-assigned key
// (RS-xxxxxx); admins give it a label + description. Add/update/delete is ADMIN only.
@ApiTags('checklist-rule-sets')
@ApiBearerAuth()
@Controller('checklist-rule-sets')
export class ChecklistRuleSetsController {
  constructor(private readonly checklist: ChecklistService) {}

  @Get()
  @RequirePermission('checklist.configure')
  list() {
    return this.checklist.listRuleSets();
  }

  @Post()
  @RequirePermission('checklist.configure')
  create(
    @Body(new ZodValidationPipe(CreateChecklistRuleSetRequest)) dto: CreateChecklistRuleSetRequest,
    @CurrentUser() u: AuthUser,
  ) {
    return this.checklist.createRuleSet(dto, u);
  }

  @Patch(':id')
  @RequirePermission('checklist.configure')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateChecklistRuleSetRequest)) dto: UpdateChecklistRuleSetRequest,
    @CurrentUser() u: AuthUser,
  ) {
    return this.checklist.updateRuleSet(id, dto, u);
  }

  @Delete(':id')
  @RequirePermission('checklist.configure')
  remove(@Param('id') id: string, @CurrentUser() u: AuthUser) {
    return this.checklist.deleteRuleSet(id, u);
  }
}
