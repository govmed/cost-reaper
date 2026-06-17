/**
 * Volume / performance QA (NFR-1, NFR-2) — the estimation engine and the
 * capacity guard at scale: a 500-line estimate, a 200-line recalculation, a
 * 500-estimate batch, and a 500-line capacity sweep. Asserts correctness AND
 * generous timing bounds (engine math is pure & fast; bounds catch regressions
 * without flaking on CI variance).
 */
import { describe, it, expect } from 'vitest';
import { computeEstimate, findCapacityViolations } from '@cost-reaper/engine';
import type { EngineInput, EngineLine } from '@cost-reaper/types';

const makeLines = (n: number, baseAmount = '100'): EngineLine[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `L${i}`,
    category: `Cat${i % 5}`,
    baseAmount,
    quantity: 1,
    billingPeriod: 'ONE_TIME' as const,
    upchargePercentOverride: null,
    sdlcPhase: null,
  }));

const input = (lines: EngineLine[], extra: Partial<EngineInput> = {}): EngineInput => ({
  globalUpchargePercent: 0,
  contingencyPercent: 0,
  marginPercent: 0,
  taxPercent: 0,
  moneyScale: 4,
  lines,
  ...extra,
});

describe('Volume · large single estimate', () => {
  it('VOL-01 computes a 500-line estimate with the correct grand total', () => {
    const r = computeEstimate(input(makeLines(500, '100')));
    expect(r.grandTotal).toBe('50000.0000'); // 500 × 100
  });

  it('VOL-02 a 500-line estimate computes well under 500ms', () => {
    const lines = makeLines(500, '100');
    const start = Date.now();
    computeEstimate(input(lines));
    expect(Date.now() - start).toBeLessThan(500);
  });

  it('VOL-03 a 200-line recalculation (NFR-1) completes under 500ms', () => {
    const lines = makeLines(200, '125.55');
    const start = Date.now();
    const r = computeEstimate(input(lines, { globalUpchargePercent: 10, contingencyPercent: 5 }));
    expect(Date.now() - start).toBeLessThan(500);
    // 200 × 125.55 = 25110 → +10% = 27621 → +5% = 28002.05
    expect(r.grandTotal).toBe('29002.0500');
  });

  it('VOL-04 categories aggregate correctly at volume (5 buckets of 100 lines)', () => {
    const r = computeEstimate(input(makeLines(500, '100')));
    expect(r.categories).toHaveLength(5);
    for (const c of r.categories) expect(c.oneTime).toBe('10000.0000'); // 100 lines × 100
  });

  it('VOL-05 a 1000-line estimate still computes under 1s and stays exact', () => {
    const start = Date.now();
    const r = computeEstimate(input(makeLines(1000, '10')));
    expect(Date.now() - start).toBeLessThan(1000);
    expect(r.grandTotal).toBe('10000.0000'); // 1000 × 10
  });
});

describe('Volume · 500-estimate batch (NFR-2)', () => {
  it('VOL-06 computes 500 estimates with consistent, correct totals', () => {
    const results = Array.from({ length: 500 }, () => computeEstimate(input(makeLines(50, '100'))));
    expect(results).toHaveLength(500);
    for (const r of results) expect(r.grandTotal).toBe('5000.0000'); // 50 × 100
  });

  it('VOL-07 the 500-estimate batch completes in a reasonable time', () => {
    const start = Date.now();
    for (let i = 0; i < 500; i++) computeEstimate(input(makeLines(50, '100')));
    expect(Date.now() - start).toBeLessThan(5000);
  });

  it('VOL-08 a 500-estimate batch with mixed billing periods annualizes correctly', () => {
    const mixed: EngineLine[] = [
      {
        id: 'a',
        category: 'C',
        baseAmount: '100',
        quantity: 1,
        billingPeriod: 'ONE_TIME',
        upchargePercentOverride: null,
        sdlcPhase: null,
      },
      {
        id: 'b',
        category: 'C',
        baseAmount: '100',
        quantity: 1,
        billingPeriod: 'MONTHLY',
        upchargePercentOverride: null,
        sdlcPhase: null,
      },
      {
        id: 'c',
        category: 'C',
        baseAmount: '1200',
        quantity: 1,
        billingPeriod: 'YEARLY',
        upchargePercentOverride: null,
        sdlcPhase: null,
      },
    ];
    for (let i = 0; i < 500; i++) {
      const r = computeEstimate(input(mixed));
      expect(r.grandTotal).toBe('2500.0000'); // 100 + 1200 + 1200
    }
  });
});

describe('Volume · capacity sweep at scale (FR-27)', () => {
  it('VOL-09 500 non-overlapping single-day assignments for distinct resources → no violations', () => {
    const lines = Array.from({ length: 500 }, (_, i) => ({
      resourceName: `R${i}`,
      allocationPercent: 100,
      startDate: '2026-07-01',
      endDate: '2026-07-01',
    }));
    const start = Date.now();
    const v = findCapacityViolations(lines);
    expect(Date.now() - start).toBeLessThan(500);
    expect(v).toEqual([]);
  });

  it('VOL-10 one over-allocated resource among 500 is detected', () => {
    const lines = Array.from({ length: 500 }, (_, i) => ({
      resourceName: `R${i}`,
      allocationPercent: 50,
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    }));
    // Push R0 over 100% with a second overlapping 60% assignment.
    lines.push({
      resourceName: 'R0',
      allocationPercent: 60,
      startDate: '2026-07-10',
      endDate: '2026-07-20',
    });
    const v = findCapacityViolations(lines);
    expect(v).toHaveLength(1);
    expect(v[0].resourceName).toBe('R0');
    expect(v[0].totalPercent).toBe(110);
  });
});
