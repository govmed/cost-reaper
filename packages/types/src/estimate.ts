import { z } from 'zod';
import { BillingPeriod, Currency, EstimateStatus, Money, Percent } from './common';

// ── Estimation-engine I/O (the shared contract the pure engine implements) ───

/**
 * A normalized line fed to the estimation engine. `baseAmount` is the
 * pre-upcharge unit amount; the line's base value = baseAmount × quantity.
 */
export const EngineLine = z.object({
  id: z.string(),
  category: z.string().min(1),
  baseAmount: Money,
  quantity: z.number().nonnegative().default(1),
  billingPeriod: BillingPeriod,
  /** Per-line upcharge override; null → estimate's global upcharge applies (FR-22). */
  upchargePercentOverride: Percent.nullable().default(null),
});
export type EngineLine = z.infer<typeof EngineLine>;

export const EngineInput = z.object({
  globalUpchargePercent: Percent.default(0),
  contingencyPercent: Percent.default(0),
  lines: z.array(EngineLine),
  /** Money rounding scale (default 4 → NUMERIC(18,4)). */
  moneyScale: z.number().int().min(0).max(8).default(4),
});
export type EngineInput = z.infer<typeof EngineInput>;

/** Post-upcharge, pre-contingency subtotal for one category. */
export const CategorySubtotal = z.object({
  category: z.string(),
  oneTime: Money,
  monthly: Money,
  yearly: Money,
});
export type CategorySubtotal = z.infer<typeof CategorySubtotal>;

export const EngineResult = z.object({
  /** Post-upcharge, pre-contingency subtotals. */
  oneTimeSubtotal: Money,
  monthlySubtotal: Money,
  yearlySubtotal: Money,
  /** Total markup added across all lines (informational). */
  upchargeAmount: Money,
  /** Contingency added on top of (one-time + annualized) subtotal. */
  contingencyAmount: Money,
  /** Post-contingency totals. */
  oneTimeTotal: Money,
  monthlyTotal: Money,
  yearlyTotal: Money,
  /** one-time + annualized (yearly) recurring, post-contingency. */
  grandTotal: Money,
  categories: z.array(CategorySubtotal),
});
export type EngineResult = z.infer<typeof EngineResult>;

// ── Estimate API DTOs ────────────────────────────────────────────────────────

export const CreateEstimateRequest = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(4000).optional(),
  currency: Currency,
  rateCardId: z.string().uuid().optional(),
  globalUpchargePercent: Percent.default(0),
  contingencyPercent: Percent.default(0),
});
export type CreateEstimateRequest = z.infer<typeof CreateEstimateRequest>;

export const EstimateSummaryDto = z.object({
  id: z.string().uuid(),
  name: z.string(),
  status: EstimateStatus,
  currency: Currency,
  ownerId: z.string().uuid(),
  currentStageKey: z.string().nullable(),
  grandTotal: Money,
  updatedAt: z.string().datetime(),
});
export type EstimateSummaryDto = z.infer<typeof EstimateSummaryDto>;
