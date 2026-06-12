import { describe, it, expect } from 'vitest';
import { computeEstimate } from '@cost-reaper/engine';
import { buildEngineInput } from './engine-mapping';

describe('buildEngineInput + computeEstimate', () => {
  it('maps labor (one-time) + cloud (monthly) with a global upcharge', () => {
    const input = buildEngineInput({
      globalUpchargePercent: 10,
      contingencyPercent: 0,
      labor: [
        { id: 'l1', roleName: 'Engineer', rateSnapshot: '100', quantity: 2, units: 10, billingPeriod: 'ONE_TIME', upchargePercentOverride: null },
      ],
      nonLabor: [],
      cloud: [
        { id: 'c1', provider: 'AWS', unitPriceSnapshot: '0.10', quantity: 1, usageHoursPerMonth: 730, billingPeriod: 'MONTHLY', upchargePercentOverride: null },
      ],
    });
    const r = computeEstimate(input);
    // labor: 100 × (2×10) = 2000 → +10% = 2200 (one-time)
    // cloud: 0.10 × (1×730) = 73 → +10% = 80.30 (monthly)
    expect(r.oneTimeSubtotal).toBe('2200.0000');
    expect(r.monthlySubtotal).toBe('80.3000');
    expect(r.yearlySubtotal).toBe('963.6000');
    expect(r.grandTotal).toBe('3163.6000'); // one-time 2200 + annualized 963.60
  });

  it('respects a per-line upcharge override', () => {
    const r = computeEstimate(
      buildEngineInput({
        globalUpchargePercent: 10,
        contingencyPercent: 0,
        labor: [
          { id: 'l1', roleName: null, rateSnapshot: '1000', quantity: 1, units: 1, billingPeriod: 'ONE_TIME', upchargePercentOverride: 25 },
        ],
        nonLabor: [],
        cloud: [],
      }),
    );
    expect(r.grandTotal).toBe('1250.0000');
  });
});
