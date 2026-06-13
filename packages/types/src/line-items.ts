import { z } from 'zod';
import { BillingPeriod, Money, Percent } from './common';

/** An SDLC-phase code, validated server-side against active SDLC_PHASE reference values (FR-29). */
const SdlcPhaseCode = z.string().max(80);

export const NonLaborType = z.enum(['FIXED', 'RECURRING']);
export type NonLaborType = z.infer<typeof NonLaborType>;

// ── Inputs (validated server-side) ───────────────────────────────────────────

/** Calendar date as 'YYYY-MM-DD' (resource scheduling, FR-27). */
export const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a YYYY-MM-DD date');

export const LaborLineInput = z
  .object({
    rateCardRoleId: z.string().uuid().optional(),
    description: z.string().max(500).optional(),
    quantity: z.number().nonnegative().default(1),
    units: z.number().nonnegative(),
    /** If omitted, snapshotted from the selected rate-card role. */
    rateSnapshot: Money.optional(),
    upchargePercentOverride: Percent.nullable().optional(),
    billingPeriod: BillingPeriod.default('ONE_TIME'),
    sdlcPhase: SdlcPhaseCode.nullable().optional(),
    /** Resource scheduling (FR-27): who, what share of their 100%/day, over which dates. */
    resourceName: z.string().max(200).optional(),
    allocationPercent: Percent.default(100),
    startDate: IsoDate.optional(),
    endDate: IsoDate.optional(),
    /** Three-point estimate (FR-13). When all three are set, effective units = PERT. */
    unitsOptimistic: z.number().nonnegative().optional(),
    unitsMostLikely: z.number().nonnegative().optional(),
    unitsPessimistic: z.number().nonnegative().optional(),
  })
  .refine((v) => (v.startDate == null) === (v.endDate == null), {
    message: 'Provide both a start and end date, or neither.',
    path: ['endDate'],
  })
  .refine((v) => !v.startDate || !v.endDate || v.endDate >= v.startDate, {
    message: 'End date must be on or after the start date.',
    path: ['endDate'],
  })
  .refine(
    (v) =>
      (v.unitsOptimistic == null && v.unitsMostLikely == null && v.unitsPessimistic == null) ||
      (v.unitsOptimistic != null && v.unitsMostLikely != null && v.unitsPessimistic != null),
    {
      message: 'Provide all three of optimistic/most-likely/pessimistic, or none.',
      path: ['unitsMostLikely'],
    },
  )
  .refine(
    (v) =>
      v.unitsOptimistic == null ||
      (v.unitsOptimistic <= (v.unitsMostLikely ?? 0) &&
        (v.unitsMostLikely ?? 0) <= (v.unitsPessimistic ?? 0)),
    {
      message: 'Three-point estimate must satisfy optimistic ≤ most-likely ≤ pessimistic.',
      path: ['unitsPessimistic'],
    },
  );
export type LaborLineInput = z.infer<typeof LaborLineInput>;

export const NonLaborLineInput = z.object({
  category: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  type: NonLaborType.default('FIXED'),
  amount: Money,
  upchargePercentOverride: Percent.nullable().optional(),
  billingPeriod: BillingPeriod.default('ONE_TIME'),
  periods: z.number().int().min(1).default(1),
  sdlcPhase: SdlcPhaseCode.nullable().optional(),
});
export type NonLaborLineInput = z.infer<typeof NonLaborLineInput>;

export const CloudLineInput = z.object({
  cloudPriceId: z.string().uuid(),
  quantity: z.number().nonnegative().default(1),
  usageHoursPerMonth: z.number().nonnegative().default(730),
  upchargePercentOverride: Percent.nullable().optional(),
  billingPeriod: BillingPeriod.default('MONTHLY'),
  sdlcPhase: SdlcPhaseCode.nullable().optional(),
});
export type CloudLineInput = z.infer<typeof CloudLineInput>;

export const AssumptionInput = z.object({ text: z.string().min(1).max(2000) });
export type AssumptionInput = z.infer<typeof AssumptionInput>;

/** A collaboration comment on an estimate (FR-19). */
export const CommentInput = z.object({ text: z.string().min(1).max(4000) });
export type CommentInput = z.infer<typeof CommentInput>;

export interface CommentDto {
  id: string;
  authorId: string;
  authorEmail: string;
  text: string;
  createdAt: string;
}

// ── Output DTOs (money as decimal strings) ───────────────────────────────────

export interface LaborLineDto {
  id: string;
  rateCardRoleId: string | null;
  roleName: string | null;
  description: string | null;
  quantity: string;
  units: string;
  /** Three-point estimate (FR-13); null unless used. `units` reflects the PERT expected value. */
  unitsOptimistic: string | null;
  unitsMostLikely: string | null;
  unitsPessimistic: string | null;
  rateSnapshot: string;
  upchargePercentOverride: number | null;
  billingPeriod: BillingPeriod;
  sdlcPhase: string | null;
  resourceName: string | null;
  allocationPercent: number;
  startDate: string | null;
  endDate: string | null;
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
  sdlcPhase: string | null;
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
  sdlcPhase: string | null;
  lineTotal: string;
}

export interface AssumptionDto {
  id: string;
  text: string;
  createdAt: string;
}
