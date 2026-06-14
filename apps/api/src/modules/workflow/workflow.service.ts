import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  AuthUser,
  CreateStageRequest,
  CreateTransitionRequest,
  EstimateWorkflowDto,
  UpdateStageRequest,
  UpdateTransitionRequest,
  WorkflowDefinitionDto,
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

  async getDefault(): Promise<WorkflowDefinitionDto> {
    const def: any = await this.prisma.workflowDefinition.findFirst({
      where: { isDefault: true },
      include: {
        stages: { orderBy: { sortOrder: 'asc' } },
        transitions: { include: { fromStage: true, toStage: true } },
      },
    });
    if (!def) throw new NotFoundException('No default workflow configured');
    return {
      id: def.id,
      name: def.name,
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
        fromStageKey: t.fromStage.key,
        toStageKey: t.toStage.key,
        allowedRole: t.allowedRole,
        label: t.label,
        requiresChecklistPass: t.requiresChecklistPass,
      })),
    };
  }

  private async defaultId(): Promise<string> {
    const def = await this.prisma.workflowDefinition.findFirst({
      where: { isDefault: true },
      select: { id: true },
    });
    if (!def) throw new NotFoundException('No default workflow configured');
    return def.id;
  }

  // ── Authoring: stages (FR-24, admin) ───────────────────────────────────────

  async addStage(dto: CreateStageRequest, user: AuthUser): Promise<WorkflowDefinitionDto> {
    const workflowDefinitionId = await this.defaultId();
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
    return this.getDefault();
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
    return this.getDefault();
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
    return this.getDefault();
  }

  // ── Authoring: transitions (FR-24, admin) ──────────────────────────────────

  async addTransition(
    dto: CreateTransitionRequest,
    user: AuthUser,
  ): Promise<WorkflowDefinitionDto> {
    const workflowDefinitionId = await this.defaultId();
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
    await this.prisma.workflowTransition.create({
      data: {
        workflowDefinitionId,
        fromStageId: from.id,
        toStageId: to.id,
        allowedRole: dto.allowedRole,
        label: dto.label,
        requiresChecklistPass: dto.requiresChecklistPass ?? true,
      },
    });
    await this.audit.record(
      'WorkflowTransition',
      `${dto.fromStageKey}->${dto.toStageKey}`,
      'CREATE',
      user.id,
    );
    return this.getDefault();
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
        requiresChecklistPass: dto.requiresChecklistPass ?? undefined,
      },
    });
    await this.audit.record('WorkflowTransition', transitionId, 'UPDATE', user.id);
    return this.getDefault();
  }

  async deleteTransition(transitionId: string, user: AuthUser): Promise<WorkflowDefinitionDto> {
    const tr = await this.prisma.workflowTransition.findUnique({ where: { id: transitionId } });
    if (!tr) throw new NotFoundException('Transition not found');
    await this.prisma.workflowTransition.delete({ where: { id: transitionId } });
    await this.audit.record('WorkflowTransition', transitionId, 'DELETE', user.id);
    return this.getDefault();
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
