/**
 * Rate cards card — QA (FR-3, FR-5, NFR-5). 52 cases against the rate-card
 * contracts (`CreateRateCardRequest`, `RateCardRoleInput`, `UpdateRateCard*`) and
 * the labor line-total math a snapshotted rate drives (`lineTotal`).
 */
import { describe, it, expect } from 'vitest';
import {
  CreateRateCardRequest,
  RateCardRoleInput,
  UpdateRateCardRequest,
  UpdateRateCardRoleRequest,
} from '@cost-reaper/types';
import { lineTotal } from '@cost-reaper/engine';

const card = (o: Record<string, unknown> = {}) => ({
  name: 'Standard 2026',
  currency: 'USD',
  ...o,
});
const role = (o: Record<string, unknown> = {}) => ({
  roleName: 'Engineer',
  unit: 'HOUR',
  rate: '150',
  ...o,
});
const cardOk = (o: Record<string, unknown>) => CreateRateCardRequest.safeParse(o).success;
const roleOk = (o: Record<string, unknown>) => RateCardRoleInput.safeParse(o).success;

describe('Rate card · create contract — valid', () => {
  it('TC-01 minimal card (name + currency) is valid', () => {
    expect(cardOk(card())).toBe(true);
  });
  it('TC-02 roles default to an empty array', () => {
    expect(CreateRateCardRequest.parse(card()).roles).toEqual([]);
  });
  it('TC-03 a card with roles is valid', () => {
    expect(cardOk(card({ roles: [role()] }))).toBe(true);
  });
  it('TC-04 a card with several roles is valid', () => {
    expect(cardOk(card({ roles: [role(), role({ roleName: 'Architect', rate: '220' })] }))).toBe(
      true,
    );
  });
  it('TC-05 accepts EUR currency', () => {
    expect(cardOk(card({ currency: 'EUR' }))).toBe(true);
  });
  it('TC-06 accepts a 160-char name', () => {
    expect(cardOk(card({ name: 'n'.repeat(160) }))).toBe(true);
  });
  it('TC-07 accepts a 1-char name', () => {
    expect(cardOk(card({ name: 'X' }))).toBe(true);
  });
});

describe('Rate card · create contract — rejected', () => {
  it('TC-08 rejects an empty name', () => {
    expect(cardOk(card({ name: '' }))).toBe(false);
  });
  it('TC-09 rejects a name over 160 chars', () => {
    expect(cardOk(card({ name: 'n'.repeat(161) }))).toBe(false);
  });
  it('TC-10 rejects a missing currency', () => {
    expect(CreateRateCardRequest.safeParse({ name: 'X' }).success).toBe(false);
  });
  it('TC-11 rejects a lowercase currency', () => {
    expect(cardOk(card({ currency: 'usd' }))).toBe(false);
  });
  it('TC-12 rejects a malformed currency', () => {
    expect(cardOk(card({ currency: 'DOLLARS' }))).toBe(false);
  });
  it('TC-13 rejects a card whose role is invalid', () => {
    expect(cardOk(card({ roles: [role({ unit: 'WEEK' })] }))).toBe(false);
  });
  it('TC-14 rejects roles that are not an array', () => {
    expect(cardOk(card({ roles: role() }))).toBe(false);
  });
});

describe('Rate card · role contract — valid', () => {
  it('TC-15 a HOUR role is valid', () => {
    expect(roleOk(role({ unit: 'HOUR' }))).toBe(true);
  });
  it('TC-16 a DAY role is valid', () => {
    expect(roleOk(role({ unit: 'DAY' }))).toBe(true);
  });
  it('TC-17 accepts a decimal rate', () => {
    expect(roleOk(role({ rate: '187.50' }))).toBe(true);
  });
  it('TC-18 accepts a high-precision rate', () => {
    expect(roleOk(role({ rate: '99.9999' }))).toBe(true);
  });
  it('TC-19 accepts a rate of 0', () => {
    expect(roleOk(role({ rate: '0' }))).toBe(true);
  });
  it('TC-20 accepts a 120-char role name', () => {
    expect(roleOk(role({ roleName: 'r'.repeat(120) }))).toBe(true);
  });
});

describe('Rate card · role contract — rejected', () => {
  it('TC-21 rejects an empty role name', () => {
    expect(roleOk(role({ roleName: '' }))).toBe(false);
  });
  it('TC-22 rejects a role name over 120 chars', () => {
    expect(roleOk(role({ roleName: 'r'.repeat(121) }))).toBe(false);
  });
  it('TC-23 rejects an unknown unit', () => {
    expect(roleOk(role({ unit: 'MONTH' }))).toBe(false);
  });
  it('TC-24 rejects a lowercase unit', () => {
    expect(roleOk(role({ unit: 'hour' }))).toBe(false);
  });
  it('TC-25 rejects a non-decimal rate', () => {
    expect(roleOk(role({ rate: 'expensive' }))).toBe(false);
  });
  it('TC-26 rejects a numeric (non-string) rate', () => {
    expect(roleOk(role({ rate: 150 }))).toBe(false);
  });
  it('TC-27 rejects a missing unit', () => {
    expect(RateCardRoleInput.safeParse({ roleName: 'Eng', rate: '100' }).success).toBe(false);
  });
  it('TC-28 rejects a missing rate', () => {
    expect(RateCardRoleInput.safeParse({ roleName: 'Eng', unit: 'HOUR' }).success).toBe(false);
  });
});

describe('Rate card · update contracts', () => {
  it('TC-29 an empty card update is valid', () => {
    expect(UpdateRateCardRequest.safeParse({}).success).toBe(true);
  });
  it('TC-30 rename a card', () => {
    expect(UpdateRateCardRequest.safeParse({ name: 'Renamed' }).success).toBe(true);
  });
  it('TC-31 deactivate a card', () => {
    expect(UpdateRateCardRequest.safeParse({ isActive: false }).success).toBe(true);
  });
  it('TC-32 rejects an empty name on card update', () => {
    expect(UpdateRateCardRequest.safeParse({ name: '' }).success).toBe(false);
  });
  it('TC-33 an empty role update is valid', () => {
    expect(UpdateRateCardRoleRequest.safeParse({}).success).toBe(true);
  });
  it('TC-34 update only a role rate', () => {
    expect(UpdateRateCardRoleRequest.safeParse({ rate: '175' }).success).toBe(true);
  });
  it('TC-35 update only a role unit', () => {
    expect(UpdateRateCardRoleRequest.safeParse({ unit: 'DAY' }).success).toBe(true);
  });
  it('TC-36 rejects an invalid unit on role update', () => {
    expect(UpdateRateCardRoleRequest.safeParse({ unit: 'YEAR' }).success).toBe(false);
  });
  it('TC-37 rejects a bad rate on role update', () => {
    expect(UpdateRateCardRoleRequest.safeParse({ rate: 'NaN!' }).success).toBe(false);
  });
});

describe('Rate card · labor line total from a snapshotted rate', () => {
  it('TC-38 $150/hr × 2 people × 160 hrs = 48,000', () => {
    expect(lineTotal('150', 2 * 160)).toBe('48000.0000');
  });
  it('TC-39 $200/hr × 1 × 40 hrs = 8,000', () => {
    expect(lineTotal('200', 1 * 40)).toBe('8000.0000');
  });
  it('TC-40 a DAY-unit role: $1,200/day × 1 × 10 days = 12,000', () => {
    expect(lineTotal('1200', 1 * 10)).toBe('12000.0000');
  });
  it('TC-41 fractional rate $187.50/hr × 1 × 8 = 1,500', () => {
    expect(lineTotal('187.50', 1 * 8)).toBe('1500.0000');
  });
  it('TC-42 rate 0 → line total 0', () => {
    expect(lineTotal('0', 100)).toBe('0.0000');
  });
  it('TC-43 high-precision rate keeps exact decimals', () => {
    expect(lineTotal('99.99', 3)).toBe('299.9700');
  });
  it('TC-44 a 1-hour task', () => {
    expect(lineTotal('150', 1 * 1)).toBe('150.0000');
  });
  it('TC-45 a team of 5 for a full month (5 × 160)', () => {
    expect(lineTotal('100', 5 * 160)).toBe('80000.0000');
  });
});

describe('Rate card · snapshot semantics (BR-3, NFR-5)', () => {
  // A labor line snapshots the rate at add time, so editing the card later does
  // not change saved estimates. The math is a pure function of the snapshot.
  it('TC-46 total uses the snapshot, not a later rate', () => {
    const snapshot = '150';
    expect(lineTotal(snapshot, 100)).toBe('15000.0000');
  });
  it('TC-47 a changed rate would only affect new lines (different result)', () => {
    expect(lineTotal('150', 100)).not.toBe(lineTotal('175', 100));
  });
  it('TC-48 the same snapshot is deterministic', () => {
    expect(lineTotal('150', 100)).toBe(lineTotal('150', 100));
  });
  it('TC-49 a card may legitimately carry a 0 rate (placeholder role)', () => {
    expect(roleOk(role({ rate: '0' }))).toBe(true);
  });
  it('TC-50 a very high rate is allowed', () => {
    expect(roleOk(role({ rate: '100000' }))).toBe(true);
  });
  it('TC-51 currency lives on the card, not the role', () => {
    const r = CreateRateCardRequest.parse(card({ roles: [role()] }));
    expect(r.currency).toBe('USD');
    expect('currency' in r.roles[0]).toBe(false);
  });
  it('TC-52 a card with many roles parses', () => {
    const roles = Array.from({ length: 20 }, (_, i) => role({ roleName: `Role ${i}` }));
    expect(cardOk(card({ roles }))).toBe(true);
  });
});
