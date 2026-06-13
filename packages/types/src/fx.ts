import { z } from 'zod';

/** Base reporting currency for multi-currency roll-ups (FR-17). */
export const BASE_CURRENCY = 'USD';

export interface FxRateDto {
  currency: string;
  /** Base-currency (USD) units per 1 unit of `currency`; decimal string. */
  rateToBase: string;
  updatedByEmail: string | null;
  updatedAt: string;
}

export const UpdateFxRateRequest = z.object({
  rateToBase: z.string().regex(/^\d+(\.\d+)?$/, 'Must be a positive decimal string'),
});
export type UpdateFxRateRequest = z.infer<typeof UpdateFxRateRequest>;
