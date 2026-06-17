/**
 * Settings card — estimate create/update contract QA (FR-4, FR-7, FR-22, FR-23).
 * 52 cases against `CreateEstimateRequest` / `UpdateEstimateRequest` (the Settings
 * card posts these: name, currency, rate card, upcharge, contingency, margin, tax).
 */
import { describe, it, expect } from 'vitest';
import { CreateEstimateRequest, UpdateEstimateRequest } from '@cost-reaper/types';

const UUID = '550e8400-e29b-41d4-a716-446655440000';
const cOk = (o: Record<string, unknown>) => CreateEstimateRequest.safeParse(o).success;
const uOk = (o: Record<string, unknown>) => UpdateEstimateRequest.safeParse(o).success;
const create = (o: Record<string, unknown> = {}) => ({ name: 'Est', currency: 'USD', ...o });

describe('Settings card · create — valid + defaults', () => {
  it('TC-01 minimal create (name + currency) is valid', () => {
    expect(cOk(create())).toBe(true);
  });
  it('TC-02 percents default to 0', () => {
    const r = CreateEstimateRequest.parse(create());
    expect(r.globalUpchargePercent).toBe(0);
    expect(r.contingencyPercent).toBe(0);
    expect(r.marginPercent).toBe(0);
    expect(r.taxPercent).toBe(0);
  });
  it('TC-03 accepts a description', () => {
    expect(cOk(create({ description: 'a client estimate' }))).toBe(true);
  });
  it('TC-04 accepts a rateCardId (uuid)', () => {
    expect(cOk(create({ rateCardId: UUID }))).toBe(true);
  });
  it('TC-05 accepts a global upcharge', () => {
    expect(cOk(create({ globalUpchargePercent: 15 }))).toBe(true);
  });
  it('TC-06 accepts a contingency', () => {
    expect(cOk(create({ contingencyPercent: 10 }))).toBe(true);
  });
  it('TC-07 accepts a margin', () => {
    expect(cOk(create({ marginPercent: 20 }))).toBe(true);
  });
  it('TC-08 accepts a tax', () => {
    expect(cOk(create({ taxPercent: 8.25 }))).toBe(true);
  });
  it('TC-09 accepts a 1-char name', () => {
    expect(cOk(create({ name: 'X' }))).toBe(true);
  });
  it('TC-10 accepts a 200-char name', () => {
    expect(cOk(create({ name: 'n'.repeat(200) }))).toBe(true);
  });
  it('TC-11 accepts EUR / GBP currencies', () => {
    expect(cOk(create({ currency: 'EUR' }))).toBe(true);
    expect(cOk(create({ currency: 'GBP' }))).toBe(true);
  });
  it('TC-12 accepts upcharge at the 100 bound', () => {
    expect(cOk(create({ globalUpchargePercent: 100 }))).toBe(true);
  });
  it('TC-13 accepts contingency at the 0 bound', () => {
    expect(cOk(create({ contingencyPercent: 0 }))).toBe(true);
  });
  it('TC-14 accepts a 4000-char description', () => {
    expect(cOk(create({ description: 'd'.repeat(4000) }))).toBe(true);
  });
  it('TC-15 accepts a fractional contingency', () => {
    expect(cOk(create({ contingencyPercent: 12.5 }))).toBe(true);
  });
});

describe('Settings card · create — rejected', () => {
  it('TC-16 rejects an empty name', () => {
    expect(cOk(create({ name: '' }))).toBe(false);
  });
  it('TC-17 rejects a name over 200 chars', () => {
    expect(cOk(create({ name: 'n'.repeat(201) }))).toBe(false);
  });
  it('TC-18 rejects a missing currency', () => {
    expect(CreateEstimateRequest.safeParse({ name: 'X' }).success).toBe(false);
  });
  it('TC-19 rejects a lowercase currency', () => {
    expect(cOk(create({ currency: 'usd' }))).toBe(false);
  });
  it('TC-20 rejects a 2-letter currency', () => {
    expect(cOk(create({ currency: 'US' }))).toBe(false);
  });
  it('TC-21 rejects a 4-letter currency', () => {
    expect(cOk(create({ currency: 'USDD' }))).toBe(false);
  });
  it('TC-22 rejects a non-uuid rateCardId', () => {
    expect(cOk(create({ rateCardId: 'rc-1' }))).toBe(false);
  });
  it('TC-23 rejects an upcharge above 100', () => {
    expect(cOk(create({ globalUpchargePercent: 101 }))).toBe(false);
  });
  it('TC-24 rejects a negative upcharge', () => {
    expect(cOk(create({ globalUpchargePercent: -1 }))).toBe(false);
  });
  it('TC-25 rejects a contingency above 100', () => {
    expect(cOk(create({ contingencyPercent: 150 }))).toBe(false);
  });
  it('TC-26 rejects a negative margin', () => {
    expect(cOk(create({ marginPercent: -5 }))).toBe(false);
  });
  it('TC-27 rejects a tax above 100', () => {
    expect(cOk(create({ taxPercent: 200 }))).toBe(false);
  });
  it('TC-28 rejects a description over 4000 chars', () => {
    expect(cOk(create({ description: 'd'.repeat(4001) }))).toBe(false);
  });
  it('TC-29 rejects a non-string name', () => {
    expect(cOk(create({ name: 123 }))).toBe(false);
  });
  it('TC-30 rejects a string percent (no coercion)', () => {
    expect(cOk(create({ globalUpchargePercent: '15' }))).toBe(false);
  });
});

describe('Settings card · update — partial edits', () => {
  it('TC-31 an empty update is valid (no-op)', () => {
    expect(uOk({})).toBe(true);
  });
  it('TC-32 update just the name', () => {
    expect(uOk({ name: 'Renamed' })).toBe(true);
  });
  it('TC-33 update the status (free reference string)', () => {
    expect(uOk({ status: 'APPROVED' })).toBe(true);
  });
  it('TC-34 update only the global upcharge', () => {
    expect(uOk({ globalUpchargePercent: 30 })).toBe(true);
  });
  it('TC-35 update only the contingency', () => {
    expect(uOk({ contingencyPercent: 5 })).toBe(true);
  });
  it('TC-36 update margin + tax together', () => {
    expect(uOk({ marginPercent: 20, taxPercent: 10 })).toBe(true);
  });
  it('TC-37 clear the description with null', () => {
    expect(uOk({ description: null })).toBe(true);
  });
  it('TC-38 clear the rate card with null', () => {
    expect(uOk({ rateCardId: null })).toBe(true);
  });
  it('TC-39 set a rate card by uuid', () => {
    expect(uOk({ rateCardId: UUID })).toBe(true);
  });
  it('TC-40 update does NOT accept a currency change (fixed at create)', () => {
    // currency is intentionally absent from UpdateEstimateRequest; unknown keys are stripped.
    const r = UpdateEstimateRequest.parse({ currency: 'EUR' } as Record<string, unknown>);
    expect('currency' in r).toBe(false);
  });
  it('TC-41 accepts a status up to 40 chars', () => {
    expect(uOk({ status: 's'.repeat(40) })).toBe(true);
  });
  it('TC-42 rejects a status over 40 chars', () => {
    expect(uOk({ status: 's'.repeat(41) })).toBe(false);
  });
  it('TC-43 rejects an empty name on update', () => {
    expect(uOk({ name: '' })).toBe(false);
  });
  it('TC-44 rejects an upcharge over 100 on update', () => {
    expect(uOk({ globalUpchargePercent: 101 })).toBe(false);
  });
  it('TC-45 rejects a negative contingency on update', () => {
    expect(uOk({ contingencyPercent: -1 })).toBe(false);
  });
  it('TC-46 rejects a non-uuid rateCardId on update', () => {
    expect(uOk({ rateCardId: 'x' })).toBe(false);
  });
  it('TC-47 accepts upcharge 0 on update (explicit zero)', () => {
    expect(uOk({ globalUpchargePercent: 0 })).toBe(true);
  });
  it('TC-48 accepts margin at the 100 bound', () => {
    expect(uOk({ marginPercent: 100 })).toBe(true);
  });
  it('TC-49 rejects a description over 4000 on update', () => {
    expect(uOk({ description: 'd'.repeat(4001) })).toBe(false);
  });
  it('TC-50 accepts a description at exactly 4000 on update', () => {
    expect(uOk({ description: 'd'.repeat(4000) })).toBe(true);
  });
  it('TC-51 accepts a fractional tax on update', () => {
    expect(uOk({ taxPercent: 7.25 })).toBe(true);
  });
  it('TC-52 accepts all settings updated at once', () => {
    expect(
      uOk({
        name: 'Full',
        status: 'DRAFT',
        rateCardId: UUID,
        globalUpchargePercent: 10,
        contingencyPercent: 10,
        marginPercent: 20,
        taxPercent: 8,
      }),
    ).toBe(true);
  });
});
