import { z } from 'zod';

/**
 * RBAC roles (FR-2, FR-26). GM (General Manager) is an approver: it reviews and
 * approves estimates (or sends them back to draft) but cannot create/edit them.
 */
export const Role = z.enum(['ADMIN', 'ESTIMATOR', 'VIEWER', 'GM']);
export type Role = z.infer<typeof Role>;

/** Billing period for any line item (FR-23). */
export const BillingPeriod = z.enum(['ONE_TIME', 'MONTHLY', 'YEARLY']);
export type BillingPeriod = z.infer<typeof BillingPeriod>;

/**
 * SDLC phase is **data-driven** (FR-29): the set of phases lives in the
 * `SDLC_PHASE` reference table and is validated server-side against the active
 * values — line-item `sdlcPhase` is a plain code string, not a fixed enum.
 *
 * `SDLC_PHASE_ORDER` is only an **ordering hint** for the pure engine (which
 * can't query the DB): known phases render in this lifecycle order, any other
 * (admin-added) phase sorts after them, and un-phased lines roll up under
 * `UNASSIGNED_PHASE` last. It is intentionally NOT a validation list.
 */
export const SDLC_PHASE_ORDER: string[] = [
  'PLANNING',
  'DESIGN',
  'DEVELOPMENT',
  'TESTING',
  'DEPLOYMENT',
  'MAINTENANCE',
];
export const UNASSIGNED_PHASE = 'Unassigned';

/** Labor rate unit (FR-3). */
export const RateUnit = z.enum(['HOUR', 'DAY']);
export type RateUnit = z.infer<typeof RateUnit>;

/**
 * Estimate status is data-driven (FR-29) — values live in the `ESTIMATE_STATUS`
 * reference table and are validated server-side. This is a plain code string.
 */
export const EstimateStatus = z.string().max(40);
export type EstimateStatus = z.infer<typeof EstimateStatus>;

export const CloudProvider = z.enum(['AWS', 'GCP', 'AZURE', 'SAAS']);
export type CloudProvider = z.infer<typeof CloudProvider>;

/** ISO 4217 currency code; single currency per estimate in MVP. */
export const Currency = z.string().regex(/^[A-Z]{3}$/, 'Must be a 3-letter ISO 4217 code');
export type Currency = z.infer<typeof Currency>;

/**
 * Money crosses the wire as a decimal **string** to avoid float drift (NFR-5).
 * Stored as NUMERIC(18,4); cloud unit prices as NUMERIC(18,6).
 */
export const Money = z.string().regex(/^-?\d+(\.\d+)?$/, 'Must be a decimal string');
export type Money = z.infer<typeof Money>;

/** A percentage 0..100 (upcharge, contingency). */
export const Percent = z.number().min(0).max(100);
export type Percent = z.infer<typeof Percent>;

export const Uuid = z.string().uuid();

export const PaginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});
export type PaginationQuery = z.infer<typeof PaginationQuery>;

export interface Page<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
