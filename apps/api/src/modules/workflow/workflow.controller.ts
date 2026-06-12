import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { type AuthUser, TransitionRequest } from '@cost-reaper/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ChecklistService } from './checklist.service';
import { WorkflowService } from './workflow.service';

// FR-24 (customizable workflow) + FR-25 (smart checklist that gates transitions).
@ApiTags('workflow')
@ApiBearerAuth()
@Controller()
export class WorkflowController {
  constructor(
    private readonly workflow: WorkflowService,
    private readonly checklist: ChecklistService,
  ) {}

  @Get('workflows/default')
  getDefault() {
    return this.workflow.getDefault();
  }

  @Get('estimates/:id/workflow')
  getWorkflow(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.workflow.getEstimateWorkflow(id, user);
  }

  @Get('estimates/:id/checklist')
  getChecklist(@Param('id') id: string) {
    return this.checklist.evaluate(id);
  }

  @Post('estimates/:id/transitions')
  @Roles('ADMIN', 'ESTIMATOR')
  transition(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(TransitionRequest)) dto: TransitionRequest,
    @CurrentUser() user: AuthUser,
  ) {
    return this.workflow.transition(id, dto.toStageKey, user, dto.note);
  }
}
