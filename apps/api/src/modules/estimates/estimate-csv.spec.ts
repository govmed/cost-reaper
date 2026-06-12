import { describe, it, expect } from 'vitest';
import { computeEstimate } from '@cost-reaper/engine';
import { buildEngineInput } from './engine-mapping';
import { toCsv } from './estimate-csv';

describe('toCsv', () => {
  it('includes a header, the line, and the grand total; escapes commas', () => {
    const totals = computeEstimate(
      buildEngineInput({
        globalUpchargePercent: 0,
        contingencyPercent: 0,
        labor: [],
        nonLabor: [
          {
            id: 'n1',
            category: 'Licenses',
            amount: '1000',
            periods: 1,
            billingPeriod: 'ONE_TIME',
            upchargePercentOverride: null,
          },
        ],
        cloud: [],
      }),
    );
    const csv = toCsv(
      { name: 'My, Estimate', currency: 'USD' },
      [
        {
          type: 'Non-labor',
          description: 'Tooling',
          quantity: '1',
          unit: 'period',
          rate: '1000',
          billingPeriod: 'ONE_TIME',
          lineTotal: '1000.0000',
        },
      ],
      totals,
    );

    expect(csv).toContain('"My, Estimate"'); // comma -> quoted
    expect(csv).toContain('GRAND TOTAL,1000.0000');
    expect(csv.trim().split('\n').length).toBeGreaterThan(10);
  });
});
