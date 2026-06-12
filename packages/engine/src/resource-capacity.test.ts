import { describe, it, expect } from 'vitest';
import { findCapacityViolations, type AllocationLine } from './resource-capacity';

const line = (p: Partial<AllocationLine>): AllocationLine => ({
  resourceName: p.resourceName ?? 'Ada',
  allocationPercent: p.allocationPercent ?? 100,
  startDate: p.startDate ?? null,
  endDate: p.endDate ?? null,
});

describe('findCapacityViolations (FR-27)', () => {
  it('returns nothing for unscheduled lines (no dates)', () => {
    expect(findCapacityViolations([line({ allocationPercent: 100 })])).toEqual([]);
  });

  it('allows a resource split to exactly 100% on overlapping dates', () => {
    const v = findCapacityViolations([
      line({ allocationPercent: 60, startDate: '2026-07-01', endDate: '2026-07-31' }),
      line({ allocationPercent: 40, startDate: '2026-07-01', endDate: '2026-07-31' }),
    ]);
    expect(v).toEqual([]);
  });

  it('flags the earliest day a resource exceeds 100%', () => {
    const v = findCapacityViolations([
      line({ allocationPercent: 70, startDate: '2026-07-01', endDate: '2026-07-31' }),
      line({ allocationPercent: 50, startDate: '2026-07-15', endDate: '2026-08-15' }),
    ]);
    expect(v).toHaveLength(1);
    expect(v[0]).toEqual({ resourceName: 'Ada', date: '2026-07-15', totalPercent: 120 });
  });

  it('treats adjacent (non-overlapping) windows as fine', () => {
    const v = findCapacityViolations([
      line({ allocationPercent: 100, startDate: '2026-07-01', endDate: '2026-07-15' }),
      line({ allocationPercent: 100, startDate: '2026-07-16', endDate: '2026-07-31' }),
    ]);
    expect(v).toEqual([]);
  });

  it('keeps resources independent', () => {
    const v = findCapacityViolations([
      line({
        resourceName: 'Ada',
        allocationPercent: 100,
        startDate: '2026-07-01',
        endDate: '2026-07-31',
      }),
      line({
        resourceName: 'Grace',
        allocationPercent: 100,
        startDate: '2026-07-01',
        endDate: '2026-07-31',
      }),
    ]);
    expect(v).toEqual([]);
  });

  it('reports one violation per over-allocated resource', () => {
    const v = findCapacityViolations([
      line({
        resourceName: 'Ada',
        allocationPercent: 80,
        startDate: '2026-07-01',
        endDate: '2026-07-31',
      }),
      line({
        resourceName: 'Ada',
        allocationPercent: 80,
        startDate: '2026-07-01',
        endDate: '2026-07-31',
      }),
      line({
        resourceName: 'Grace',
        allocationPercent: 60,
        startDate: '2026-07-01',
        endDate: '2026-07-31',
      }),
      line({
        resourceName: 'Grace',
        allocationPercent: 60,
        startDate: '2026-07-01',
        endDate: '2026-07-31',
      }),
    ]);
    expect(v.map((x) => x.resourceName).sort()).toEqual(['Ada', 'Grace']);
  });
});
