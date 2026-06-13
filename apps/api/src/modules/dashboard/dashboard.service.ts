import { Injectable } from '@nestjs/common';
import { computeEstimate } from '@cost-reaper/engine';
import type { DashboardSummary } from '@cost-reaper/types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { buildEngineInput, toMappableEstimate } from '../estimates/engine-mapping';
import { type DashboardRow, summarizeDashboard } from './dashboard-summary';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(): Promise<DashboardSummary> {
    const estimates = await this.prisma.estimate.findMany({
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
    return summarizeDashboard(rows, 5, fxRates);
  }
}
