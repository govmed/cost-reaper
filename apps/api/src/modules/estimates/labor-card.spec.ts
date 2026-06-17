/**
 * Labor Card — focused QA suite (FR-5, FR-13, FR-22, FR-23, FR-27).
 *
 * 50+ test cases covering everything the Labor card on the estimate editor does
 * when you add/maintain a labor line, exercised against the real contracts:
 *   • `LaborLineInput` (the Zod contract the "Add labor" form posts) — required
 *     fields, defaults, bounds, date pairing/order, and three-point (PERT) rules.
 *   • `pert()` — the effective-units expected value (FR-13).
 *   • `lineTotal()` — rate × (qty × units) exact decimal math (FR-5, NFR-5).
 *   • `findCapacityViolations()` — the per-resource ≤100%/day guard (FR-27).
 *   • A few end-to-end "what the addLabor service computes" checks tying them
 *     together (PERT → effective units → line total).
 *
 * Pure (no DB / HTTP) so it runs in the standard vitest gate.
 */
import { describe, it, expect } from 'vitest';
import { LaborLineInput } from '@cost-reaper/types';
import { pert, lineTotal, findCapacityViolations } from '@cost-reaper/engine';
import type { AllocationLine } from '@cost-reaper/engine';

const UUID = '550e8400-e29b-41d4-a716-446655440000';
/** A minimal valid labor input; spread overrides on top. */
const base = (over: Record<string, unknown> = {}) => ({ units: 5, ...over });
const ok = (input: Record<string, unknown>) => LaborLineInput.safeParse(input).success;

// ─────────────────────────────────────────────────────────────────────────────
// 1. LaborLineInput contract — accepted inputs (defaults & valid shapes)
// ─────────────────────────────────────────────────────────────────────────────
describe('Labor card · input contract — valid', () => {
  it('TC-01 accepts the minimal line (just units) and applies defaults', () => {
    const r = LaborLineInput.parse({ units: 5 });
    expect(r.quantity).toBe(1);
    expect(r.billingPeriod).toBe('ONE_TIME');
    expect(r.allocationPercent).toBe(100);
  });

  it('TC-02 accepts units = 0 (the engine yields a 0 line total)', () => {
    expect(ok(base({ units: 0 }))).toBe(true);
  });

  it('TC-03 accepts quantity = 0 at the contract level (web now blocks it)', () => {
    expect(ok(base({ quantity: 0 }))).toBe(true);
  });

  it('TC-04 accepts a fractional quantity', () => {
    expect(ok(base({ quantity: 2.5 }))).toBe(true);
  });

  it('TC-05 accepts a fractional units value', () => {
    expect(ok(base({ units: 13.1666667 }))).toBe(true);
  });

  it('TC-06 accepts a valid rateCardRoleId (uuid)', () => {
    expect(ok(base({ rateCardRoleId: UUID }))).toBe(true);
  });

  it('TC-07 accepts an explicit rateSnapshot decimal string', () => {
    expect(ok(base({ rateSnapshot: '125.5000' }))).toBe(true);
  });

  it('TC-08 accepts billingPeriod MONTHLY', () => {
    expect(ok(base({ billingPeriod: 'MONTHLY' }))).toBe(true);
  });

  it('TC-09 accepts billingPeriod YEARLY', () => {
    expect(ok(base({ billingPeriod: 'YEARLY' }))).toBe(true);
  });

  it('TC-10 defaults billingPeriod to ONE_TIME when omitted', () => {
    expect(LaborLineInput.parse({ units: 5 }).billingPeriod).toBe('ONE_TIME');
  });

  it('TC-11 accepts allocationPercent at the lower bound (0)', () => {
    expect(ok(base({ allocationPercent: 0 }))).toBe(true);
  });

  it('TC-12 accepts a split allocationPercent (50)', () => {
    expect(ok(base({ allocationPercent: 50 }))).toBe(true);
  });

  it('TC-13 accepts allocationPercent at the upper bound (100)', () => {
    expect(ok(base({ allocationPercent: 100 }))).toBe(true);
  });

  it('TC-14 accepts a null upcharge override (use the global)', () => {
    expect(ok(base({ upchargePercentOverride: null }))).toBe(true);
  });

  it('TC-15 accepts a fractional upcharge override', () => {
    expect(ok(base({ upchargePercentOverride: 12.5 }))).toBe(true);
  });

  it('TC-16 accepts a start+end window with end after start', () => {
    expect(
      ok(base({ resourceName: 'Alice', startDate: '2026-07-01', endDate: '2026-07-31' })),
    ).toBe(true);
  });

  it('TC-17 accepts a single-day window (start === end)', () => {
    expect(ok(base({ startDate: '2026-07-01', endDate: '2026-07-01' }))).toBe(true);
  });

  it('TC-18 accepts a valid ascending three-point (PERT) estimate', () => {
    expect(ok(base({ unitsOptimistic: 8, unitsMostLikely: 10, unitsPessimistic: 18 }))).toBe(true);
  });

  it('TC-19 accepts an equal three-point estimate (o = m = p)', () => {
    expect(ok(base({ unitsOptimistic: 5, unitsMostLikely: 5, unitsPessimistic: 5 }))).toBe(true);
  });

  it('TC-20 accepts an SDLC phase code', () => {
    expect(ok(base({ sdlcPhase: 'DEVELOPMENT' }))).toBe(true);
  });

  it('TC-21 accepts a null SDLC phase', () => {
    expect(ok(base({ sdlcPhase: null }))).toBe(true);
  });

  it('TC-22 accepts a resourceName at the 200-char limit', () => {
    expect(ok(base({ resourceName: 'a'.repeat(200) }))).toBe(true);
  });

  it('TC-23 accepts a description at the 500-char limit', () => {
    expect(ok(base({ description: 'x'.repeat(500) }))).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. LaborLineInput contract — rejected inputs
// ─────────────────────────────────────────────────────────────────────────────
describe('Labor card · input contract — rejected', () => {
  it('TC-24 rejects a line with no units', () => {
    expect(ok({ rateCardRoleId: UUID })).toBe(false);
  });

  it('TC-25 rejects negative units', () => {
    expect(ok(base({ units: -5 }))).toBe(false);
  });

  it('TC-26 rejects negative quantity', () => {
    expect(ok(base({ quantity: -2 }))).toBe(false);
  });

  it('TC-27 rejects a rateCardRoleId that is not a uuid', () => {
    expect(ok(base({ rateCardRoleId: 'not-a-uuid' }))).toBe(false);
  });

  it('TC-28 rejects an unknown billingPeriod', () => {
    expect(ok(base({ billingPeriod: 'WEEKLY' }))).toBe(false);
  });

  it('TC-29 rejects allocationPercent above 100', () => {
    expect(ok(base({ allocationPercent: 150 }))).toBe(false);
  });

  it('TC-30 rejects a negative allocationPercent', () => {
    expect(ok(base({ allocationPercent: -1 }))).toBe(false);
  });

  it('TC-31 rejects an upcharge override above 100', () => {
    expect(ok(base({ upchargePercentOverride: 200 }))).toBe(false);
  });

  it('TC-32 rejects a start date with no end date', () => {
    expect(ok(base({ startDate: '2026-07-01' }))).toBe(false);
  });

  it('TC-33 rejects an end date with no start date', () => {
    expect(ok(base({ endDate: '2026-07-31' }))).toBe(false);
  });

  it('TC-34 rejects an end date before the start date', () => {
    expect(ok(base({ startDate: '2026-07-31', endDate: '2026-07-01' }))).toBe(false);
  });

  it('TC-35 rejects a non-ISO date format', () => {
    expect(ok(base({ startDate: '2026/07/01', endDate: '2026/07/31' }))).toBe(false);
  });

  it('TC-36 rejects a partial three-point estimate (only optimistic)', () => {
    expect(ok(base({ unitsOptimistic: 8 }))).toBe(false);
  });

  it('TC-37 rejects a partial three-point estimate (missing pessimistic)', () => {
    expect(ok(base({ unitsOptimistic: 8, unitsMostLikely: 10 }))).toBe(false);
  });

  it('TC-38 rejects a three-point estimate that is not ordered (o > m > p)', () => {
    expect(ok(base({ unitsOptimistic: 18, unitsMostLikely: 10, unitsPessimistic: 8 }))).toBe(false);
  });

  it('TC-39 rejects a three-point estimate with most-likely above pessimistic', () => {
    expect(ok(base({ unitsOptimistic: 5, unitsMostLikely: 20, unitsPessimistic: 10 }))).toBe(false);
  });

  it('TC-40 rejects an SDLC phase longer than 80 chars', () => {
    expect(ok(base({ sdlcPhase: 'P'.repeat(81) }))).toBe(false);
  });

  it('TC-41 rejects a resourceName longer than 200 chars', () => {
    expect(ok(base({ resourceName: 'a'.repeat(201) }))).toBe(false);
  });

  it('TC-42 rejects a description longer than 500 chars', () => {
    expect(ok(base({ description: 'x'.repeat(501) }))).toBe(false);
  });

  it('TC-43 KNOWN LIMITATION: a calendar-invalid but well-formatted date is accepted (regex-only)', () => {
    // The contract validates the YYYY-MM-DD shape, not real calendar validity —
    // documents the gap so a future tightening has a guard.
    expect(ok(base({ startDate: '2026-13-40', endDate: '2026-13-40' }))).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. PERT — effective units (FR-13)
// ─────────────────────────────────────────────────────────────────────────────
describe('Labor card · PERT effective units', () => {
  it('TC-44 (o + 4m + p) / 6 for 8/10/18 = 11', () => {
    expect(pert(8, 10, 18)).toBe(11);
  });

  it('TC-45 all-zero three-point yields 0', () => {
    expect(pert(0, 0, 0)).toBe(0);
  });

  it('TC-46 equal three-point yields that value', () => {
    expect(pert(5, 5, 5)).toBe(5);
  });

  it('TC-47 wide spread 10/20/60 = 25', () => {
    expect(pert(10, 20, 60)).toBe(25);
  });

  it('TC-48 produces a fractional expected value (2/4/9 = 4.5)', () => {
    expect(pert(2, 4, 9)).toBe(4.5);
  });

  it('TC-49 produces a repeating fraction (1/2/4 ≈ 2.1667)', () => {
    expect(pert(1, 2, 4)).toBeCloseTo(2.16667, 4);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. lineTotal — rate × (qty × units), exact decimals (FR-5, NFR-5)
// ─────────────────────────────────────────────────────────────────────────────
describe('Labor card · line total math', () => {
  it('TC-50 rate × quantity → 4 decimals', () => {
    expect(lineTotal('100', 2)).toBe('200.0000');
  });

  it('TC-51 mirrors the service: rate × (qty × units) for 2 × 160 @ $100', () => {
    expect(lineTotal('100', 2 * 160)).toBe('32000.0000');
  });

  it('TC-52 fractional rate', () => {
    expect(lineTotal('150.5', 3)).toBe('451.5000');
  });

  it('TC-53 zero quantity → zero', () => {
    expect(lineTotal('100', 0)).toBe('0.0000');
  });

  it('TC-54 zero rate → zero', () => {
    expect(lineTotal('0', 5)).toBe('0.0000');
  });

  it('TC-55 keeps exact decimals (33.333 × 3 = 99.9990)', () => {
    expect(lineTotal('33.333', 3)).toBe('99.9990');
  });

  it('TC-56 rounds half-up at the 4th decimal', () => {
    expect(lineTotal('1.23455', 1)).toBe('1.2346');
  });

  it('TC-57 honors a custom scale', () => {
    expect(lineTotal('200', 1, 2)).toBe('200.00');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. End-to-end: PERT → effective units → line total (the addLabor computation)
// ─────────────────────────────────────────────────────────────────────────────
describe('Labor card · PERT drives the line total', () => {
  it('TC-58 8/10/18 over qty 2 @ $100 → 2 × 11 × 100 = 2200', () => {
    const units = pert(8, 10, 18);
    expect(lineTotal('100', 2 * units)).toBe('2200.0000');
  });

  it('TC-59 equal three-point 6/6/6 over qty 4 @ $100 → 2400', () => {
    const units = pert(6, 6, 6);
    expect(lineTotal('100', 4 * units)).toBe('2400.0000');
  });

  it('TC-60 fractional PERT 2/4/9 (=4.5) over qty 1 @ $90 → 405', () => {
    const units = pert(2, 4, 9);
    expect(lineTotal('90', 1 * units)).toBe('405.0000');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Resource capacity guard — ≤100%/day per resource (FR-27)
// ─────────────────────────────────────────────────────────────────────────────
describe('Labor card · resource capacity (FR-27)', () => {
  const L = (over: Partial<AllocationLine>): AllocationLine => ({
    resourceName: 'Alice',
    allocationPercent: 100,
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    ...over,
  });

  it('TC-61 no lines → no violations', () => {
    expect(findCapacityViolations([])).toEqual([]);
  });

  it('TC-62 a single 100% line is fine', () => {
    expect(findCapacityViolations([L({})])).toEqual([]);
  });

  it('TC-63 a line with no resource name is ignored', () => {
    expect(findCapacityViolations([L({ resourceName: null, allocationPercent: 200 })])).toEqual([]);
  });

  it('TC-64 a resource line with no dates is ignored (unschedulable)', () => {
    expect(
      findCapacityViolations([L({ startDate: null, endDate: null, allocationPercent: 200 })]),
    ).toEqual([]);
  });

  it('TC-65 a line with a start but no end is ignored', () => {
    expect(findCapacityViolations([L({ endDate: null, allocationPercent: 200 })])).toEqual([]);
  });

  it('TC-66 two non-overlapping windows for the same resource are fine', () => {
    expect(
      findCapacityViolations([
        L({ startDate: '2026-07-01', endDate: '2026-07-10' }),
        L({ startDate: '2026-07-11', endDate: '2026-07-20' }),
      ]),
    ).toEqual([]);
  });

  it('TC-67 overlapping 60% + 60% on the same resource over-allocates (120%)', () => {
    const v = findCapacityViolations([
      L({ allocationPercent: 60, startDate: '2026-07-01', endDate: '2026-07-31' }),
      L({ allocationPercent: 60, startDate: '2026-07-15', endDate: '2026-07-20' }),
    ]);
    expect(v).toHaveLength(1);
    expect(v[0].resourceName).toBe('Alice');
    expect(v[0].totalPercent).toBe(120);
  });

  it('TC-68 reports the earliest offending date', () => {
    const v = findCapacityViolations([
      L({ allocationPercent: 60, startDate: '2026-07-01', endDate: '2026-07-31' }),
      L({ allocationPercent: 60, startDate: '2026-07-15', endDate: '2026-07-20' }),
    ]);
    expect(v[0].date).toBe('2026-07-15');
  });

  it('TC-69 adjacent windows (end day, next start day) do NOT overlap', () => {
    expect(
      findCapacityViolations([
        L({ startDate: '2026-07-01', endDate: '2026-07-09' }),
        L({ startDate: '2026-07-10', endDate: '2026-07-20' }),
      ]),
    ).toEqual([]);
  });

  it('TC-70 same-day boundary (A ends 07-10, B starts 07-10) DOES overlap', () => {
    const v = findCapacityViolations([
      L({ allocationPercent: 60, startDate: '2026-07-01', endDate: '2026-07-10' }),
      L({ allocationPercent: 60, startDate: '2026-07-10', endDate: '2026-07-20' }),
    ]);
    expect(v).toHaveLength(1);
    expect(v[0].date).toBe('2026-07-10');
    expect(v[0].totalPercent).toBe(120);
  });

  it('TC-71 a clean 50% + 50% split to exactly 100% is fine', () => {
    expect(
      findCapacityViolations([L({ allocationPercent: 50 }), L({ allocationPercent: 50 })]),
    ).toEqual([]);
  });

  it('TC-72 50% + 60% to 110% over-allocates', () => {
    const v = findCapacityViolations([L({ allocationPercent: 50 }), L({ allocationPercent: 60 })]);
    expect(v).toHaveLength(1);
    expect(v[0].totalPercent).toBe(110);
  });

  it('TC-73 exactly 100% is NOT a violation (strict greater-than)', () => {
    expect(findCapacityViolations([L({ allocationPercent: 100 })])).toEqual([]);
  });

  it('TC-74 three overlapping 40% lines reach 120%', () => {
    const v = findCapacityViolations([
      L({ allocationPercent: 40 }),
      L({ allocationPercent: 40 }),
      L({ allocationPercent: 40 }),
    ]);
    expect(v).toHaveLength(1);
    expect(v[0].totalPercent).toBe(120);
  });

  it('TC-75 different resources do not pool capacity', () => {
    expect(
      findCapacityViolations([
        L({ resourceName: 'Alice', allocationPercent: 100 }),
        L({ resourceName: 'Bob', allocationPercent: 100 }),
      ]),
    ).toEqual([]);
  });

  it('TC-76 a malformed window (end before start) is skipped', () => {
    expect(findCapacityViolations([L({ startDate: '2026-07-31', endDate: '2026-07-01' })])).toEqual(
      [],
    );
  });

  it('TC-77 resource names are trimmed so " Alice " and "Alice" pool together', () => {
    const v = findCapacityViolations([
      L({ resourceName: ' Alice ', allocationPercent: 60 }),
      L({ resourceName: 'Alice', allocationPercent: 60 }),
    ]);
    expect(v).toHaveLength(1);
    expect(v[0].resourceName).toBe('Alice');
  });

  it('TC-78 reports one violation per over-allocated resource', () => {
    const v = findCapacityViolations([
      L({ resourceName: 'Alice', allocationPercent: 60 }),
      L({ resourceName: 'Alice', allocationPercent: 60 }),
      L({ resourceName: 'Bob', allocationPercent: 70 }),
      L({ resourceName: 'Bob', allocationPercent: 70 }),
    ]);
    expect(v).toHaveLength(2);
    expect(v.map((x) => x.resourceName).sort()).toEqual(['Alice', 'Bob']);
  });
});
