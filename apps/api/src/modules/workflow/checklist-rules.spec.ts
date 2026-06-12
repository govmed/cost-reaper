import { describe, it, expect } from 'vitest';
import { evaluateChecklist, type ChecklistEstimate, type ChecklistRuleDef } from './checklist-rules';

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
      labor: [{ rateCardRoleId: 'role1', rateSnapshot: '100', quantity: 1, units: 8, billingPeriod: 'ONE_TIME' }],
    });
    expect(r.blocking).toBe(false);
    expect(r.passed).toBe(true);
    expect(r.completeness).toBe(1);
  });

  it('flags a labor line missing its role and rate', () => {
    const r = evaluateChecklist(RULES, {
      ...empty,
      rateCardId: 'rc1',
      labor: [{ rateCardRoleId: null, rateSnapshot: '0', quantity: 1, units: 8, billingPeriod: 'ONE_TIME' }],
    });
    expect(r.items.find((i) => i.key === 'labor_role_assigned')?.passed).toBe(false);
    expect(r.blocking).toBe(true);
  });
});
