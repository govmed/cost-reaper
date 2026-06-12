import { Injectable, NotFoundException } from '@nestjs/common';
import type { ChecklistResult } from '@cost-reaper/types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { type ChecklistEstimate, evaluateChecklist } from './checklist-rules';

@Injectable()
export class ChecklistService {
  constructor(private readonly prisma: PrismaService) {}

  async evaluate(estimateId: string): Promise<ChecklistResult> {
    const est: any = await this.prisma.estimate.findUnique({
      where: { id: estimateId },
      include: { laborItems: true, nonLaborItems: true, cloudItems: true },
    });
    if (!est) throw new NotFoundException('Estimate not found');
    const rules = await this.prisma.checklistRule.findMany({
      where: { isActive: true },
      orderBy: { key: 'asc' },
    });
    const e: ChecklistEstimate = {
      rateCardId: est.rateCardId,
      globalUpchargePercent: Number(est.globalUpchargePercent),
      contingencyPercent: Number(est.contingencyPercent),
      labor: est.laborItems.map((l: any) => ({
        rateCardRoleId: l.rateCardRoleId,
        rateSnapshot: l.rateSnapshot.toString(),
        quantity: Number(l.quantity),
        units: Number(l.units),
        billingPeriod: l.billingPeriod,
        resourceName: l.resourceName ?? null,
        allocationPercent: Number(l.allocationPercent),
        startDate: l.startDate ? l.startDate.toISOString().slice(0, 10) : null,
        endDate: l.endDate ? l.endDate.toISOString().slice(0, 10) : null,
      })),
      nonLabor: est.nonLaborItems.map((n: any) => ({
        amount: n.amount.toString(),
        billingPeriod: n.billingPeriod,
      })),
      cloud: est.cloudItems.map((c: any) => ({
        cloudPriceId: c.cloudPriceId,
        unitPriceSnapshot: c.unitPriceSnapshot.toString(),
        quantity: Number(c.quantity),
        usageHoursPerMonth: Number(c.usageHoursPerMonth),
        region: c.region,
        skuOrInstance: c.skuOrInstance,
        billingPeriod: c.billingPeriod,
      })),
    };
    return evaluateChecklist(
      rules.map((r) => ({
        key: r.key,
        description: r.description,
        severity: r.severity,
        scope: r.scope,
      })),
      e,
    );
  }
}
