/** Dashboard summary (FR-18, FE-27) — counts, totals, and recent activity. */
export interface DashboardSummary {
  totalEstimates: number;
  byStage: { stageKey: string; stageLabel: string; count: number }[];
  /** Grand totals summed per currency (estimates are single-currency, MVP). */
  totalsByCurrency: { currency: string; grandTotal: string }[];
  /** All currencies converted via FX to the base currency (FR-17). */
  baseCurrency: string;
  baseCurrencyTotal: string;
  recent: {
    id: string;
    name: string;
    currency: string;
    currentStageKey: string | null;
    grandTotal: string;
    updatedAt: string;
  }[];
}

/** One estimate in a workflow-stage drill-down (FR-18) — click a stage to see these. */
export interface DashboardStageEstimate {
  id: string;
  name: string;
  currency: string;
  grandTotal: string;
  updatedAt: string;
}
