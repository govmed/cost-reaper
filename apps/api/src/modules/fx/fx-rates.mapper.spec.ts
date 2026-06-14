import { describe, it, expect } from 'vitest';
import { mapFxRates } from './fx-rates.mapper';

describe('mapFxRates', () => {
  it('inverts foreign-per-USD into USD-per-foreign (rateToBase), 6 dp', () => {
    const m = mapFxRates({ EUR: 0.92, JPY: 150, GBP: 0.8 }, ['EUR', 'JPY', 'GBP']);
    expect(m.get('EUR')).toBe('1.086957');
    expect(m.get('JPY')).toBe('0.006667');
    expect(m.get('GBP')).toBe('1.250000');
  });

  it('omits USD and skips unknown / non-positive / non-finite rates', () => {
    const m = mapFxRates({ EUR: 0.92, ZERO: 0, NEG: -1, NAN: Number.NaN }, [
      'USD',
      'EUR',
      'ZERO',
      'NEG',
      'NAN',
      'XOF',
    ]);
    expect(m.has('USD')).toBe(false); // base, never mapped
    expect(m.has('ZERO')).toBe(false);
    expect(m.has('NEG')).toBe(false);
    expect(m.has('NAN')).toBe(false);
    expect(m.has('XOF')).toBe(false); // not provided by the source
    expect(m.get('EUR')).toBe('1.086957');
    expect(m.size).toBe(1);
  });
});
