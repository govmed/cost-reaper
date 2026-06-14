import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  type AuthUser,
  CreateChecklistRuleRequest,
  UpdateChecklistRuleRequest,
} from '@cost-reaper/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ChecklistService } from './checklist.service';

// FR-25 — admin authoring of the smart-checklist rules (severity / active / add custom).
@ApiTags('checklist-rules')
@ApiBearerAuth()
@Controller('checklist-rules')
export class ChecklistRulesController {
  constructor(private readonly checklist: ChecklistService) {}

  @Get()
  @Roles('ADMIN')
  list() {
    return this.checklist.listRules();
  }

  @Post()
  @Roles('ADMIN')
  create(
    @Body(new ZodValidationPipe(CreateChecklistRuleRequest)) dto: CreateChecklistRuleRequest,
    @CurrentUser() u: AuthUser,
  ) {
    return this.checklist.createRule(dto, u);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateChecklistRuleRequest)) dto: UpdateChecklistRuleRequest,
    @CurrentUser() u: AuthUser,
  ) {
    return this.checklist.updateRule(id, dto, u);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string, @CurrentUser() u: AuthUser) {
    return this.checklist.deleteRule(id, u);
  }
}
