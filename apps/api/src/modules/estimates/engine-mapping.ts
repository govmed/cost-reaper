import type { BillingPeriod, EngineInput, EngineLine } from '@cost-reaper/types';

export interface MappableLabor {
  id: string;
  roleName: string | null;
  rateSnapshot: string;
  quantity: number;
  units: number;
  billingPeriod: BillingPeriod;
  upchargePercentOverride: number | null;
  sdlcPhase: string | null;
}
export interface MappableNonLabor {
  id: string;
  category: string;
  amount: string;
  periods: number;
  billingPeriod: BillingPeriod;
  upchargePercentOverride: number | null;
  sdlcPhase: string | null;
}
export interface MappableCloud {
  id: string;
  provider: string;
  unitPriceSnapshot: string;
  quantity: number;
  usageHoursPerMonth: number;
  billingPeriod: BillingPeriod;
  upchargePercentOverride: number | null;
  sdlcPhase: string | null;
}
export interface MappableEstimate {
  globalUpchargePercent: number;
  contingencyPercent: number;
  labor: MappableLabor[];
  nonLabor: MappableNonLabor[];
  cloud: MappableCloud[];
}

/** Project a Prisma estimate (with included line items) to the engine contract. */
export function toMappableEstimate(e: any): MappableEstimate {
  const pct = (v: any) => (v == null ? null : Number(v));
  return {
    globalUpchargePercent: Number(e.globalUpchargePercent),
    contingencyPercent: Number(e.contingencyPercent),
    labor: e.laborItems.map((l: any) => ({
      id: l.id,
      roleName: l.rateCardRole?.roleName ?? null,
      rateSnapshot: l.rateSnapshot.toString(),
      quantity: Number(l.quantity),
      units: Number(l.units),
      billingPeriod: l.billingPeriod,
      upchargePercentOverride: pct(l.upchargePercentOverride),
      sdlcPhase: l.sdlcPhase ?? null,
    })),
    nonLabor: e.nonLaborItems.map((n: any) => ({
      id: n.id,
      category: n.category,
      amount: n.amount.toString(),
      periods: n.periods,
      billingPeriod: n.billingPeriod,
      upchargePercentOverride: pct(n.upchargePercentOverride),
      sdlcPhase: n.sdlcPhase ?? null,
    })),
    cloud: e.cloudItems.map((c: any) => ({
      id: c.id,
      provider: c.provider,
      unitPriceSnapshot: c.unitPriceSnapshot.toString(),
      quantity: Number(c.quantity),
      usageHoursPerMonth: Number(c.usageHoursPerMonth),
      billingPeriod: c.billingPeriod,
      upchargePercentOverride: pct(c.upchargePercentOverride),
      sdlcPhase: c.sdlcPhase ?? null,
    })),
  };
}

/**
 * Normalize an estimate's lines into the engine contract. Money stays a string
 * (exact); only counts (quantity×units, quantity×hours) become numbers, so the
 * engine's decimal math is the only place money is multiplied.
 */
export function buildEngineInput(e: MappableEstimate): EngineInput {
  const lines: EngineLine[] = [];
  for (const l of e.labor) {
    lines.push({
      id: l.id,
      category: l.roleName ?? 'Labor',
      baseAmount: l.rateSnapshot,
      quantity: l.quantity * l.units,
      billingPeriod: l.billingPeriod,
      upchargePercentOverride: l.upchargePercentOverride,
      sdlcPhase: l.sdlcPhase,
    });
  }
  for (const n of e.nonLabor) {
    lines.push({
      id: n.id,
      category: n.category,
      baseAmount: n.amount,
      quantity: n.periods,
      billingPeriod: n.billingPeriod,
      upchargePercentOverride: n.upchargePercentOverride,
      sdlcPhase: n.sdlcPhase,
    });
  }
  for (const c of e.cloud) {
    lines.push({
      id: c.id,
      category: `Cloud (${c.provider})`,
      baseAmount: c.unitPriceSnapshot,
      quantity: c.quantity * c.usageHoursPerMonth,
      billingPeriod: c.billingPeriod,
      upchargePercentOverride: c.upchargePercentOverride,
      sdlcPhase: c.sdlcPhase,
    });
  }
  return {
    globalUpchargePercent: e.globalUpchargePercent,
    contingencyPercent: e.contingencyPercent,
    lines,
    moneyScale: 4,
  };
}
