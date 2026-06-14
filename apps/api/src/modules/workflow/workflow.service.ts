import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type {
  AuthUser,
  CreateStageRequest,
  CreateTransitionRequest,
  CreateWorkflowRequest,
  EstimateWorkflowDto,
  UpdateStageRequest,
  UpdateTransitionRequest,
  UpdateWorkflowRequest,
  WorkflowDefinitionDto,
  WorkflowSummaryDto,
} from '@cost-reaper/types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { ChecklistService } from './checklist.service';

@Injectable()
export class WorkflowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly checklist: ChecklistService,
    private readonly audit: AuditService,
  ) {}

  private toDto(def: any): WorkflowDefinitionDto {
    return {
      id: def.id,
      key: def.key,
      name: def.name,
      description: def.description ?? null,
      isDefault: def.isDefault,
      isActive: def.isActive,
      stages: def.stages.map((s: any) => ({
        id: s.id,
        key: s.key,
        label: s.label,
        sortOrder: s.sortOrder,
        isInitial: s.isInitial,
        isTerminal: s.isTerminal,
      })),
      transitions: def.transitions.map((t: any) => ({
        id: t.id,
        key: t.key,
        description: t.description ?? null,
        fromStageKey: t.fromStage.key,
        toStageKey: t.toStage.key,
        allowedRole: t.allowedRole,
        label: t.label,
        requiresChecklistPass: t.requiresChecklistPass,
      })),
    };
  }

  async getDefinitionById(id: string): Promise<WorkflowDefinitionDto> {
    const def = await this.prisma.workflowDefinition.findUnique({
      where: { id },
      include: {
        stages: { orderBy: { sortOrder: 'asc' } },
        transitions: { include: { fromStage: true, toStage: true } },
      },
    });
    if (!def) throw new NotFoundException('Workflow not found');
    return this.toDto(def);
  }

  /** Resolve a workflow ref ('default' or an id) to an id. */
  private async resolveWf(wf: string): Promise<string> {
    if (wf === 'default') return this.defaultId();
    const found = await this.prisma.workflowDefinition.findUnique({
      where: { id: wf },
      select: { id: true },
    });
    if (!found) throw new NotFoundException('Workflow not found');
    return found.id;
  }

  async getDefinition(wf: string): Promise<WorkflowDefinitionDto> {
    return this.getDefinitionById(await this.resolveWf(wf));
  }

  async getDefault(): Promise<WorkflowDefinitionDto> {
    return this.getDefinitionById(await this.defaultId());
  }

  private async defaultId(): Promise<string> {
    const def = await this.prisma.workflowDefinition.findFirst({
      where: { isDefault: true },
      select: { id: true },
    });
    if (!def) throw new NotFoundException('No default workflow configured');
    return def.id;
  }

  // ── Workflow repo (FR-24, admin) ───────────────────────────────────────────

  async listWorkflows(): Promise<WorkflowSummaryDto[]> {
    const defs = await this.prisma.workflowDefinition.findMany({
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
      include: { _count: { select: { stages: true, transitions: true } } },
    });
    return defs.map((d: any) => ({
      id: d.id,
      key: d.key,
      name: d.name,
      description: d.description ?? null,
      isDefault: d.isDefault,
      isActive: d.isActive,
      stageCount: d._count.stages,
      transitionCount: d._count.transitions,
    }));
  }

  /** Create a workflow with a system key and a starter Draft→Final lifecycle. */
  async createWorkflow(dto: CreateWorkflowRequest, user: AuthUser): Promise<WorkflowSummaryDto> {
    const key = `WF-${randomBytes(3).toString('hex').toUpperCase()}`;
    const def = await this.prisma.workflowDefinition.create({
      data: {
        key,
        name: dto.name,
        description: dto.description ?? null,
        isDefault: false,
        isActive: true,
        createdById: user.id,
        stages: {
          create: [
            { key: 'DRAFT', label: 'Draft', sortOrder: 1, isInitial: true, isTerminal: false },
            {
              key: 'IN_REVIEW',
              label: 'In Review',
              sortOrder: 2,
              isInitial: false,
              isTerminal: false,
            },
            {
              key: 'APPROVED',
              label: 'Approved',
              sortOrder: 3,
              isInitial: false,
              isTerminal: false,
            },
            { key: 'FINAL', label: 'Final', sortOrder: 4, isInitial: false, isTerminal: true },
          ],
        },
      },
      include: { stages: true },
    });
    const stageId = (k: string) => def.stages.find((s) => s.key === k)!.id;
    await this.prisma.workflowTransition.createMany({
      data: [
        { key: `TR-${randomBytes(3).toString('hex').toUpperCase()}`, workflowDefinitionId: def.id, fromStageId: stageId('DRAFT'), toStageId: stageId('IN_REVIEW'), allowedRole: 'ESTIMATOR', label: 'Submit for review', requiresChecklistPass: true }, // prettier-ignore
        { key: `TR-${randomBytes(3).toString('hex').toUpperCase()}`, workflowDefinitionId: def.id, fromStageId: stageId('IN_REVIEW'), toStageId: stageId('APPROVED'), allowedRole: 'ADMIN', label: 'Approve', requiresChecklistPass: true }, // prettier-ignore
        { key: `TR-${randomBytes(3).toString('hex').toUpperCase()}`, workflowDefinitionId: def.id, fromStageId: stageId('APPROVED'), toStageId: stageId('FINAL'), allowedRole: 'ADMIN', label: 'Finalize', requiresChecklistPass: true }, // prettier-ignore
      ],
    });
    await this.audit.record('WorkflowDefinition', key, 'CREATE', user.id);
    const summaries = await this.listWorkflows();
    return summaries.find((s) => s.id === def.id)!;
  }

  async updateWorkflow(
    id: string,
    dto: UpdateWorkflowRequest,
    user: AuthUser,
  ): Promise<WorkflowSummaryDto[]> {
    const def = await this.prisma.workflowDefinition.findUnique({ where: { id } });
    if (!def) throw new NotFoundException('Workflow not found');
    await this.prisma.workflowDefinition.update({
      where: { id },
      data: {
        name: dto.name ?? undefined,
        description: dto.description ?? undefined,
        isActive: dto.isActive ?? undefined,
      },
    });
    await this.audit.record('WorkflowDefinition', def.key, 'UPDATE', user.id);
    return this.listWorkflows();
  }

  async deleteWorkflow(id: string, user: AuthUser): Promise<WorkflowSummaryDto[]> {
    const def = await this.prisma.workflowDefinition.findUnique({
      where: { id },
      include: { _count: { select: { estimates: true } } },
    });
    if (!def) throw new NotFoundException('Workflow not found');
    if (def.isDefault) throw new BadRequestException('The default workflow cannot be deleted');
    if ((def as any)._count.estimates > 0) {
      throw new BadRequestException('Cannot delete a workflow that estimates are using');
    }
    await this.prisma.workflowDefinition.delete({ where: { id } });
    await this.audit.record('WorkflowDefinition', def.key, 'DELETE', user.id);
    return this.listWorkflows();
  }

  // ── Authoring: stages (FR-24, admin) ───────────────────────────────────────

  async addStage(
    wf: string,
    dto: CreateStageRequest,
    user: AuthUser,
  ): Promise<WorkflowDefinitionDto> {
    const workflowDefinitionId = await this.resolveWf(wf);
    const dup = await this.prisma.workflowStage.findFirst({
      where: { workflowDefinitionId, key: dto.key },
    });
    if (dup) throw new BadRequestException(`A stage with key ${dto.key} already exists`);
    const count = await this.prisma.workflowStage.count({ where: { workflowDefinitionId } });
    await this.prisma.$transaction(async (tx) => {
      if (dto.isInitial) {
        await tx.workflowStage.updateMany({
          where: { workflowDefinitionId },
          data: { isInitial: false },
        });
      }
      await tx.workflowStage.create({
        data: {
          workflowDefinitionId,
          key: dto.key,
          label: dto.label,
          sortOrder: dto.sortOrder ?? count + 1,
          isInitial: dto.isInitial ?? false,
          isTerminal: dto.isTerminal ?? false,
        },
      });
    });
    await this.audit.record('WorkflowStage', dto.key, 'CREATE', user.id);
    return this.getDefinitionById(workflowDefinitionId);
  }

  async updateStage(
    stageId: string,
    dto: UpdateStageRequest,
    user: AuthUser,
  ): Promise<WorkflowDefinitionDto> {
    const stage = await this.prisma.workflowStage.findUnique({ where: { id: stageId } });
    if (!stage) throw new NotFoundException('Stage not found');
    await this.prisma.$transaction(async (tx) => {
      if (dto.isInitial === true) {
        await tx.workflowStage.updateMany({
          where: { workflowDefinitionId: stage.workflowDefinitionId, id: { not: stageId } },
          data: { isInitial: false },
        });
      }
      await tx.workflowStage.update({
        where: { id: stageId },
        data: {
          label: dto.label ?? undefined,
          sortOrder: dto.sortOrder ?? undefined,
          isInitial: dto.isInitial ?? undefined,
          isTerminal: dto.isTerminal ?? undefined,
        },
      });
    });
    await this.audit.record('WorkflowStage', stage.key, 'UPDATE', user.id);
    return this.getDefinitionById(stage.workflowDefinitionId);
  }

  async deleteStage(stageId: string, user: AuthUser): Promise<WorkflowDefinitionDto> {
    const stage = await this.prisma.workflowStage.findUnique({
      where: { id: stageId },
      include: {
        _count: { select: { estimatesHere: true, eventsFrom: true, eventsTo: true } },
      },
    });
    if (!stage) throw new NotFoundException('Stage not found');
    const c = (stage as any)._count;
    if (c.estimatesHere > 0) {
      throw new BadRequestException('Cannot delete a stage that estimates are currently in');
    }
    if (c.eventsFrom > 0 || c.eventsTo > 0) {
      throw new BadRequestException('Cannot delete a stage that appears in transition history');
    }
    // Transitions referencing this stage cascade-delete (onDelete: Cascade).
    await this.prisma.workflowStage.delete({ where: { id: stageId } });
    await this.audit.record('WorkflowStage', stage.key, 'DELETE', user.id);
    return this.getDefinitionById(stage.workflowDefinitionId);
  }

  // ── Authoring: transitions (FR-24, admin) ──────────────────────────────────

  async addTransition(
    wf: string,
    dto: CreateTransitionRequest,
    user: AuthUser,
  ): Promise<WorkflowDefinitionDto> {
    const workflowDefinitionId = await this.resolveWf(wf);
    const stages = await this.prisma.workflowStage.findMany({ where: { workflowDefinitionId } });
    const from = stages.find((s) => s.key === dto.fromStageKey);
    const to = stages.find((s) => s.key === dto.toStageKey);
    if (!from || !to) throw new BadRequestException('Unknown from/to stage');
    if (from.id === to.id)
      throw new BadRequestException('A transition cannot loop a stage to itself');
    const dup = await this.prisma.workflowTransition.findFirst({
      where: { workflowDefinitionId, fromStageId: from.id, toStageId: to.id },
    });
    if (dup) throw new BadRequestException('That transition already exists');
    const key = `TR-${randomBytes(3).toString('hex').toUpperCase()}`;
    await this.prisma.workflowTransition.create({
      data: {
        key,
        description: dto.description ?? null,
        workflowDefinitionId,
        fromStageId: from.id,
        toStageId: to.id,
        allowedRole: dto.allowedRole,
        label: dto.label,
        requiresChecklistPass: dto.requiresChecklistPass ?? true,
      },
    });
    await this.audit.record('WorkflowTransition', key, 'CREATE', user.id);
    return this.getDefinitionById(workflowDefinitionId);
  }

  async updateTransition(
    transitionId: string,
    dto: UpdateTransitionRequest,
    user: AuthUser,
  ): Promise<WorkflowDefinitionDto> {
    const tr = await this.prisma.workflowTransition.findUnique({ where: { id: transitionId } });
    if (!tr) throw new NotFoundException('Transition not found');
    await this.prisma.workflowTransition.update({
      where: { id: transitionId },
      data: {
        allowedRole: dto.allowedRole ?? undefined,
        label: dto.label ?? undefined,
        description: dto.description ?? undefined,
        requiresChecklistPass: dto.requiresChecklistPass ?? undefined,
      },
    });
    await this.audit.record('WorkflowTransition', tr.key, 'UPDATE', user.id);
    return this.getDefinitionById(tr.workflowDefinitionId);
  }

  async deleteTransition(transitionId: string, user: AuthUser): Promise<WorkflowDefinitionDto> {
    const tr = await this.prisma.workflowTransition.findUnique({ where: { id: transitionId } });
    if (!tr) throw new NotFoundException('Transition not found');
    await this.prisma.workflowTransition.delete({ where: { id: transitionId } });
    await this.audit.record('WorkflowTransition', tr.key, 'DELETE', user.id);
    return this.getDefinitionById(tr.workflowDefinitionId);
  }

  /** Lazily attach the default workflow + initial stage to an estimate that has none. */
  private async ensureAssigned(estimateId: string): Promise<void> {
    const est = await this.prisma.estimate.findUnique({
      where: { id: estimateId },
      select: { id: true, workflowDefinitionId: true, currentStageId: true },
    });
    if (!est) throw new NotFoundException('Estimate not found');
    if (est.workflowDefinitionId && est.currentStageId) return;
    const def: any = await this.prisma.workflowDefinition.findFirst({
      where: { isDefault: true },
      include: { stages: true },
    });
    if (!def) return;
    const initial = def.stages.find((s: any) => s.isInitial) ?? def.stages[0];
    if (!initial) return;
    await this.prisma.estimate.update({
      where: { id: estimateId },
      data: { workflowDefinitionId: def.id, currentStageId: initial.id },
    });
  }

  async getEstimateWorkflow(estimateId: string, user: AuthUser): Promise<EstimateWorkflowDto> {
    await this.ensureAssigned(estimateId);
    const est: any = await this.prisma.estimate.findUnique({
      where: { id: estimateId },
      include: {
        currentStage: true,
        workflowDefinition: {
          include: { transitions: { include: { fromStage: true, toStage: true } } },
        },
        transitionEvents: {
          include: { fromStage: true, toStage: true },
          orderBy: { occurredAt: 'asc' },
        },
      },
    });
    if (!est) throw new NotFoundException('Estimate not found');
    const checklist = await this.checklist.evaluate(estimateId);
    const transitions = (est.workflowDefinition?.transitions ?? []).filter(
      (t: any) => t.fromStageId === est.currentStageId,
    );
    return {
      currentStageKey: est.currentStage?.key ?? null,
      currentStageLabel: est.currentStage?.label ?? null,
      availableTransitions: transitions.map((t: any) => ({
        toStageKey: t.toStage.key,
        toStageLabel: t.toStage.label,
        label: t.label,
        allowedRole: t.allowedRole,
        requiresChecklistPass: t.requiresChecklistPass,
        allowedForUser: user.role === 'ADMIN' || user.role === t.allowedRole,
        blockedByChecklist: t.requiresChecklistPass && checklist.blocking,
      })),
      history: est.transitionEvents.map((ev: any) => ({
        id: ev.id,
        fromStageKey: ev.fromStage?.key ?? null,
        toStageKey: ev.toStage.key,
        actorId: ev.actorId,
        note: ev.note,
        occurredAt: ev.occurredAt.toISOString(),
      })),
    };
  }

  async transition(
    estimateId: string,
    toStageKey: string,
    user: AuthUser,
    note?: string,
  ): Promise<EstimateWorkflowDto> {
    await this.ensureAssigned(estimateId);
    const est: any = await this.prisma.estimate.findUnique({
      where: { id: estimateId },
      include: { workflowDefinition: { include: { transitions: { include: { toStage: true } } } } },
    });
    if (!est) throw new NotFoundException('Estimate not found');
    const t = (est.workflowDefinition?.transitions ?? []).find(
      (x: any) => x.fromStageId === est.currentStageId && x.toStage.key === toStageKey,
    );
    if (!t) throw new BadRequestException('No such transition from the current stage');
    if (!(user.role === 'ADMIN' || user.role === t.allowedRole)) {
      throw new ForbiddenException(`This transition requires the ${t.allowedRole} role`);
    }
    if (t.requiresChecklistPass) {
      const checklist = await this.checklist.evaluate(estimateId);
      if (checklist.blocking) {
        throw new BadRequestException(
          'Resolve the blocking checklist items before this transition',
        );
      }
    }
    await this.prisma.$transaction([
      this.prisma.estimate.update({
        where: { id: estimateId },
        data: { currentStageId: t.toStageId },
      }),
      this.prisma.workflowTransitionEvent.create({
        data: {
          estimateId,
          fromStageId: est.currentStageId,
          toStageId: t.toStageId,
          actorId: user.id,
          note: note ?? null,
        },
      }),
    ]);
    await this.audit.record('Estimate', estimateId, `WORKFLOW:${toStageKey}`, user.id);
    return this.getEstimateWorkflow(estimateId, user);
  }
}
