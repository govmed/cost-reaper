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
  /** SDLC phase code this line rolls up under; null → "Unassigned" (FR-28, data-driven FR-29). */
  sdlcPhase: z.string().nullable().default(null),
});
export type EngineLine = z.infer<typeof EngineLine>;

export const EngineInput = z.object({
  globalUpchargePercent: Percent.default(0),
  contingencyPercent: Percent.default(0),
  /** Client-pricing margin on the grand total (FR-16): sellPrice = cost / (1 − margin). */
  marginPercent: Percent.default(0),
  /** Tax applied on the sell price to get the final client price (FR-16). */
  taxPercent: Percent.default(0),
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

/** Post-upcharge, pre-contingency subtotal for one SDLC phase (FR-28). */
export const PhaseSubtotal = z.object({
  phase: z.string(),
  oneTime: Money,
  monthly: Money,
  yearly: Money,
});
export type PhaseSubtotal = z.infer<typeof PhaseSubtotal>;

/** A resource over-allocation on a given date (FR-27). */
export const CapacityViolationDto = z.object({
  resourceName: z.string(),
  date: z.string(),
  totalPercent: z.number(),
});
export type CapacityViolationDto = z.infer<typeof CapacityViolationDto>;

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
  /** one-time + annualized (yearly) recurring, post-contingency. This is the **cost**. */
  grandTotal: Money,
  /** Client pricing (FR-16). marginAmount/taxAmount add to grandTotal. */
  marginAmount: Money,
  /** Cost + margin (the client price before tax). */
  sellPrice: Money,
  taxAmount: Money,
  /** Final client price = sellPrice + tax. */
  clientPrice: Money,
  categories: z.array(CategorySubtotal),
  /** Cost rolled up per SDLC phase (FR-28). */
  phases: z.array(PhaseSubtotal),
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
  marginPercent: Percent.default(0),
  taxPercent: Percent.default(0),
});
export type CreateEstimateRequest = z.infer<typeof CreateEstimateRequest>;

export const UpdateEstimateRequest = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(4000).nullable().optional(),
  status: EstimateStatus.optional(),
  rateCardId: z.string().uuid().nullable().optional(),
  globalUpchargePercent: Percent.optional(),
  contingencyPercent: Percent.optional(),
  marginPercent: Percent.optional(),
  taxPercent: Percent.optional(),
});
export type UpdateEstimateRequest = z.infer<typeof UpdateEstimateRequest>;

export const EstimateListQuery = z.object({
  q: z.string().optional(),
  status: EstimateStatus.optional(),
  ownerId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(20),
});
export type EstimateListQuery = z.infer<typeof EstimateListQuery>;

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

/** Capture a versioned baseline of an estimate (FR-15). */
export const CaptureBaselineRequest = z.object({ label: z.string().min(1).max(120) });
export type CaptureBaselineRequest = z.infer<typeof CaptureBaselineRequest>;

/** A captured baseline's headline figures (the full snapshot is stored server-side). */
export interface BaselineDto {
  id: string;
  label: string;
  grandTotal: string;
  clientPrice: string;
  oneTimeTotal: string;
  monthlyTotal: string;
  yearlyTotal: string;
  createdByEmail: string;
  createdAt: string;
}

/** One estimate in a scenario comparison group (FR-14). */
export interface ScenarioDto {
  id: string;
  name: string;
  status: EstimateStatus;
  currency: string;
  grandTotal: string;
  clientPrice: string;
  isCurrent: boolean;
  isRoot: boolean;
  updatedAt: string;
}
