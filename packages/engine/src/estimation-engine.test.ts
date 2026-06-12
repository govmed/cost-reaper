import { describe, it, expect } from 'vitest';
import type { EngineInput, EngineLine } from '@cost-reaper/types';
import { computeEstimate, effectiveUpcharge } from './estimation-engine';

function line(
  p: Partial<EngineLine> & Pick<EngineLine, 'baseAmount' | 'billingPeriod'>,
): EngineLine {
  return {
    id: p.id ?? 'L',
    category: p.category ?? 'General',
    baseAmount: p.baseAmount,
    quantity: p.quantity ?? 1,
    billingPeriod: p.billingPeriod,
    upchargePercentOverride: p.upchargePercentOverride ?? null,
    sdlcPhase: p.sdlcPhase ?? null,
  };
}

function input(p: Partial<EngineInput> & Pick<EngineInput, 'lines'>): EngineInput {
  return {
    globalUpchargePercent: p.globalUpchargePercent ?? 0,
    contingencyPercent: p.contingencyPercent ?? 0,
    lines: p.lines,
    moneyScale: p.moneyScale ?? 4,
  };
}

describe('computeEstimate', () => {
  it('returns zeros for an empty estimate', () => {
    const r = computeEstimate(input({ lines: [] }));
    expect(r.oneTimeSubtotal).toBe('0.0000');
    expect(r.monthlySubtotal).toBe('0.0000');
    expect(r.yearlySubtotal).toBe('0.0000');
    expect(r.grandTotal).toBe('0.0000');
    expect(r.upchargeAmount).toBe('0.0000');
    expect(r.contingencyAmount).toBe('0.0000');
    expect(r.categories).toEqual([]);
  });

  it('computes a single one-time line with no markup', () => {
    const r = computeEstimate(
      input({ lines: [line({ baseAmount: '1000', billingPeriod: 'ONE_TIME' })] }),
    );
    expect(r.oneTimeSubtotal).toBe('1000.0000');
    expect(r.upchargeAmount).toBe('0.0000');
    expect(r.grandTotal).toBe('1000.0000');
  });

  it('applies a global upcharge to the line base', () => {
    const r = computeEstimate(
      input({
        globalUpchargePercent: 10,
        lines: [line({ baseAmount: '1000', billingPeriod: 'ONE_TIME' })],
      }),
    );
    expect(r.upchargeAmount).toBe('100.0000');
    expect(r.oneTimeSubtotal).toBe('1100.0000');
    expect(r.grandTotal).toBe('1100.0000');
  });

  it('lets a per-line override win over the global upcharge (FR-22)', () => {
    const r = computeEstimate(
      input({
        globalUpchargePercent: 10,
        lines: [
          line({ baseAmount: '1000', billingPeriod: 'ONE_TIME', upchargePercentOverride: 20 }),
        ],
      }),
    );
    expect(r.upchargeAmount).toBe('200.0000');
    expect(r.grandTotal).toBe('1200.0000');
  });

  it('honors an explicit 0 override against a non-zero global (FR-22)', () => {
    const r = computeEstimate(
      input({
        globalUpchargePercent: 10,
        lines: [
          line({ baseAmount: '1000', billingPeriod: 'ONE_TIME', upchargePercentOverride: 0 }),
        ],
      }),
    );
    expect(r.upchargeAmount).toBe('0.0000');
    expect(r.grandTotal).toBe('1000.0000');
  });

  it('rolls a MONTHLY line up to monthly + yearly×12 (FR-23)', () => {
    const r = computeEstimate(
      input({ lines: [line({ baseAmount: '100', billingPeriod: 'MONTHLY' })] }),
    );
    expect(r.monthlySubtotal).toBe('100.0000');
    expect(r.yearlySubtotal).toBe('1200.0000');
    expect(r.monthlyTotal).toBe('100.0000');
    expect(r.yearlyTotal).toBe('1200.0000');
    expect(r.grandTotal).toBe('1200.0000');
  });

  it('rolls a YEARLY line up to yearly + monthly÷12 (FR-23)', () => {
    const r = computeEstimate(
      input({ lines: [line({ baseAmount: '1200', billingPeriod: 'YEARLY' })] }),
    );
    expect(r.monthlySubtotal).toBe('100.0000');
    expect(r.yearlySubtotal).toBe('1200.0000');
    expect(r.grandTotal).toBe('1200.0000');
  });

  it('applies contingency AFTER upcharge, on the upcharged subtotal (order matters)', () => {
    const r = computeEstimate(
      input({
        globalUpchargePercent: 10,
        contingencyPercent: 10,
        lines: [line({ baseAmount: '1000', billingPeriod: 'ONE_TIME' })],
      }),
    );
    // base 1000 → upcharged 1100 → contingency on 1100 → 1210
    expect(r.oneTimeSubtotal).toBe('1100.0000');
    expect(r.contingencyAmount).toBe('110.0000'); // 10% of 1100, NOT of 1000
    expect(r.grandTotal).toBe('1210.0000');
  });

  it('multiplies the base by quantity', () => {
    const r = computeEstimate(
      input({ lines: [line({ baseAmount: '50', quantity: 3, billingPeriod: 'ONE_TIME' })] }),
    );
    expect(r.oneTimeSubtotal).toBe('150.0000');
  });

  it('handles a mixed estimate with categories (sorted, no contingency)', () => {
    const r = computeEstimate(
      input({
        lines: [
          line({
            id: 'a',
            baseAmount: '500',
            quantity: 2,
            billingPeriod: 'ONE_TIME',
            category: 'Labor',
          }),
          line({ id: 'b', baseAmount: '200', billingPeriod: 'MONTHLY', category: 'Cloud' }),
          line({ id: 'c', baseAmount: '1200', billingPeriod: 'YEARLY', category: 'Licenses' }),
        ],
      }),
    );
    expect(r.oneTimeSubtotal).toBe('1000.0000');
    expect(r.monthlySubtotal).toBe('300.0000'); // 200 + 1200/12
    expect(r.yearlySubtotal).toBe('3600.0000'); // 200*12 + 1200
    expect(r.grandTotal).toBe('4600.0000'); // 1000 + 3600
    expect(r.categories.map((c) => c.category)).toEqual(['Cloud', 'Labor', 'Licenses']);
    expect(r.categories[0]).toEqual({
      category: 'Cloud',
      oneTime: '0.0000',
      monthly: '200.0000',
      yearly: '2400.0000',
    });
    expect(r.categories[1]).toEqual({
      category: 'Labor',
      oneTime: '1000.0000',
      monthly: '0.0000',
      yearly: '0.0000',
    });
  });

  it('groups cost per SDLC phase in lifecycle order, Unassigned last (FR-28)', () => {
    const r = computeEstimate(
      input({
        lines: [
          line({ id: 'a', baseAmount: '1000', billingPeriod: 'ONE_TIME', sdlcPhase: 'TESTING' }),
          line({ id: 'b', baseAmount: '2000', billingPeriod: 'ONE_TIME', sdlcPhase: 'PLANNING' }),
          line({ id: 'c', baseAmount: '500', billingPeriod: 'MONTHLY', sdlcPhase: 'DEVELOPMENT' }),
          line({ id: 'd', baseAmount: '300', billingPeriod: 'ONE_TIME' }), // no phase
        ],
      }),
    );
    expect(r.phases.map((p) => p.phase)).toEqual([
      'PLANNING',
      'DEVELOPMENT',
      'TESTING',
      'Unassigned',
    ]);
    expect(r.phases.find((p) => p.phase === 'PLANNING')).toEqual({
      phase: 'PLANNING',
      oneTime: '2000.0000',
      monthly: '0.0000',
      yearly: '0.0000',
    });
    expect(r.phases.find((p) => p.phase === 'DEVELOPMENT')).toEqual({
      phase: 'DEVELOPMENT',
      oneTime: '0.0000',
      monthly: '500.0000',
      yearly: '6000.0000',
    });
    expect(r.phases.find((p) => p.phase === 'Unassigned')?.oneTime).toBe('300.0000');
  });

  it('rounds money half-up to the configured scale', () => {
    const r = computeEstimate(
      input({ lines: [line({ baseAmount: '0.00005', billingPeriod: 'ONE_TIME' })] }),
    );
    expect(r.oneTimeSubtotal).toBe('0.0001');
  });

  it('respects a custom money scale', () => {
    const r = computeEstimate(
      input({ moneyScale: 2, lines: [line({ baseAmount: '33.333', billingPeriod: 'ONE_TIME' })] }),
    );
    expect(r.oneTimeSubtotal).toBe('33.33');
  });

  it('scales to a 200-line estimate without losing precision (NFR-1)', () => {
    const lines: EngineLine[] = Array.from({ length: 200 }, (_, i) =>
      line({ id: `l${i}`, baseAmount: '10', billingPeriod: 'MONTHLY', category: 'Cloud' }),
    );
    const r = computeEstimate(input({ lines }));
    expect(r.monthlySubtotal).toBe('2000.0000');
    expect(r.yearlySubtotal).toBe('24000.0000');
    expect(r.grandTotal).toBe('24000.0000');
  });
});

describe('effectiveUpcharge', () => {
  it('uses the global when no override is set', () => {
    expect(
      effectiveUpcharge(line({ baseAmount: '1', billingPeriod: 'ONE_TIME' }), 15).toString(),
    ).toBe('15');
  });

  it('uses the override when set, including 0', () => {
    expect(
      effectiveUpcharge(
        line({ baseAmount: '1', billingPeriod: 'ONE_TIME', upchargePercentOverride: 25 }),
        15,
      ).toString(),
    ).toBe('25');
    expect(
      effectiveUpcharge(
        line({ baseAmount: '1', billingPeriod: 'ONE_TIME', upchargePercentOverride: 0 }),
        15,
      ).toString(),
    ).toBe('0');
  });
});
