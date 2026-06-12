import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser, EstimateWorkflowDto, WorkflowDefinitionDto } from '@cost-reaper/types';
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
