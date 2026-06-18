/**
 * Dashboard card — full QA (FR-18). 51 cases against the pure `summarizeDashboard`
 * aggregator: totals, by-status, by-stage (incl. Unassigned), per-currency exact
 * sums, the recent list (ordering / cap), and FX roll-up to the base currency.
 */
import { describe, it, expect } from 'vitest';
import { BASE_CURRENCY } from '@cost-reaper/types';
import { summarizeDashboard, type DashboardRow } from './dashboard-summary';

const row = (p: Partial<DashboardRow> = {}): DashboardRow => ({
  id: p.id ?? 'e',
  name: p.name ?? 'E',
  status: p.status ?? 'DRAFT',
  currency: p.currency ?? 'USD',
  currentStageKey: p.currentStageKey === undefined ? 'DRAFT' : p.currentStageKey,
  currentStageLabel: p.currentStageLabel === undefined ? 'Draft' : p.currentStageLabel,
  grandTotal: p.grandTotal ?? '0.0000',
  updatedAt: p.updatedAt ?? '2026-06-12T00:00:00.000Z',
});

describe('Dashboard · empty input', () => {
  it('DB-01 totalEstimates is 0 for no estimates', () => {
    expect(summarizeDashboard([]).totalEstimates).toBe(0);
  });
  it('DB-02 byStatus is empty', () => {
    expect(summarizeDashboard([]).byStatus).toEqual([]);
  });
  it('DB-03 byStage is empty', () => {
    expect(summarizeDashboard([]).byStage).toEqual([]);
  });
  it('DB-04 totalsByCurrency is empty', () => {
    expect(summarizeDashboard([]).totalsByCurrency).toEqual([]);
  });
  it('DB-05 recent is empty', () => {
    expect(summarizeDashboard([]).recent).toEqual([]);
  });
  it('DB-06 baseCurrencyTotal is 0.0000', () => {
    expect(summarizeDashboard([]).baseCurrencyTotal).toBe('0.0000');
  });
  it('DB-07 baseCurrency is the configured base (USD)', () => {
    expect(summarizeDashboard([]).baseCurrency).toBe(BASE_CURRENCY);
  });
});

describe('Dashboard · total count', () => {
  it('DB-08 counts a single estimate', () => {
    expect(summarizeDashboard([row()]).totalEstimates).toBe(1);
  });
  it('DB-09 counts several estimates', () => {
    expect(summarizeDashboard([row(), row(), row()]).totalEstimates).toBe(3);
  });
  it('DB-10 counts a large volume', () => {
    const rows = Array.from({ length: 500 }, (_, i) => row({ id: `e${i}` }));
    expect(summarizeDashboard(rows).totalEstimates).toBe(500);
  });
});

describe('Dashboard · by status', () => {
  it('DB-11 a single status is counted', () => {
    const s = summarizeDashboard([row({ status: 'DRAFT' })]);
    expect(s.byStatus).toEqual([{ status: 'DRAFT', count: 1 }]);
  });
  it('DB-12 multiple statuses are counted separately', () => {
    const s = summarizeDashboard([
      row({ status: 'DRAFT' }),
      row({ status: 'FINAL' }),
      row({ status: 'DRAFT' }),
    ]);
    expect(s.byStatus.find((x) => x.status === 'DRAFT')?.count).toBe(2);
    expect(s.byStatus.find((x) => x.status === 'FINAL')?.count).toBe(1);
  });
  it('DB-13 byStatus is sorted alphabetically', () => {
    const s = summarizeDashboard([
      row({ status: 'FINAL' }),
      row({ status: 'APPROVED' }),
      row({ status: 'DRAFT' }),
    ]);
    expect(s.byStatus.map((x) => x.status)).toEqual(['APPROVED', 'DRAFT', 'FINAL']);
  });
  it('DB-14 the same status aggregates into one bucket', () => {
    const s = summarizeDashboard([row({ status: 'DRAFT' }), row({ status: 'DRAFT' })]);
    expect(s.byStatus).toHaveLength(1);
  });
  it('DB-15 accepts arbitrary (data-driven) status codes', () => {
    const s = summarizeDashboard([row({ status: 'IN_REVIEW' }), row({ status: 'ARCHIVED' })]);
    expect(s.byStatus.map((x) => x.status)).toEqual(['ARCHIVED', 'IN_REVIEW']);
  });
  it('DB-16 status counts sum to the total', () => {
    const rows = [row({ status: 'DRAFT' }), row({ status: 'FINAL' }), row({ status: 'FINAL' })];
    const s = summarizeDashboard(rows);
    expect(s.byStatus.reduce((a, x) => a + x.count, 0)).toBe(rows.length);
  });
  it('DB-17 a status bucket exists per distinct status', () => {
    const s = summarizeDashboard([
      row({ status: 'A' }),
      row({ status: 'B' }),
      row({ status: 'C' }),
    ]);
    expect(s.byStatus).toHaveLength(3);
  });
});

describe('Dashboard · by stage', () => {
  it('DB-18 a single stage is counted', () => {
    const s = summarizeDashboard([row({ currentStageKey: 'DRAFT', currentStageLabel: 'Draft' })]);
    expect(s.byStage).toEqual([{ stageKey: 'DRAFT', stageLabel: 'Draft', count: 1 }]);
  });
  it('DB-19 multiple stages are counted separately', () => {
    const s = summarizeDashboard([
      row({ currentStageKey: 'DRAFT', currentStageLabel: 'Draft' }),
      row({ currentStageKey: 'APPROVED', currentStageLabel: 'Approved' }),
      row({ currentStageKey: 'DRAFT', currentStageLabel: 'Draft' }),
    ]);
    expect(s.byStage.find((x) => x.stageKey === 'DRAFT')?.count).toBe(2);
    expect(s.byStage.find((x) => x.stageKey === 'APPROVED')?.count).toBe(1);
  });
  it('DB-20 a null stage key buckets under UNASSIGNED', () => {
    const s = summarizeDashboard([row({ currentStageKey: null, currentStageLabel: null })]);
    expect(s.byStage.find((x) => x.stageKey === 'UNASSIGNED')?.count).toBe(1);
  });
  it('DB-21 a null stage with no label shows "Unassigned"', () => {
    const s = summarizeDashboard([row({ currentStageKey: null, currentStageLabel: null })]);
    expect(s.byStage.find((x) => x.stageKey === 'UNASSIGNED')?.stageLabel).toBe('Unassigned');
  });
  it('DB-22 the stage label comes from currentStageLabel', () => {
    const s = summarizeDashboard([row({ currentStageKey: 'X', currentStageLabel: 'In Review' })]);
    expect(s.byStage[0].stageLabel).toBe('In Review');
  });
  it('DB-23 mixes assigned + unassigned stages', () => {
    const s = summarizeDashboard([
      row({ currentStageKey: 'DRAFT', currentStageLabel: 'Draft' }),
      row({ currentStageKey: null, currentStageLabel: null }),
    ]);
    expect(s.byStage).toHaveLength(2);
  });
  it('DB-24 stage counts sum to the total', () => {
    const rows = [
      row({ currentStageKey: 'DRAFT' }),
      row({ currentStageKey: 'FINAL', currentStageLabel: 'Final' }),
      row({ currentStageKey: null, currentStageLabel: null }),
    ];
    const s = summarizeDashboard(rows);
    expect(s.byStage.reduce((a, x) => a + x.count, 0)).toBe(rows.length);
  });
  it('DB-25 the first-seen label wins for a stage key', () => {
    const s = summarizeDashboard([
      row({ currentStageKey: 'DRAFT', currentStageLabel: 'Draft' }),
      row({ currentStageKey: 'DRAFT', currentStageLabel: 'Draft (stale label)' }),
    ]);
    expect(s.byStage.find((x) => x.stageKey === 'DRAFT')?.stageLabel).toBe('Draft');
  });
});

describe('Dashboard · totals by currency (exact decimals)', () => {
  it('DB-26 sums a single currency', () => {
    const s = summarizeDashboard([
      row({ currency: 'USD', grandTotal: '100' }),
      row({ currency: 'USD', grandTotal: '250' }),
    ]);
    expect(s.totalsByCurrency).toEqual([{ currency: 'USD', grandTotal: '350.0000' }]);
  });
  it('DB-27 keeps currencies separate', () => {
    const s = summarizeDashboard([
      row({ currency: 'USD', grandTotal: '100' }),
      row({ currency: 'EUR', grandTotal: '200' }),
    ]);
    expect(s.totalsByCurrency.find((c) => c.currency === 'USD')?.grandTotal).toBe('100.0000');
    expect(s.totalsByCurrency.find((c) => c.currency === 'EUR')?.grandTotal).toBe('200.0000');
  });
  it('DB-28 is sorted by currency code', () => {
    const s = summarizeDashboard([
      row({ currency: 'USD', grandTotal: '1' }),
      row({ currency: 'EUR', grandTotal: '1' }),
      row({ currency: 'GBP', grandTotal: '1' }),
    ]);
    expect(s.totalsByCurrency.map((c) => c.currency)).toEqual(['EUR', 'GBP', 'USD']);
  });
  it('DB-29 sums exact decimals (no float drift)', () => {
    const s = summarizeDashboard([
      row({ currency: 'USD', grandTotal: '0.1' }),
      row({ currency: 'USD', grandTotal: '0.2' }),
    ]);
    expect(s.totalsByCurrency[0].grandTotal).toBe('0.3000');
  });
  it('DB-30 nets positive and negative amounts', () => {
    const s = summarizeDashboard([
      row({ currency: 'USD', grandTotal: '100' }),
      row({ currency: 'USD', grandTotal: '-30' }),
    ]);
    expect(s.totalsByCurrency[0].grandTotal).toBe('70.0000');
  });
  it('DB-31 a single estimate yields its own total', () => {
    const s = summarizeDashboard([row({ currency: 'USD', grandTotal: '4200.5' })]);
    expect(s.totalsByCurrency[0].grandTotal).toBe('4200.5000');
  });
  it('DB-32 sums many values precisely', () => {
    const rows = Array.from({ length: 10 }, () => row({ currency: 'USD', grandTotal: '0.3333' }));
    expect(summarizeDashboard(rows).totalsByCurrency[0].grandTotal).toBe('3.3330');
  });
  it('DB-33 one bucket per distinct currency', () => {
    const s = summarizeDashboard([
      row({ currency: 'USD' }),
      row({ currency: 'EUR' }),
      row({ currency: 'USD' }),
    ]);
    expect(s.totalsByCurrency).toHaveLength(2);
  });
});

describe('Dashboard · recent estimates', () => {
  const ts = (d: string) => `2026-06-${d}T00:00:00.000Z`;
  it('DB-34 returns most-recently-updated first', () => {
    const s = summarizeDashboard([
      row({ id: 'old', updatedAt: ts('10') }),
      row({ id: 'new', updatedAt: ts('15') }),
      row({ id: 'mid', updatedAt: ts('12') }),
    ]);
    expect(s.recent.map((r) => r.id)).toEqual(['new', 'mid', 'old']);
  });
  it('DB-35 caps at the default limit of 5', () => {
    const rows = Array.from({ length: 8 }, (_, i) =>
      row({ id: `e${i}`, updatedAt: ts(`${10 + i}`) }),
    );
    expect(summarizeDashboard(rows).recent).toHaveLength(5);
  });
  it('DB-36 honors a custom recent limit', () => {
    const rows = Array.from({ length: 8 }, (_, i) =>
      row({ id: `e${i}`, updatedAt: ts(`${10 + i}`) }),
    );
    expect(summarizeDashboard(rows, 3).recent).toHaveLength(3);
  });
  it('DB-37 returns all when fewer than the limit', () => {
    expect(summarizeDashboard([row(), row()], 5).recent).toHaveLength(2);
  });
  it('DB-38 a recentLimit of 0 returns none', () => {
    expect(summarizeDashboard([row(), row()], 0).recent).toEqual([]);
  });
  it('DB-39 the cap keeps the newest, drops the oldest', () => {
    const rows = Array.from({ length: 6 }, (_, i) =>
      row({ id: `e${i}`, updatedAt: ts(`${10 + i}`) }),
    );
    const recent = summarizeDashboard(rows, 5).recent;
    expect(recent.map((r) => r.id)).toEqual(['e5', 'e4', 'e3', 'e2', 'e1']);
  });
  it('DB-40 each recent row carries the headline fields', () => {
    const s = summarizeDashboard([
      row({
        id: 'x',
        name: 'Big Bid',
        status: 'FINAL',
        currency: 'EUR',
        grandTotal: '99',
        updatedAt: ts('20'),
      }),
    ]);
    expect(s.recent[0]).toMatchObject({
      id: 'x',
      name: 'Big Bid',
      status: 'FINAL',
      currency: 'EUR',
      grandTotal: '99',
    });
  });
  it('DB-41 a recent row preserves a null stage key', () => {
    const s = summarizeDashboard([row({ currentStageKey: null, currentStageLabel: null })]);
    expect(s.recent[0].currentStageKey).toBeNull();
  });
  it('DB-42 does not mutate the input array order', () => {
    const rows = [row({ id: 'a', updatedAt: ts('10') }), row({ id: 'b', updatedAt: ts('20') })];
    summarizeDashboard(rows);
    expect(rows.map((r) => r.id)).toEqual(['a', 'b']);
  });
});

describe('Dashboard · base-currency FX roll-up (FR-17)', () => {
  it('DB-43 base currency passes through at rate 1', () => {
    const s = summarizeDashboard([row({ currency: 'USD', grandTotal: '100' })]);
    expect(s.baseCurrencyTotal).toBe('100.0000');
  });
  it('DB-44 converts a foreign currency via the FX rate', () => {
    const s = summarizeDashboard([row({ currency: 'EUR', grandTotal: '100' })], 5, { EUR: 1.1 });
    expect(s.baseCurrencyTotal).toBe('110.0000');
  });
  it('DB-45 sums base + converted foreign totals', () => {
    const s = summarizeDashboard(
      [row({ currency: 'USD', grandTotal: '100' }), row({ currency: 'EUR', grandTotal: '100' })],
      5,
      { EUR: 1.1 },
    );
    expect(s.baseCurrencyTotal).toBe('210.0000');
  });
  it('DB-46 a currency with no FX rate contributes 0', () => {
    const s = summarizeDashboard(
      [row({ currency: 'USD', grandTotal: '100' }), row({ currency: 'GBP', grandTotal: '500' })],
      5,
      {},
    );
    expect(s.baseCurrencyTotal).toBe('100.0000');
  });
  it('DB-47 default (no fxRates) counts only base-currency totals', () => {
    const s = summarizeDashboard([
      row({ currency: 'USD', grandTotal: '100' }),
      row({ currency: 'EUR', grandTotal: '999' }),
    ]);
    expect(s.baseCurrencyTotal).toBe('100.0000');
  });
  it('DB-48 converts multiple foreign currencies', () => {
    const s = summarizeDashboard(
      [row({ currency: 'EUR', grandTotal: '100' }), row({ currency: 'GBP', grandTotal: '100' })],
      5,
      { EUR: 1.1, GBP: 1.25 },
    );
    expect(s.baseCurrencyTotal).toBe('235.0000');
  });
  it('DB-49 applies a fractional FX rate exactly', () => {
    const s = summarizeDashboard([row({ currency: 'EUR', grandTotal: '250' })], 5, { EUR: 1.087 });
    expect(s.baseCurrencyTotal).toBe('271.7500');
  });
  it('DB-50 converts negative totals too', () => {
    const s = summarizeDashboard([row({ currency: 'EUR', grandTotal: '-100' })], 5, { EUR: 1.1 });
    expect(s.baseCurrencyTotal).toBe('-110.0000');
  });
});

describe('Dashboard · output shape', () => {
  it('DB-51 returns every dashboard field', () => {
    const s = summarizeDashboard([row()]);
    expect(Object.keys(s).sort()).toEqual(
      [
        'baseCurrency',
        'baseCurrencyTotal',
        'byStage',
        'byStatus',
        'recent',
        'totalEstimates',
        'totalsByCurrency',
      ].sort(),
    );
  });
});
