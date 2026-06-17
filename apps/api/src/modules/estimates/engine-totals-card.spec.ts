/**
 * Totals / Cost-by-category / Cost-by-SDLC-phase cards — engine QA (FR-7, FR-22, FR-23, FR-28).
 * 56 cases against the real `computeEstimate` (the single source of truth for estimate math).
 */
import { describe, it, expect } from 'vitest';
import { computeEstimate } from '@cost-reaper/engine';
import type { EngineInput, EngineLine, EngineResult } from '@cost-reaper/types';

const line = (o: Partial<EngineLine> & { baseAmount: string }): EngineLine => ({
  id: 'L',
  category: 'Labor',
  quantity: 1,
  billingPeriod: 'ONE_TIME',
  upchargePercentOverride: null,
  sdlcPhase: null,
  ...o,
});
const run = (lines: EngineLine[], extra: Partial<EngineInput> = {}): EngineResult =>
  computeEstimate({
    globalUpchargePercent: 0,
    contingencyPercent: 0,
    marginPercent: 0,
    taxPercent: 0,
    moneyScale: 4,
    lines,
    ...extra,
  });

describe('Totals card · base roll-ups', () => {
  it('TC-01 empty estimate → all zeros', () => {
    const r = run([]);
    expect(r.grandTotal).toBe('0.0000');
    expect(r.oneTimeSubtotal).toBe('0.0000');
    expect(r.categories).toEqual([]);
    expect(r.phases).toEqual([]);
  });
  it('TC-02 single one-time line → one-time subtotal', () => {
    expect(run([line({ baseAmount: '100' })]).oneTimeSubtotal).toBe('100.0000');
  });
  it('TC-03 quantity multiplies the base', () => {
    expect(run([line({ baseAmount: '100', quantity: 3 })]).oneTimeSubtotal).toBe('300.0000');
  });
  it('TC-04 one-time grand total equals its subtotal with no contingency', () => {
    expect(run([line({ baseAmount: '250' })]).grandTotal).toBe('250.0000');
  });
  it('TC-05 one-time does not contribute to monthly/yearly subtotals', () => {
    const r = run([line({ baseAmount: '100' })]);
    expect(r.monthlySubtotal).toBe('0.0000');
    expect(r.yearlySubtotal).toBe('0.0000');
  });
  it('TC-06 monthly line → monthly subtotal + ×12 yearly', () => {
    const r = run([line({ baseAmount: '100', billingPeriod: 'MONTHLY' })]);
    expect(r.monthlySubtotal).toBe('100.0000');
    expect(r.yearlySubtotal).toBe('1200.0000');
  });
  it('TC-07 monthly line grand total is the annualized (×12) figure', () => {
    expect(run([line({ baseAmount: '100', billingPeriod: 'MONTHLY' })]).grandTotal).toBe(
      '1200.0000',
    );
  });
  it('TC-08 yearly line → yearly subtotal + ÷12 monthly', () => {
    const r = run([line({ baseAmount: '1200', billingPeriod: 'YEARLY' })]);
    expect(r.yearlySubtotal).toBe('1200.0000');
    expect(r.monthlySubtotal).toBe('100.0000');
  });
  it('TC-09 yearly line grand total equals its amount', () => {
    expect(run([line({ baseAmount: '1200', billingPeriod: 'YEARLY' })]).grandTotal).toBe(
      '1200.0000',
    );
  });
  it('TC-10 mixed one-time + monthly + yearly grand total', () => {
    // one-time 100 + (monthly 100 → 1200/yr) + (yearly 1200) = 100 + 1200 + 1200 = 2500
    const r = run([
      line({ baseAmount: '100' }),
      line({ baseAmount: '100', billingPeriod: 'MONTHLY' }),
      line({ baseAmount: '1200', billingPeriod: 'YEARLY' }),
    ]);
    expect(r.grandTotal).toBe('2500.0000');
  });
  it('TC-11 zero base line contributes nothing', () => {
    expect(run([line({ baseAmount: '0' })]).grandTotal).toBe('0.0000');
  });
  it('TC-12 multiple one-time lines aggregate', () => {
    expect(run([line({ baseAmount: '100' }), line({ baseAmount: '50' })]).oneTimeSubtotal).toBe(
      '150.0000',
    );
  });
});

describe('Totals card · upcharge (FR-22)', () => {
  it('TC-13 global upcharge marks up the line', () => {
    expect(run([line({ baseAmount: '100' })], { globalUpchargePercent: 10 }).oneTimeSubtotal).toBe(
      '110.0000',
    );
  });
  it('TC-14 upchargeAmount reports the added markup', () => {
    expect(run([line({ baseAmount: '100' })], { globalUpchargePercent: 10 }).upchargeAmount).toBe(
      '10.0000',
    );
  });
  it('TC-15 per-line override beats the global', () => {
    const r = run([line({ baseAmount: '100', upchargePercentOverride: 50 })], {
      globalUpchargePercent: 10,
    });
    expect(r.oneTimeSubtotal).toBe('150.0000');
  });
  it('TC-16 a per-line override of 0 disables upcharge for that line', () => {
    const r = run([line({ baseAmount: '100', upchargePercentOverride: 0 })], {
      globalUpchargePercent: 10,
    });
    expect(r.oneTimeSubtotal).toBe('100.0000');
    expect(r.upchargeAmount).toBe('0.0000');
  });
  it('TC-17 a null override falls back to the global', () => {
    const r = run([line({ baseAmount: '100', upchargePercentOverride: null })], {
      globalUpchargePercent: 25,
    });
    expect(r.oneTimeSubtotal).toBe('125.0000');
  });
  it('TC-18 global upcharge 0 → no markup', () => {
    expect(run([line({ baseAmount: '100' })]).upchargeAmount).toBe('0.0000');
  });
  it('TC-19 100% upcharge doubles the line', () => {
    expect(run([line({ baseAmount: '100' })], { globalUpchargePercent: 100 }).oneTimeSubtotal).toBe(
      '200.0000',
    );
  });
  it('TC-20 upcharge total sums across lines', () => {
    const r = run([line({ baseAmount: '100' }), line({ baseAmount: '300' })], {
      globalUpchargePercent: 10,
    });
    expect(r.upchargeAmount).toBe('40.0000');
  });
  it('TC-21 upcharge applies before the recurring annualization', () => {
    const r = run([line({ baseAmount: '100', billingPeriod: 'MONTHLY' })], {
      globalUpchargePercent: 10,
    });
    expect(r.yearlySubtotal).toBe('1320.0000'); // 110 × 12
  });
});

describe('Totals card · contingency (FR-7)', () => {
  it('TC-22 contingency applies on the upcharged subtotal', () => {
    expect(run([line({ baseAmount: '100' })], { contingencyPercent: 10 }).grandTotal).toBe(
      '110.0000',
    );
  });
  it('TC-23 contingencyAmount reported', () => {
    expect(run([line({ baseAmount: '100' })], { contingencyPercent: 10 }).contingencyAmount).toBe(
      '10.0000',
    );
  });
  it('TC-24 upcharge THEN contingency (order matters)', () => {
    // base 100 → +10% upcharge = 110 → +10% contingency = 121
    const r = run([line({ baseAmount: '100' })], {
      globalUpchargePercent: 10,
      contingencyPercent: 10,
    });
    expect(r.grandTotal).toBe('121.0000');
  });
  it('TC-25 contingency 0 → grand equals upcharged subtotal sum', () => {
    expect(run([line({ baseAmount: '100' })], { globalUpchargePercent: 20 }).grandTotal).toBe(
      '120.0000',
    );
  });
  it('TC-26 oneTimeTotal applies contingency to the one-time subtotal', () => {
    expect(run([line({ baseAmount: '200' })], { contingencyPercent: 50 }).oneTimeTotal).toBe(
      '300.0000',
    );
  });
  it('TC-27 yearlyTotal applies contingency to the yearly subtotal', () => {
    const r = run([line({ baseAmount: '100', billingPeriod: 'MONTHLY' })], {
      contingencyPercent: 10,
    });
    expect(r.yearlyTotal).toBe('1320.0000'); // 1200 × 1.1
  });
});

describe('Totals card · margin & tax (FR-16)', () => {
  it('TC-28 margin: sell = grand / (1 − margin)', () => {
    // grand 200, margin 20% → 200 / 0.8 = 250
    expect(run([line({ baseAmount: '200' })], { marginPercent: 20 }).sellPrice).toBe('250.0000');
  });
  it('TC-29 marginAmount = sell − grand', () => {
    expect(run([line({ baseAmount: '200' })], { marginPercent: 20 }).marginAmount).toBe('50.0000');
  });
  it('TC-30 margin 0 → sell equals grand', () => {
    expect(run([line({ baseAmount: '200' })]).sellPrice).toBe('200.0000');
  });
  it('TC-31 margin 100 is guarded (sell = grand, no divide-by-zero)', () => {
    expect(run([line({ baseAmount: '200' })], { marginPercent: 100 }).sellPrice).toBe('200.0000');
  });
  it('TC-32 tax applies on the sell price', () => {
    // grand 200, no margin, tax 10% → tax 20, client 220
    const r = run([line({ baseAmount: '200' })], { taxPercent: 10 });
    expect(r.taxAmount).toBe('20.0000');
    expect(r.clientPrice).toBe('220.0000');
  });
  it('TC-33 margin then tax compose', () => {
    // grand 200 → sell 250 (20% margin) → tax 10% = 25 → client 275
    const r = run([line({ baseAmount: '200' })], { marginPercent: 20, taxPercent: 10 });
    expect(r.sellPrice).toBe('250.0000');
    expect(r.taxAmount).toBe('25.0000');
    expect(r.clientPrice).toBe('275.0000');
  });
  it('TC-34 no margin/tax → clientPrice equals grand', () => {
    expect(run([line({ baseAmount: '200' })]).clientPrice).toBe('200.0000');
  });
});

describe('Cost-by-category card', () => {
  it('TC-35 one bucket per category', () => {
    const r = run([line({ baseAmount: '100', category: 'Labor' })]);
    expect(r.categories).toHaveLength(1);
    expect(r.categories[0].category).toBe('Labor');
    expect(r.categories[0].oneTime).toBe('100.0000');
  });
  it('TC-36 lines of the same category aggregate', () => {
    const r = run([
      line({ baseAmount: '100', category: 'Labor' }),
      line({ baseAmount: '50', category: 'Labor' }),
    ]);
    expect(r.categories).toHaveLength(1);
    expect(r.categories[0].oneTime).toBe('150.0000');
  });
  it('TC-37 categories are sorted alphabetically', () => {
    const r = run([
      line({ baseAmount: '1', category: 'Zeta' }),
      line({ baseAmount: '1', category: 'Alpha' }),
      line({ baseAmount: '1', category: 'Mu' }),
    ]);
    expect(r.categories.map((c) => c.category)).toEqual(['Alpha', 'Mu', 'Zeta']);
  });
  it('TC-38 category monthly bucket annualizes into its yearly column', () => {
    const r = run([line({ baseAmount: '100', category: 'Infra', billingPeriod: 'MONTHLY' })]);
    expect(r.categories[0].monthly).toBe('100.0000');
    expect(r.categories[0].yearly).toBe('1200.0000');
  });
  it('TC-39 category yearly bucket back-fills its monthly column (÷12)', () => {
    const r = run([line({ baseAmount: '1200', category: 'Infra', billingPeriod: 'YEARLY' })]);
    expect(r.categories[0].monthly).toBe('100.0000');
    expect(r.categories[0].yearly).toBe('1200.0000');
  });
  it('TC-40 category subtotal reflects per-line upcharge', () => {
    const r = run([line({ baseAmount: '100', category: 'Labor' })], { globalUpchargePercent: 10 });
    expect(r.categories[0].oneTime).toBe('110.0000');
  });
  it('TC-41 distinct categories produce distinct buckets', () => {
    const r = run([
      line({ baseAmount: '100', category: 'Labor' }),
      line({ baseAmount: '200', category: 'Infra' }),
    ]);
    expect(r.categories).toHaveLength(2);
  });
});

describe('Cost-by-SDLC-phase card (FR-28)', () => {
  it('TC-42 a null phase rolls up under "Unassigned"', () => {
    const r = run([line({ baseAmount: '100', sdlcPhase: null })]);
    expect(r.phases).toHaveLength(1);
    expect(r.phases[0].phase).toBe('Unassigned');
  });
  it('TC-43 a tagged phase appears by code', () => {
    const r = run([line({ baseAmount: '100', sdlcPhase: 'DEVELOPMENT' })]);
    expect(r.phases[0].phase).toBe('DEVELOPMENT');
  });
  it('TC-44 phases sort in lifecycle order', () => {
    const r = run([
      line({ baseAmount: '1', sdlcPhase: 'TESTING' }),
      line({ baseAmount: '1', sdlcPhase: 'PLANNING' }),
      line({ baseAmount: '1', sdlcPhase: 'DEVELOPMENT' }),
    ]);
    expect(r.phases.map((p) => p.phase)).toEqual(['PLANNING', 'DEVELOPMENT', 'TESTING']);
  });
  it('TC-45 "Unassigned" sorts after the canonical phases', () => {
    const r = run([
      line({ baseAmount: '1', sdlcPhase: null }),
      line({ baseAmount: '1', sdlcPhase: 'PLANNING' }),
    ]);
    expect(r.phases.map((p) => p.phase)).toEqual(['PLANNING', 'Unassigned']);
  });
  it('TC-46 lines of the same phase aggregate', () => {
    const r = run([
      line({ baseAmount: '100', sdlcPhase: 'DESIGN' }),
      line({ baseAmount: '40', sdlcPhase: 'DESIGN' }),
    ]);
    expect(r.phases[0].oneTime).toBe('140.0000');
  });
  it('TC-47 phase monthly/yearly columns annualize like categories', () => {
    const r = run([
      line({ baseAmount: '100', sdlcPhase: 'MAINTENANCE', billingPeriod: 'MONTHLY' }),
    ]);
    expect(r.phases[0].monthly).toBe('100.0000');
    expect(r.phases[0].yearly).toBe('1200.0000');
  });
  it('TC-48 an unknown (admin-added) phase sorts after the canonical ones but before Unassigned-only', () => {
    const r = run([
      line({ baseAmount: '1', sdlcPhase: 'PLANNING' }),
      line({ baseAmount: '1', sdlcPhase: 'CUSTOM_PHASE' }),
    ]);
    expect(r.phases.map((p) => p.phase)).toEqual(['PLANNING', 'CUSTOM_PHASE']);
  });
});

describe('Totals card · rounding & scale (NFR-5)', () => {
  it('TC-49 default money scale is 4 decimals', () => {
    expect(run([line({ baseAmount: '100' })]).grandTotal).toBe('100.0000');
  });
  it('TC-50 a custom money scale of 2 is honored', () => {
    expect(run([line({ baseAmount: '100' })], { moneyScale: 2 }).grandTotal).toBe('100.00');
  });
  it('TC-51 a money scale of 0 rounds to whole units', () => {
    expect(run([line({ baseAmount: '100' })], { moneyScale: 0 }).grandTotal).toBe('100');
  });
  it('TC-52 thirds round half-up at scale (100/3 monthly → yearly exact 1200)', () => {
    const r = run([line({ baseAmount: '33.3333', billingPeriod: 'MONTHLY' })]);
    expect(r.yearlySubtotal).toBe('399.9996'); // 33.3333 × 12
  });
  it('TC-53 exact decimal accumulation across many lines', () => {
    const lines = Array.from({ length: 3 }, () => line({ baseAmount: '0.3333' }));
    expect(run(lines).oneTimeSubtotal).toBe('0.9999');
  });
});

describe('Totals card · combined scenario', () => {
  it('TC-54 upcharge + contingency + margin + tax end-to-end', () => {
    // base 1000 → +10% = 1100 → +10% contingency = 1210 grand
    // sell = 1210 / 0.8 = 1512.5 ; tax 10% = 151.25 ; client = 1663.75
    const r = run([line({ baseAmount: '1000' })], {
      globalUpchargePercent: 10,
      contingencyPercent: 10,
      marginPercent: 20,
      taxPercent: 10,
    });
    expect(r.grandTotal).toBe('1210.0000');
    expect(r.sellPrice).toBe('1512.5000');
    expect(r.taxAmount).toBe('151.2500');
    expect(r.clientPrice).toBe('1663.7500');
  });
  it('TC-55 categories and phases both populate from one set of lines', () => {
    const r = run([
      line({ baseAmount: '100', category: 'Labor', sdlcPhase: 'DEVELOPMENT' }),
      line({ baseAmount: '200', category: 'Infra', sdlcPhase: 'DEPLOYMENT' }),
    ]);
    expect(r.categories).toHaveLength(2);
    expect(r.phases.map((p) => p.phase)).toEqual(['DEVELOPMENT', 'DEPLOYMENT']);
  });
  it('TC-56 grand total ties out to one-time + annualized recurring after contingency', () => {
    // one-time 500; monthly 100 (→1200/yr); contingency 10%
    // grand = (500 + 1200) × 1.1 = 1870
    const r = run(
      [line({ baseAmount: '500' }), line({ baseAmount: '100', billingPeriod: 'MONTHLY' })],
      { contingencyPercent: 10 },
    );
    expect(r.grandTotal).toBe('1870.0000');
  });
});
