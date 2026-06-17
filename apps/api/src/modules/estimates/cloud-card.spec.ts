/**
 * Cloud compute card — QA (FR-21, FR-23, NFR-14). 52 cases against `CloudLineInput`
 * (the Add-cloud form contract) and the line-total math the service applies
 * (`lineTotal(unitPriceSnapshot, quantity × usageHoursPerMonth)`).
 */
import { describe, it, expect } from 'vitest';
import { CloudLineInput } from '@cost-reaper/types';
import { lineTotal } from '@cost-reaper/engine';

const UUID = '550e8400-e29b-41d4-a716-446655440000';
const base = (o: Record<string, unknown> = {}) => ({ cloudPriceId: UUID, ...o });
const ok = (o: Record<string, unknown>) => CloudLineInput.safeParse(o).success;

describe('Cloud card · contract — valid + defaults', () => {
  it('TC-01 minimal (cloudPriceId) is valid', () => {
    expect(ok(base())).toBe(true);
  });
  it('TC-02 quantity defaults to 1', () => {
    expect(CloudLineInput.parse(base()).quantity).toBe(1);
  });
  it('TC-03 usageHoursPerMonth defaults to 730', () => {
    expect(CloudLineInput.parse(base()).usageHoursPerMonth).toBe(730);
  });
  it('TC-04 billingPeriod defaults to MONTHLY (cloud is recurring)', () => {
    expect(CloudLineInput.parse(base()).billingPeriod).toBe('MONTHLY');
  });
  it('TC-05 accepts an explicit quantity', () => {
    expect(ok(base({ quantity: 3 }))).toBe(true);
  });
  it('TC-06 accepts custom usage hours', () => {
    expect(ok(base({ usageHoursPerMonth: 200 }))).toBe(true);
  });
  it('TC-07 accepts billingPeriod ONE_TIME (e.g. a reserved upfront)', () => {
    expect(ok(base({ billingPeriod: 'ONE_TIME' }))).toBe(true);
  });
  it('TC-08 accepts billingPeriod YEARLY', () => {
    expect(ok(base({ billingPeriod: 'YEARLY' }))).toBe(true);
  });
  it('TC-09 accepts a per-line upcharge override', () => {
    expect(ok(base({ upchargePercentOverride: 12 }))).toBe(true);
  });
  it('TC-10 accepts a null upcharge override', () => {
    expect(ok(base({ upchargePercentOverride: null }))).toBe(true);
  });
  it('TC-11 accepts an SDLC phase', () => {
    expect(ok(base({ sdlcPhase: 'DEPLOYMENT' }))).toBe(true);
  });
  it('TC-12 accepts a null SDLC phase', () => {
    expect(ok(base({ sdlcPhase: null }))).toBe(true);
  });
  it('TC-13 accepts quantity 0', () => {
    expect(ok(base({ quantity: 0 }))).toBe(true);
  });
  it('TC-14 accepts usage 0', () => {
    expect(ok(base({ usageHoursPerMonth: 0 }))).toBe(true);
  });
  it('TC-15 accepts a fractional usage value', () => {
    expect(ok(base({ usageHoursPerMonth: 12.5 }))).toBe(true);
  });
  it('TC-16 accepts a large quantity', () => {
    expect(ok(base({ quantity: 1000 }))).toBe(true);
  });
});

describe('Cloud card · contract — rejected', () => {
  it('TC-17 rejects a missing cloudPriceId', () => {
    expect(CloudLineInput.safeParse({ quantity: 1 }).success).toBe(false);
  });
  it('TC-18 rejects a non-uuid cloudPriceId', () => {
    expect(ok({ cloudPriceId: 'price-1' })).toBe(false);
  });
  it('TC-19 rejects a negative quantity', () => {
    expect(ok(base({ quantity: -1 }))).toBe(false);
  });
  it('TC-20 rejects negative usage hours', () => {
    expect(ok(base({ usageHoursPerMonth: -5 }))).toBe(false);
  });
  it('TC-21 rejects an unknown billingPeriod', () => {
    expect(ok(base({ billingPeriod: 'HOURLY' }))).toBe(false);
  });
  it('TC-22 rejects an upcharge override above 100', () => {
    expect(ok(base({ upchargePercentOverride: 150 }))).toBe(false);
  });
  it('TC-23 rejects a negative upcharge override', () => {
    expect(ok(base({ upchargePercentOverride: -1 }))).toBe(false);
  });
  it('TC-24 rejects a string quantity (no coercion)', () => {
    expect(ok(base({ quantity: '3' }))).toBe(false);
  });
  it('TC-25 rejects an SDLC phase over 80 chars', () => {
    expect(ok(base({ sdlcPhase: 'P'.repeat(81) }))).toBe(false);
  });
});

describe('Cloud card · line total = unitPrice × (qty × usage)', () => {
  it('TC-26 one instance, full month at $0.10/hr → 730 hrs = 73', () => {
    expect(lineTotal('0.10', 1 * 730)).toBe('73.0000');
  });
  it('TC-27 three instances, full month', () => {
    expect(lineTotal('0.10', 3 * 730)).toBe('219.0000');
  });
  it('TC-28 partial usage (200 hrs)', () => {
    expect(lineTotal('0.50', 1 * 200)).toBe('100.0000');
  });
  it('TC-29 high-precision unit price (6 dp)', () => {
    expect(lineTotal('0.012345', 1 * 730)).toBe('9.0119'); // 0.012345 × 730 = 9.01185 → 9.0119
  });
  it('TC-30 zero usage → zero', () => {
    expect(lineTotal('0.10', 1 * 0)).toBe('0.0000');
  });
  it('TC-31 zero quantity → zero', () => {
    expect(lineTotal('0.10', 0 * 730)).toBe('0.0000');
  });
  it('TC-32 storage priced per GB-month (qty=GB, usage=1)', () => {
    expect(lineTotal('0.023', 500 * 1)).toBe('11.5000');
  });
  it('TC-33 large fleet', () => {
    expect(lineTotal('0.10', 100 * 730)).toBe('7300.0000');
  });
  it('TC-34 fractional usage hours', () => {
    expect(lineTotal('1.00', 1 * 12.5)).toBe('12.5000');
  });
  it('TC-35 unit price with trailing precision rounds half-up', () => {
    expect(lineTotal('0.000050', 1)).toBe('0.0001');
  });
});

describe('Cloud card · snapshot immutability intent (NFR-14)', () => {
  // The unit price is snapshotted onto the line at add time; a later catalog
  // refresh must not change the saved line total. These assert the math is a
  // pure function of the snapshot, not of any live price.
  it('TC-36 total depends only on the snapshot passed in', () => {
    const snapshot = '0.20';
    expect(lineTotal(snapshot, 1 * 730)).toBe('146.0000');
  });
  it('TC-37 same inputs always yield the same total (deterministic)', () => {
    expect(lineTotal('0.20', 730)).toBe(lineTotal('0.20', 730));
  });
  it('TC-38 a different snapshot yields a different total', () => {
    expect(lineTotal('0.20', 730)).not.toBe(lineTotal('0.30', 730));
  });
});

describe('Cloud card · boundary values', () => {
  it('TC-39 upcharge override exactly 100', () => {
    expect(ok(base({ upchargePercentOverride: 100 }))).toBe(true);
  });
  it('TC-40 upcharge override exactly 0', () => {
    expect(ok(base({ upchargePercentOverride: 0 }))).toBe(true);
  });
  it('TC-41 quantity exactly 0 is allowed by the contract', () => {
    expect(ok(base({ quantity: 0 }))).toBe(true);
  });
  it('TC-42 default usage 730 reflects ~hours per month', () => {
    expect(CloudLineInput.parse(base()).usageHoursPerMonth).toBe(730);
  });
  it('TC-43 ONE_TIME cloud line (reserved upfront) is valid', () => {
    expect(ok(base({ billingPeriod: 'ONE_TIME' }))).toBe(true);
  });
  it('TC-44 a fractional quantity is allowed', () => {
    expect(ok(base({ quantity: 0.5 }))).toBe(true);
  });
  it('TC-45 a very small unit price computes', () => {
    expect(lineTotal('0.0001', 730)).toBe('0.0730');
  });
  it('TC-46 a reserved-instance upfront ($/qty, usage 1)', () => {
    expect(lineTotal('1500', 2 * 1)).toBe('3000.0000');
  });
  it('TC-47 730-hour month is the recurring default basis', () => {
    expect(lineTotal('0.05', 1 * 730)).toBe('36.5000');
  });
  it('TC-48 requests-priced service (qty=millions, usage=1)', () => {
    expect(lineTotal('0.0000004', 1_000_000 * 1)).toBe('0.4000');
  });
  it('TC-49 a GB-month at $0.09', () => {
    expect(lineTotal('0.09', 1000 * 1)).toBe('90.0000');
  });
  it('TC-50 a multi-instance partial-usage workload', () => {
    expect(lineTotal('0.40', 5 * 100)).toBe('200.0000');
  });
  it('TC-51 accepts usage at a high value', () => {
    expect(ok(base({ usageHoursPerMonth: 744 }))).toBe(true);
  });
  it('TC-52 accepts a combined custom quantity + usage + phase + override', () => {
    expect(
      ok(
        base({
          quantity: 4,
          usageHoursPerMonth: 500,
          sdlcPhase: 'MAINTENANCE',
          upchargePercentOverride: 5,
          billingPeriod: 'MONTHLY',
        }),
      ),
    ).toBe(true);
  });
});
