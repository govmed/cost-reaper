import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  type AuthUser,
  CreateStageRequest,
  CreateTransitionRequest,
  CreateWorkflowRequest,
  TransitionRequest,
  UpdateStageRequest,
  UpdateTransitionRequest,
  UpdateWorkflowRequest,
} from '@cost-reaper/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ChecklistService } from './checklist.service';
import { WorkflowService } from './workflow.service';

// FR-24 (configurable workflow repo) + FR-25 (smart checklist that gates transitions).
@ApiTags('workflow')
@ApiBearerAuth()
@Controller()
export class WorkflowController {
  constructor(
    private readonly workflow: WorkflowService,
    private readonly checklist: ChecklistService,
  ) {}

  // ── Workflow repo (list + admin CRUD) ──────────────────────────────────────

  @Get('workflows')
  list() {
    return this.workflow.listWorkflows();
  }

  @Post('workflows')
  @RequirePermission('workflow.configure')
  create(
    @Body(new ZodValidationPipe(CreateWorkflowRequest)) dto: CreateWorkflowRequest,
    @CurrentUser() u: AuthUser,
  ) {
    return this.workflow.createWorkflow(dto, u);
  }

  // `:wf` is a workflow id, or the literal "default".
  @Get('workflows/:wf')
  getOne(@Param('wf') wf: string) {
    return this.workflow.getDefinition(wf);
  }

  @Patch('workflows/:wf')
  @RequirePermission('workflow.configure')
  update(
    @Param('wf') wf: string,
    @Body(new ZodValidationPipe(UpdateWorkflowRequest)) dto: UpdateWorkflowRequest,
    @CurrentUser() u: AuthUser,
  ) {
    return this.workflow.updateWorkflow(wf, dto, u);
  }

  @Delete('workflows/:wf')
  @RequirePermission('workflow.configure')
  remove(@Param('wf') wf: string, @CurrentUser() u: AuthUser) {
    return this.workflow.deleteWorkflow(wf, u);
  }

  // ── Stage authoring (per workflow, admin) ──────────────────────────────────

  @Post('workflows/:wf/stages')
  @RequirePermission('workflow.configure')
  addStage(
    @Param('wf') wf: string,
    @Body(new ZodValidationPipe(CreateStageRequest)) dto: CreateStageRequest,
    @CurrentUser() u: AuthUser,
  ) {
    return this.workflow.addStage(wf, dto, u);
  }

  @Patch('workflows/:wf/stages/:stageId')
  @RequirePermission('workflow.configure')
  updateStage(
    @Param('stageId') stageId: string,
    @Body(new ZodValidationPipe(UpdateStageRequest)) dto: UpdateStageRequest,
    @CurrentUser() u: AuthUser,
  ) {
    return this.workflow.updateStage(stageId, dto, u);
  }

  @Delete('workflows/:wf/stages/:stageId')
  @RequirePermission('workflow.configure')
  deleteStage(@Param('stageId') stageId: string, @CurrentUser() u: AuthUser) {
    return this.workflow.deleteStage(stageId, u);
  }

  // ── Transition authoring (per workflow, admin) ─────────────────────────────

  @Post('workflows/:wf/transitions')
  @RequirePermission('workflow.configure')
  addTransition(
    @Param('wf') wf: string,
    @Body(new ZodValidationPipe(CreateTransitionRequest)) dto: CreateTransitionRequest,
    @CurrentUser() u: AuthUser,
  ) {
    return this.workflow.addTransition(wf, dto, u);
  }

  @Patch('workflows/:wf/transitions/:transitionId')
  @RequirePermission('workflow.configure')
  updateTransition(
    @Param('transitionId') transitionId: string,
    @Body(new ZodValidationPipe(UpdateTransitionRequest)) dto: UpdateTransitionRequest,
    @CurrentUser() u: AuthUser,
  ) {
    return this.workflow.updateTransition(transitionId, dto, u);
  }

  @Delete('workflows/:wf/transitions/:transitionId')
  @RequirePermission('workflow.configure')
  deleteTransition(@Param('transitionId') transitionId: string, @CurrentUser() u: AuthUser) {
    return this.workflow.deleteTransition(transitionId, u);
  }

  // ── Per-estimate workflow + checklist ──────────────────────────────────────

  @Get('estimates/:id/workflow')
  getWorkflow(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.workflow.getEstimateWorkflow(id, user);
  }

  @Get('estimates/:id/checklist')
  getChecklist(@Param('id') id: string) {
    return this.checklist.evaluate(id);
  }

  @Post('estimates/:id/transitions')
  @RequirePermission('workflow.advance')
  transition(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(TransitionRequest)) dto: TransitionRequest,
    @CurrentUser() user: AuthUser,
  ) {
    return this.workflow.transition(id, dto.toStageKey, user, dto.note);
  }
}
