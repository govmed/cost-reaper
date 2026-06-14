import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  type AuthUser,
  CreateStageRequest,
  CreateTransitionRequest,
  TransitionRequest,
  UpdateStageRequest,
  UpdateTransitionRequest,
} from '@cost-reaper/types';
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

  // ── Authoring (FR-24, admin) ───────────────────────────────────────────────

  @Post('workflows/default/stages')
  @Roles('ADMIN')
  addStage(
    @Body(new ZodValidationPipe(CreateStageRequest)) dto: CreateStageRequest,
    @CurrentUser() u: AuthUser,
  ) {
    return this.workflow.addStage(dto, u);
  }

  @Patch('workflows/default/stages/:stageId')
  @Roles('ADMIN')
  updateStage(
    @Param('stageId') stageId: string,
    @Body(new ZodValidationPipe(UpdateStageRequest)) dto: UpdateStageRequest,
    @CurrentUser() u: AuthUser,
  ) {
    return this.workflow.updateStage(stageId, dto, u);
  }

  @Delete('workflows/default/stages/:stageId')
  @Roles('ADMIN')
  deleteStage(@Param('stageId') stageId: string, @CurrentUser() u: AuthUser) {
    return this.workflow.deleteStage(stageId, u);
  }

  @Post('workflows/default/transitions')
  @Roles('ADMIN')
  addTransition(
    @Body(new ZodValidationPipe(CreateTransitionRequest)) dto: CreateTransitionRequest,
    @CurrentUser() u: AuthUser,
  ) {
    return this.workflow.addTransition(dto, u);
  }

  @Patch('workflows/default/transitions/:transitionId')
  @Roles('ADMIN')
  updateTransition(
    @Param('transitionId') transitionId: string,
    @Body(new ZodValidationPipe(UpdateTransitionRequest)) dto: UpdateTransitionRequest,
    @CurrentUser() u: AuthUser,
  ) {
    return this.workflow.updateTransition(transitionId, dto, u);
  }

  @Delete('workflows/default/transitions/:transitionId')
  @Roles('ADMIN')
  deleteTransition(@Param('transitionId') transitionId: string, @CurrentUser() u: AuthUser) {
    return this.workflow.deleteTransition(transitionId, u);
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
