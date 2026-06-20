/**
 * SOW flavor card — QA for the template-flavor contracts (BR-7): the flavor
 * enum + catalog, the create request, the SOW DTO, and the line-item rows.
 * Pure (no DB/HTTP).
 */
import { describe, it, expect } from 'vitest';
import {
  SowFlavor,
  SOW_FLAVORS,
  SowLineItemDto,
  CreateSowRequest,
  StatementOfWorkDto,
} from '@cost-reaper/types';

const UUID = '550e8400-e29b-41d4-a716-446655440000';
const FLAVORS = ['ENTERPRISE', 'CONCISE', 'PROPOSAL', 'TIME_MATERIALS'];

describe('SOW flavor · enum', () => {
  it('FL-01 accepts every flavor', () => {
    for (const f of FLAVORS) expect(SowFlavor.safeParse(f).success).toBe(true);
  });
  it('FL-02 rejects an unknown flavor', () => {
    expect(SowFlavor.safeParse('BASIC').success).toBe(false);
  });
  it('FL-03 rejects a lowercase flavor', () => {
    expect(SowFlavor.safeParse('enterprise').success).toBe(false);
  });
  it('FL-04 has exactly the four flavors', () => {
    expect([...SowFlavor.options].sort()).toEqual([...FLAVORS].sort());
  });
});

describe('SOW flavor · catalog (SOW_FLAVORS)', () => {
  it('FL-05 lists all four flavors', () => {
    expect(SOW_FLAVORS).toHaveLength(4);
  });
  it('FL-06 catalog keys match the enum', () => {
    expect(SOW_FLAVORS.map((f) => f.key).sort()).toEqual([...FLAVORS].sort());
  });
  it('FL-07 every entry has a label and description', () => {
    for (const f of SOW_FLAVORS) {
      expect(f.label.length).toBeGreaterThan(0);
      expect(f.description.length).toBeGreaterThan(0);
    }
  });
  it('FL-08 keys are unique', () => {
    expect(new Set(SOW_FLAVORS.map((f) => f.key)).size).toBe(SOW_FLAVORS.length);
  });
  it('FL-09 every catalog key is a valid flavor', () => {
    for (const f of SOW_FLAVORS) expect(SowFlavor.safeParse(f.key).success).toBe(true);
  });
});

describe('SOW flavor · create request', () => {
  const ok = (o: Record<string, unknown>) => CreateSowRequest.safeParse(o).success;
  it('FL-10 valid with a flavor', () => {
    expect(ok({ estimateId: UUID, flavor: 'PROPOSAL' })).toBe(true);
  });
  it('FL-11 valid without a flavor (optional)', () => {
    expect(ok({ estimateId: UUID })).toBe(true);
  });
  it('FL-12 rejects an unknown flavor', () => {
    expect(ok({ estimateId: UUID, flavor: 'NOPE' })).toBe(false);
  });
  it('FL-13 still requires the estimateId', () => {
    expect(ok({ flavor: 'CONCISE' })).toBe(false);
  });
  it('FL-14 rejects a non-uuid estimateId', () => {
    expect(ok({ estimateId: 'x', flavor: 'ENTERPRISE' })).toBe(false);
  });
  it('FL-15 each flavor is accepted', () => {
    for (const f of FLAVORS) expect(ok({ estimateId: UUID, flavor: f })).toBe(true);
  });
});

describe('SOW flavor · SOW DTO carries the flavor', () => {
  it('FL-16 the DTO schema has a flavor field', () => {
    expect('flavor' in StatementOfWorkDto.shape).toBe(true);
  });
  it('FL-17 the DTO flavor validates against the enum', () => {
    expect(StatementOfWorkDto.shape.flavor.safeParse('TIME_MATERIALS').success).toBe(true);
    expect(StatementOfWorkDto.shape.flavor.safeParse('OTHER').success).toBe(false);
  });
});

describe('SOW flavor · line-item rows (SowLineItemDto)', () => {
  const row = (o: Record<string, unknown> = {}) => ({
    kind: 'LABOR',
    category: 'Labor',
    item: 'Lead Architect',
    quantity: '1 × 160',
    unitPrice: '210.0000',
    billingPeriod: 'ONE_TIME',
    lineTotal: '33600.0000',
    ...o,
  });
  it('FL-18 a LABOR row is valid', () => {
    expect(SowLineItemDto.safeParse(row()).success).toBe(true);
  });
  it('FL-19 a NONLABOR row is valid', () => {
    expect(SowLineItemDto.safeParse(row({ kind: 'NONLABOR', category: 'Licenses' })).success).toBe(
      true,
    );
  });
  it('FL-20 a CLOUD row is valid', () => {
    expect(SowLineItemDto.safeParse(row({ kind: 'CLOUD', category: 'AWS EC2' })).success).toBe(
      true,
    );
  });
  it('FL-21 rejects an unknown kind', () => {
    expect(SowLineItemDto.safeParse(row({ kind: 'OTHER' })).success).toBe(false);
  });
  it('FL-22 rejects a missing lineTotal', () => {
    const o = row();
    delete (o as Record<string, unknown>).lineTotal;
    expect(SowLineItemDto.safeParse(o).success).toBe(false);
  });
  it('FL-23 rejects a missing item', () => {
    const o = row();
    delete (o as Record<string, unknown>).item;
    expect(SowLineItemDto.safeParse(o).success).toBe(false);
  });
  it('FL-24 the three kinds are exactly LABOR / NONLABOR / CLOUD', () => {
    expect([...SowLineItemDto.shape.kind.options].sort()).toEqual(['CLOUD', 'LABOR', 'NONLABOR']);
  });
});
