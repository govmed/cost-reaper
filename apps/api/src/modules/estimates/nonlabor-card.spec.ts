/**
 * Non-labor card — QA (FR-6, FR-22, FR-23). 52 cases against `NonLaborLineInput`
 * (the Add-non-labor form contract) and the line-total math the service applies
 * (`lineTotal(amount, periods)`).
 */
import { describe, it, expect } from 'vitest';
import { NonLaborLineInput } from '@cost-reaper/types';
import { lineTotal } from '@cost-reaper/engine';

const base = (o: Record<string, unknown> = {}) => ({ category: 'Licenses', amount: '100', ...o });
const ok = (o: Record<string, unknown>) => NonLaborLineInput.safeParse(o).success;

describe('Non-labor card · contract — valid + defaults', () => {
  it('TC-01 minimal (category + amount) is valid', () => {
    expect(ok(base())).toBe(true);
  });
  it('TC-02 type defaults to FIXED', () => {
    expect(NonLaborLineInput.parse(base()).type).toBe('FIXED');
  });
  it('TC-03 billingPeriod defaults to ONE_TIME', () => {
    expect(NonLaborLineInput.parse(base()).billingPeriod).toBe('ONE_TIME');
  });
  it('TC-04 periods defaults to 1', () => {
    expect(NonLaborLineInput.parse(base()).periods).toBe(1);
  });
  it('TC-05 accepts type RECURRING', () => {
    expect(ok(base({ type: 'RECURRING' }))).toBe(true);
  });
  it('TC-06 accepts billingPeriod MONTHLY', () => {
    expect(ok(base({ billingPeriod: 'MONTHLY' }))).toBe(true);
  });
  it('TC-07 accepts billingPeriod YEARLY', () => {
    expect(ok(base({ billingPeriod: 'YEARLY' }))).toBe(true);
  });
  it('TC-08 accepts a description', () => {
    expect(ok(base({ description: 'Annual SaaS' }))).toBe(true);
  });
  it('TC-09 accepts a decimal amount', () => {
    expect(ok(base({ amount: '1234.56' }))).toBe(true);
  });
  it('TC-10 accepts amount 0', () => {
    expect(ok(base({ amount: '0' }))).toBe(true);
  });
  it('TC-11 accepts a multi-period count', () => {
    expect(ok(base({ periods: 12 }))).toBe(true);
  });
  it('TC-12 accepts a per-line upcharge override', () => {
    expect(ok(base({ upchargePercentOverride: 15 }))).toBe(true);
  });
  it('TC-13 accepts a null upcharge override', () => {
    expect(ok(base({ upchargePercentOverride: null }))).toBe(true);
  });
  it('TC-14 accepts an SDLC phase', () => {
    expect(ok(base({ sdlcPhase: 'DEPLOYMENT' }))).toBe(true);
  });
  it('TC-15 accepts a null SDLC phase', () => {
    expect(ok(base({ sdlcPhase: null }))).toBe(true);
  });
  it('TC-16 accepts a 120-char category', () => {
    expect(ok(base({ category: 'c'.repeat(120) }))).toBe(true);
  });
  it('TC-17 accepts a 500-char description', () => {
    expect(ok(base({ description: 'd'.repeat(500) }))).toBe(true);
  });
});

describe('Non-labor card · contract — rejected', () => {
  it('TC-18 rejects an empty category', () => {
    expect(ok(base({ category: '' }))).toBe(false);
  });
  it('TC-19 rejects a missing amount', () => {
    expect(NonLaborLineInput.safeParse({ category: 'X' }).success).toBe(false);
  });
  it('TC-20 rejects a non-decimal amount', () => {
    expect(ok(base({ amount: 'free' }))).toBe(false);
  });
  it('TC-21 rejects a numeric (non-string) amount', () => {
    expect(ok(base({ amount: 100 }))).toBe(false);
  });
  it('TC-22 rejects an unknown type', () => {
    expect(ok(base({ type: 'SUBSCRIPTION' }))).toBe(false);
  });
  it('TC-23 rejects an unknown billingPeriod', () => {
    expect(ok(base({ billingPeriod: 'DAILY' }))).toBe(false);
  });
  it('TC-24 rejects periods below 1', () => {
    expect(ok(base({ periods: 0 }))).toBe(false);
  });
  it('TC-25 rejects a fractional period count', () => {
    expect(ok(base({ periods: 1.5 }))).toBe(false);
  });
  it('TC-26 rejects a negative period count', () => {
    expect(ok(base({ periods: -3 }))).toBe(false);
  });
  it('TC-27 rejects an upcharge override above 100', () => {
    expect(ok(base({ upchargePercentOverride: 150 }))).toBe(false);
  });
  it('TC-28 rejects a category over 120 chars', () => {
    expect(ok(base({ category: 'c'.repeat(121) }))).toBe(false);
  });
  it('TC-29 rejects a description over 500 chars', () => {
    expect(ok(base({ description: 'd'.repeat(501) }))).toBe(false);
  });
  it('TC-30 rejects an SDLC phase over 80 chars', () => {
    expect(ok(base({ sdlcPhase: 'P'.repeat(81) }))).toBe(false);
  });
});

describe('Non-labor card · line total = amount × periods', () => {
  it('TC-31 single period', () => {
    expect(lineTotal('100', 1)).toBe('100.0000');
  });
  it('TC-32 twelve periods', () => {
    expect(lineTotal('100', 12)).toBe('1200.0000');
  });
  it('TC-33 decimal amount × periods', () => {
    expect(lineTotal('99.99', 3)).toBe('299.9700');
  });
  it('TC-34 zero amount', () => {
    expect(lineTotal('0', 12)).toBe('0.0000');
  });
  it('TC-35 large period count', () => {
    expect(lineTotal('25', 36)).toBe('900.0000');
  });
  it('TC-36 fractional amount keeps exact decimals', () => {
    expect(lineTotal('19.95', 24)).toBe('478.8000');
  });
  it('TC-37 single big amount', () => {
    expect(lineTotal('50000', 1)).toBe('50000.0000');
  });
  it('TC-38 rounds half-up at 4 dp', () => {
    expect(lineTotal('0.00005', 1)).toBe('0.0001');
  });
});

describe('Non-labor card · billing-period intent (documents recurring roll-up)', () => {
  // These document how a non-labor line's billing period feeds the engine roll-up
  // (one-time vs monthly ×12 vs yearly ÷12) — exercised fully in engine-totals.
  it('TC-39 a FIXED one-time license is a single charge', () => {
    expect(ok(base({ type: 'FIXED', billingPeriod: 'ONE_TIME' }))).toBe(true);
  });
  it('TC-40 a RECURRING monthly subscription is valid', () => {
    expect(ok(base({ type: 'RECURRING', billingPeriod: 'MONTHLY' }))).toBe(true);
  });
  it('TC-41 a RECURRING yearly subscription is valid', () => {
    expect(ok(base({ type: 'RECURRING', billingPeriod: 'YEARLY' }))).toBe(true);
  });
  it('TC-42 amount × periods for a 3-year prepay', () => {
    expect(lineTotal('1000', 3)).toBe('3000.0000');
  });
  it('TC-43 a monthly amount across 6 periods', () => {
    expect(lineTotal('250', 6)).toBe('1500.0000');
  });
  it('TC-44 a high-precision unit amount', () => {
    expect(lineTotal('0.3333', 3)).toBe('0.9999');
  });
});

describe('Non-labor card · boundary values', () => {
  it('TC-45 upcharge override exactly 100 is valid', () => {
    expect(ok(base({ upchargePercentOverride: 100 }))).toBe(true);
  });
  it('TC-46 upcharge override exactly 0 is valid', () => {
    expect(ok(base({ upchargePercentOverride: 0 }))).toBe(true);
  });
  it('TC-47 periods exactly 1 is valid', () => {
    expect(ok(base({ periods: 1 }))).toBe(true);
  });
  it('TC-48 a 1-char category is valid', () => {
    expect(ok(base({ category: 'X' }))).toBe(true);
  });
  it('TC-49 negative amount string is allowed by Money format (credit)', () => {
    expect(ok(base({ amount: '-50' }))).toBe(true);
  });
  it('TC-50 amount with many decimals is allowed', () => {
    expect(ok(base({ amount: '12.123456' }))).toBe(true);
  });
  it('TC-51 RECURRING + ONE_TIME is accepted by the contract (engine handles roll-up)', () => {
    expect(ok(base({ type: 'RECURRING', billingPeriod: 'ONE_TIME' }))).toBe(true);
  });
  it('TC-52 FIXED + MONTHLY is accepted by the contract', () => {
    expect(ok(base({ type: 'FIXED', billingPeriod: 'MONTHLY' }))).toBe(true);
  });
});
