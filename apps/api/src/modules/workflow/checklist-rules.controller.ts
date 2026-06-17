import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  type AuthUser,
  CreateChecklistRuleRequest,
  UpdateChecklistRuleRequest,
} from '@cost-reaper/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ChecklistService } from './checklist.service';

// FR-25 — admin authoring of the smart-checklist rules (severity / active / add custom).
@ApiTags('checklist-rules')
@ApiBearerAuth()
@Controller('checklist-rules')
export class ChecklistRulesController {
  constructor(private readonly checklist: ChecklistService) {}

  @Get()
  @RequirePermission('checklist.configure')
  list(@Query('ruleSetId') ruleSetId?: string) {
    return this.checklist.listRules(ruleSetId);
  }

  @Post()
  @RequirePermission('checklist.configure')
  create(
    @Body(new ZodValidationPipe(CreateChecklistRuleRequest)) dto: CreateChecklistRuleRequest,
    @CurrentUser() u: AuthUser,
  ) {
    return this.checklist.createRule(dto, u);
  }

  @Patch(':id')
  @RequirePermission('checklist.configure')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateChecklistRuleRequest)) dto: UpdateChecklistRuleRequest,
    @CurrentUser() u: AuthUser,
  ) {
    return this.checklist.updateRule(id, dto, u);
  }

  @Delete(':id')
  @RequirePermission('checklist.configure')
  remove(@Param('id') id: string, @CurrentUser() u: AuthUser) {
    return this.checklist.deleteRule(id, u);
  }
}
