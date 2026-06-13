import { describe, it, expect } from 'vitest';
import {
  evaluateChecklist,
  type ChecklistEstimate,
  type ChecklistRuleDef,
} from './checklist-rules';

const RULES: ChecklistRuleDef[] = [
  { key: 'rate_card_selected', description: 'Rate card', severity: 'BLOCKER', scope: 'ESTIMATE' },
  { key: 'labor_role_assigned', description: 'Labor roles', severity: 'BLOCKER', scope: 'LABOR' },
  { key: 'totals_reconcile', description: 'Has lines', severity: 'INFO', scope: 'ESTIMATE' },
];

const empty: ChecklistEstimate = {
  rateCardId: null,
  globalUpchargePercent: 0,
  contingencyPercent: 0,
  labor: [],
  nonLabor: [],
  cloud: [],
};

describe('evaluateChecklist', () => {
  it('blocks when a BLOCKER rule fails (no rate card)', () => {
    const r = evaluateChecklist(RULES, empty);
    expect(r.blocking).toBe(true);
    expect(r.passed).toBe(false);
    expect(r.items.find((i) => i.key === 'rate_card_selected')?.passed).toBe(false);
  });

  it('passes when blocking rules are satisfied', () => {
    const r = evaluateChecklist(RULES, {
      ...empty,
      rateCardId: 'rc1',
      labor: [
        {
          id: 'l1',
          rateCardRoleId: 'role1',
          rateSnapshot: '100',
          quantity: 1,
          units: 8,
          billingPeriod: 'ONE_TIME',
          resourceName: null,
          allocationPercent: 100,
          startDate: null,
          endDate: null,
        },
      ],
    });
    expect(r.blocking).toBe(false);
    expect(r.passed).toBe(true);
    expect(r.completeness).toBe(1);
  });

  it('flags a labor line missing its role and rate, naming the line for deep-linking', () => {
    const r = evaluateChecklist(RULES, {
      ...empty,
      rateCardId: 'rc1',
      labor: [
        {
          id: 'labor-bad',
          rateCardRoleId: null,
          rateSnapshot: '0',
          quantity: 1,
          units: 8,
          billingPeriod: 'ONE_TIME',
          resourceName: null,
          allocationPercent: 100,
          startDate: null,
          endDate: null,
        },
      ],
    });
    const item = r.items.find((i) => i.key === 'labor_role_assigned');
    expect(item?.passed).toBe(false);
    expect(item?.entityIds).toEqual(['labor-bad']);
    expect(r.blocking).toBe(true);
  });
});

describe('resource_capacity rule (FR-27)', () => {
  const CAP: ChecklistRuleDef[] = [
    { key: 'resource_capacity', description: 'Capacity', severity: 'BLOCKER', scope: 'RESOURCE' },
  ];
  const laborLine = (over: Partial<ChecklistEstimate['labor'][number]>) => ({
    id: over.id ?? 'l',
    rateCardRoleId: 'r',
    rateSnapshot: '100',
    quantity: 1,
    units: 8,
    billingPeriod: 'ONE_TIME',
    resourceName: null,
    allocationPercent: 100,
    startDate: null,
    endDate: null,
    ...over,
  });

  it('passes when overlapping allocations stay within 100%', () => {
    const r = evaluateChecklist(CAP, {
      ...empty,
      labor: [
        laborLine({
          resourceName: 'Ada',
          allocationPercent: 60,
          startDate: '2026-07-01',
          endDate: '2026-07-31',
        }),
        laborLine({
          resourceName: 'Ada',
          allocationPercent: 40,
          startDate: '2026-07-10',
          endDate: '2026-07-20',
        }),
      ],
    });
    expect(r.blocking).toBe(false);
  });

  it('blocks when a resource exceeds 100% on overlapping dates', () => {
    const r = evaluateChecklist(CAP, {
      ...empty,
      labor: [
        laborLine({
          id: 'ada-1',
          resourceName: 'Ada',
          allocationPercent: 70,
          startDate: '2026-07-01',
          endDate: '2026-07-31',
        }),
        laborLine({
          id: 'ada-2',
          resourceName: 'Ada',
          allocationPercent: 50,
          startDate: '2026-07-15',
          endDate: '2026-08-15',
        }),
      ],
    });
    expect(r.blocking).toBe(true);
    expect(r.items[0].message).toContain('Ada');
    expect(r.items[0].message).toContain('2026-07-15');
    // Both of Ada's lines are named so the UI can highlight them (FR-25 deep-link).
    expect(r.items[0].entityIds).toEqual(['ada-1', 'ada-2']);
  });

  it('does not flag non-overlapping windows (handoff on adjacent days)', () => {
    const r = evaluateChecklist(CAP, {
      ...empty,
      labor: [
        laborLine({
          resourceName: 'Ada',
          allocationPercent: 100,
          startDate: '2026-07-01',
          endDate: '2026-07-15',
        }),
        laborLine({
          resourceName: 'Ada',
          allocationPercent: 100,
          startDate: '2026-07-16',
          endDate: '2026-07-31',
        }),
      ],
    });
    expect(r.blocking).toBe(false);
  });
});
