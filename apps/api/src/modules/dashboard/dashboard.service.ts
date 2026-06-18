import { Injectable } from '@nestjs/common';
import { computeEstimate } from '@cost-reaper/engine';
import type { AuthUser, DashboardStageEstimate, DashboardSummary } from '@cost-reaper/types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { buildEngineInput, toMappableEstimate } from '../estimates/engine-mapping';
import { gmCanViewStage, gmStageWhere, isGmScoped } from '../../common/gm-scope';
import { type DashboardRow, summarizeDashboard } from './dashboard-summary';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(user?: AuthUser): Promise<DashboardSummary> {
    // A GM only sees their review queue (In Review / Approved) in the counts,
    // stage breakdown and totals.
    const estimates = await this.prisma.estimate.findMany({
      where: gmStageWhere(user),
      orderBy: { updatedAt: 'desc' },
      include: {
        laborItems: { include: { rateCardRole: true } },
        nonLaborItems: true,
        cloudItems: true,
        currentStage: true,
      },
    });
    const rows: DashboardRow[] = estimates.map((e: any) => ({
      id: e.id,
      name: e.name,
      status: e.status,
      currency: e.currency,
      currentStageKey: e.currentStage?.key ?? null,
      currentStageLabel: e.currentStage?.label ?? null,
      grandTotal: computeEstimate(buildEngineInput(toMappableEstimate(e))).grandTotal,
      updatedAt: e.updatedAt.toISOString(),
    }));
    const fx = await this.prisma.fxRate.findMany();
    const fxRates: Record<string, number> = {};
    for (const f of fx) fxRates[f.currency] = Number(f.rateToBase);
    const summary = summarizeDashboard(rows, 5, fxRates);

    // For a GM, "recent activity" means estimates THEY acted on — not everyone's.
    if (isGmScoped(user) && user) {
      summary.recent = await this.recentActivityFor(user.id);
    }
    return summary;
  }

  /** The estimates this actor most recently acted on, newest first (cap 5). */
  private async recentActivityFor(actorId: string): Promise<DashboardSummary['recent']> {
    const events = await this.prisma.auditEvent.findMany({
      where: { actorId, entityType: 'Estimate' },
      orderBy: { occurredAt: 'desc' },
      take: 50,
    });
    const ids: string[] = [];
    const seen = new Set<string>();
    for (const e of events) {
      if (!seen.has(e.entityId)) {
        seen.add(e.entityId);
        ids.push(e.entityId);
      }
      if (ids.length >= 5) break;
    }
    if (ids.length === 0) return [];
    const estimates = await this.prisma.estimate.findMany({
      where: { id: { in: ids } },
      include: {
        laborItems: { include: { rateCardRole: true } },
        nonLaborItems: true,
        cloudItems: true,
        currentStage: true,
      },
    });
    const byId = new Map(estimates.map((e: any) => [e.id, e]));
    return ids
      .map((id) => byId.get(id))
      .filter((e) => Boolean(e))
      .map((e: any) => ({
        id: e.id,
        name: e.name,
        status: e.status,
        currency: e.currency,
        currentStageKey: e.currentStage?.key ?? null,
        grandTotal: computeEstimate(buildEngineInput(toMappableEstimate(e))).grandTotal,
        updatedAt: e.updatedAt.toISOString(),
      }));
  }

  /** Drill-down: the estimates currently in a given workflow stage (FR-18). */
  async estimatesInStage(stageKey: string, user?: AuthUser): Promise<DashboardStageEstimate[]> {
    // A GM may only drill into the stages they can see.
    if (!gmCanViewStage(user, stageKey)) return [];
    const where =
      stageKey === 'UNASSIGNED' ? { currentStageId: null } : { currentStage: { key: stageKey } };
    const estimates = await this.prisma.estimate.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        laborItems: { include: { rateCardRole: true } },
        nonLaborItems: true,
        cloudItems: true,
      },
    });
    return estimates.map((e: any) => ({
      id: e.id,
      name: e.name,
      status: e.status,
      currency: e.currency,
      grandTotal: computeEstimate(buildEngineInput(toMappableEstimate(e))).grandTotal,
      updatedAt: e.updatedAt.toISOString(),
    }));
  }
}
