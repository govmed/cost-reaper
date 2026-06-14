import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  type AuthUser,
  CreateChecklistRuleSetRequest,
  UpdateChecklistRuleSetRequest,
} from '@cost-reaper/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
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
  @Roles('ADMIN')
  list() {
    return this.checklist.listRuleSets();
  }

  @Post()
  @Roles('ADMIN')
  create(
    @Body(new ZodValidationPipe(CreateChecklistRuleSetRequest)) dto: CreateChecklistRuleSetRequest,
    @CurrentUser() u: AuthUser,
  ) {
    return this.checklist.createRuleSet(dto, u);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateChecklistRuleSetRequest)) dto: UpdateChecklistRuleSetRequest,
    @CurrentUser() u: AuthUser,
  ) {
    return this.checklist.updateRuleSet(id, dto, u);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string, @CurrentUser() u: AuthUser) {
    return this.checklist.deleteRuleSet(id, u);
  }
}
