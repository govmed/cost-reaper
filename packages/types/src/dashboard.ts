import type { EstimateStatus } from './common';

/** Dashboard summary (FR-18, FE-27) — counts, totals, and recent activity. */
export interface DashboardSummary {
  totalEstimates: number;
  byStatus: { status: EstimateStatus; count: number }[];
  byStage: { stageKey: string; stageLabel: string; count: number }[];
  /** Grand totals summed per currency (estimates are single-currency, MVP). */
  totalsByCurrency: { currency: string; grandTotal: string }[];
  /** All currencies converted via FX to the base currency (FR-17). */
  baseCurrency: string;
  baseCurrencyTotal: string;
  recent: {
    id: string;
    name: string;
    status: EstimateStatus;
    currency: string;
    currentStageKey: string | null;
    grandTotal: string;
    updatedAt: string;
  }[];
}
