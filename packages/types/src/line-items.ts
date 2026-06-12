import { z } from 'zod';
import { BillingPeriod, Money, Percent } from './common';

export const NonLaborType = z.enum(['FIXED', 'RECURRING']);
export type NonLaborType = z.infer<typeof NonLaborType>;

// ── Inputs (validated server-side) ───────────────────────────────────────────

export const LaborLineInput = z.object({
  rateCardRoleId: z.string().uuid().optional(),
  description: z.string().max(500).optional(),
  quantity: z.number().nonnegative().default(1),
  units: z.number().nonnegative(),
  /** If omitted, snapshotted from the selected rate-card role. */
  rateSnapshot: Money.optional(),
  upchargePercentOverride: Percent.nullable().optional(),
  billingPeriod: BillingPeriod.default('ONE_TIME'),
});
export type LaborLineInput = z.infer<typeof LaborLineInput>;

export const NonLaborLineInput = z.object({
  category: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  type: NonLaborType.default('FIXED'),
  amount: Money,
  upchargePercentOverride: Percent.nullable().optional(),
  billingPeriod: BillingPeriod.default('ONE_TIME'),
  periods: z.number().int().min(1).default(1),
});
export type NonLaborLineInput = z.infer<typeof NonLaborLineInput>;

export const CloudLineInput = z.object({
  cloudPriceId: z.string().uuid(),
  quantity: z.number().nonnegative().default(1),
  usageHoursPerMonth: z.number().nonnegative().default(730),
  upchargePercentOverride: Percent.nullable().optional(),
  billingPeriod: BillingPeriod.default('MONTHLY'),
});
export type CloudLineInput = z.infer<typeof CloudLineInput>;

export const AssumptionInput = z.object({ text: z.string().min(1).max(2000) });
export type AssumptionInput = z.infer<typeof AssumptionInput>;

// ── Output DTOs (money as decimal strings) ───────────────────────────────────

export interface LaborLineDto {
  id: string;
  rateCardRoleId: string | null;
  roleName: string | null;
  description: string | null;
  quantity: string;
  units: string;
  rateSnapshot: string;
  upchargePercentOverride: number | null;
  billingPeriod: BillingPeriod;
  lineTotal: string;
}

export interface NonLaborLineDto {
  id: string;
  category: string;
  description: string | null;
  type: NonLaborType;
  amount: string;
  upchargePercentOverride: number | null;
  billingPeriod: BillingPeriod;
  periods: number;
  lineTotal: string;
}

export interface CloudLineDto {
  id: string;
  cloudPriceId: string | null;
  provider: string;
  region: string;
  service: string;
  skuOrInstance: string;
  quantity: string;
  usageHoursPerMonth: string;
  unitPriceSnapshot: string;
  upchargePercentOverride: number | null;
  billingPeriod: BillingPeriod;
  lineTotal: string;
}

export interface AssumptionDto {
  id: string;
  text: string;
  createdAt: string;
}
