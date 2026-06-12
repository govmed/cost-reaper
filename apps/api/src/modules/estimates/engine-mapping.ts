import type { BillingPeriod, EngineInput, EngineLine } from '@cost-reaper/types';

export interface MappableLabor {
  id: string;
  roleName: string | null;
  rateSnapshot: string;
  quantity: number;
  units: number;
  billingPeriod: BillingPeriod;
  upchargePercentOverride: number | null;
}
export interface MappableNonLabor {
  id: string;
  category: string;
  amount: string;
  periods: number;
  billingPeriod: BillingPeriod;
  upchargePercentOverride: number | null;
}
export interface MappableCloud {
  id: string;
  provider: string;
  unitPriceSnapshot: string;
  quantity: number;
  usageHoursPerMonth: number;
  billingPeriod: BillingPeriod;
  upchargePercentOverride: number | null;
}
export interface MappableEstimate {
  globalUpchargePercent: number;
  contingencyPercent: number;
  labor: MappableLabor[];
  nonLabor: MappableNonLabor[];
  cloud: MappableCloud[];
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
    });
  }
  return {
    globalUpchargePercent: e.globalUpchargePercent,
    contingencyPercent: e.contingencyPercent,
    lines,
    moneyScale: 4,
  };
}
