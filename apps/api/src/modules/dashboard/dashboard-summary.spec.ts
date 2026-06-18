import { describe, it, expect } from 'vitest';
import { summarizeDashboard, type DashboardRow } from './dashboard-summary';

const row = (p: Partial<DashboardRow>): DashboardRow => ({
  id: p.id ?? 'e',
  name: p.name ?? 'E',
  currency: p.currency ?? 'USD',
  currentStageKey: p.currentStageKey === undefined ? 'DRAFT' : p.currentStageKey,
  currentStageLabel: p.currentStageLabel === undefined ? 'Draft' : p.currentStageLabel,
  grandTotal: p.grandTotal ?? '0.0000',
  updatedAt: p.updatedAt ?? '2026-06-12T00:00:00.000Z',
});

describe('summarizeDashboard (FR-18)', () => {
  it('returns zeros for no estimates', () => {
    const s = summarizeDashboard([]);
    expect(s.totalEstimates).toBe(0);
    expect(s.byStage).toEqual([]);
    expect(s.totalsByCurrency).toEqual([]);
    expect(s.recent).toEqual([]);
  });

  it('counts by stage, and sums grand totals per currency exactly', () => {
    const s = summarizeDashboard([
      row({ id: 'a', currency: 'USD', grandTotal: '1000.5000' }),
      row({
        id: 'b',
        currency: 'USD',
        grandTotal: '0.5000',
        currentStageKey: 'FINAL',
        currentStageLabel: 'Final',
      }),
      row({ id: 'c', currency: 'EUR', grandTotal: '250.0000' }),
    ]);
    expect(s.totalEstimates).toBe(3);
    expect(s.totalsByCurrency).toEqual([
      { currency: 'EUR', grandTotal: '250.0000' },
      { currency: 'USD', grandTotal: '1001.0000' }, // 1000.5 + 0.5, exact
    ]);
    expect(s.byStage.find((x) => x.stageKey === 'DRAFT')?.count).toBe(2);
    expect(s.byStage.find((x) => x.stageKey === 'FINAL')?.count).toBe(1);
  });

  it('returns the most-recently-updated estimates, newest first, capped', () => {
    const s = summarizeDashboard(
      [
        row({ id: 'old', updatedAt: '2026-01-01T00:00:00.000Z' }),
        row({ id: 'new', updatedAt: '2026-06-12T00:00:00.000Z' }),
        row({ id: 'mid', updatedAt: '2026-03-01T00:00:00.000Z' }),
      ],
      2,
    );
    expect(s.recent.map((r) => r.id)).toEqual(['new', 'mid']);
  });

  it('converts per-currency totals to the base currency via FX (FR-17)', () => {
    const s = summarizeDashboard(
      [
        row({ currency: 'USD', grandTotal: '1000.0000' }),
        row({ currency: 'EUR', grandTotal: '100.0000' }),
      ],
      5,
      { EUR: 1.08 },
    );
    expect(s.baseCurrency).toBe('USD');
    expect(s.baseCurrencyTotal).toBe('1108.0000'); // 1000 + 100 × 1.08
  });

  it('buckets estimates with no stage under Unassigned', () => {
    const s = summarizeDashboard([row({ currentStageKey: null, currentStageLabel: null })]);
    expect(s.byStage).toEqual([{ stageKey: 'UNASSIGNED', stageLabel: 'Unassigned', count: 1 }]);
  });
});
