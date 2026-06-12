import { sumMoney } from '@cost-reaper/engine';
import type { DashboardSummary, EstimateStatus } from '@cost-reaper/types';

/** One estimate's already-computed headline figures (the aggregator's input). */
export interface DashboardRow {
  id: string;
  name: string;
  status: EstimateStatus;
  currency: string;
  currentStageKey: string | null;
  currentStageLabel: string | null;
  grandTotal: string;
  updatedAt: string;
}

/**
 * Pure dashboard aggregation (FR-18) — counts by status & stage, grand totals
 * per currency (exact decimal sum), and the most-recently-updated estimates.
 * I/O-free so it's unit-testable in isolation.
 */
export function summarizeDashboard(rows: DashboardRow[], recentLimit = 5): DashboardSummary {
  const statusCounts = new Map<EstimateStatus, number>();
  for (const r of rows) statusCounts.set(r.status, (statusCounts.get(r.status) ?? 0) + 1);
  const byStatus = [...statusCounts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([status, count]) => ({ status, count }));

  const stageMap = new Map<string, { label: string; count: number }>();
  for (const r of rows) {
    const key = r.currentStageKey ?? 'UNASSIGNED';
    const entry = stageMap.get(key) ?? { label: r.currentStageLabel ?? 'Unassigned', count: 0 };
    entry.count += 1;
    stageMap.set(key, entry);
  }
  const byStage = [...stageMap.entries()].map(([stageKey, v]) => ({
    stageKey,
    stageLabel: v.label,
    count: v.count,
  }));

  const curMap = new Map<string, string[]>();
  for (const r of rows) {
    const list = curMap.get(r.currency) ?? [];
    list.push(r.grandTotal);
    curMap.set(r.currency, list);
  }
  const totalsByCurrency = [...curMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([currency, vals]) => ({ currency, grandTotal: sumMoney(vals) }));

  const recent = [...rows]
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0))
    .slice(0, recentLimit)
    .map((r) => ({
      id: r.id,
      name: r.name,
      status: r.status,
      currency: r.currency,
      currentStageKey: r.currentStageKey,
      grandTotal: r.grandTotal,
      updatedAt: r.updatedAt,
    }));

  return { totalEstimates: rows.length, byStatus, byStage, totalsByCurrency, recent };
}
