/**
 * GM visibility scope (FR-2/FR-24) — pure rules shared by the estimates list,
 * the dashboard, and stage drill-downs. A GM (approver) only sees their review
 * queue: estimates that are In Review or Approved.
 */
import { describe, it, expect } from 'vitest';
import { GM_VISIBLE_STAGE_KEYS, isGmScoped, gmStageWhere, gmCanViewStage } from './gm-scope';

describe('GM scope · visible stages', () => {
  it('GM-01 the queue is exactly In Review + Approved', () => {
    expect([...GM_VISIBLE_STAGE_KEYS]).toEqual(['IN_REVIEW', 'APPROVED']);
  });
});

describe('GM scope · isGmScoped', () => {
  it('GM-02 a GM is scoped', () => {
    expect(isGmScoped({ role: 'GM' })).toBe(true);
  });
  it('GM-03 Admin / Estimator / Viewer are not scoped', () => {
    expect(isGmScoped({ role: 'ADMIN' })).toBe(false);
    expect(isGmScoped({ role: 'ESTIMATOR' })).toBe(false);
    expect(isGmScoped({ role: 'VIEWER' })).toBe(false);
  });
  it('GM-04 a custom role is not scoped', () => {
    expect(isGmScoped({ role: 'REVIEWER' })).toBe(false);
  });
  it('GM-05 a missing / null user is not scoped', () => {
    expect(isGmScoped(undefined)).toBe(false);
    expect(isGmScoped(null)).toBe(false);
    expect(isGmScoped({ role: null })).toBe(false);
  });
});

describe('GM scope · gmStageWhere', () => {
  it('GM-06 a GM is limited to the queue stages', () => {
    expect(gmStageWhere({ role: 'GM' })).toEqual({
      currentStage: { key: { in: ['IN_REVIEW', 'APPROVED'] } },
    });
  });
  it('GM-07 everyone else gets no restriction', () => {
    expect(gmStageWhere({ role: 'ADMIN' })).toEqual({});
    expect(gmStageWhere({ role: 'ESTIMATOR' })).toEqual({});
    expect(gmStageWhere(undefined)).toEqual({});
  });
  it('GM-08 the fragment is a fresh object (no shared mutable state)', () => {
    const a = gmStageWhere({ role: 'GM' });
    const b = gmStageWhere({ role: 'GM' });
    expect(a).not.toBe(b);
  });
});

describe('GM scope · gmCanViewStage', () => {
  it('GM-09 a GM may view In Review', () => {
    expect(gmCanViewStage({ role: 'GM' }, 'IN_REVIEW')).toBe(true);
  });
  it('GM-10 a GM may view Approved', () => {
    expect(gmCanViewStage({ role: 'GM' }, 'APPROVED')).toBe(true);
  });
  it('GM-11 a GM may not view Draft', () => {
    expect(gmCanViewStage({ role: 'GM' }, 'DRAFT')).toBe(false);
  });
  it('GM-12 a GM may not view Final / Archived / Unassigned', () => {
    expect(gmCanViewStage({ role: 'GM' }, 'FINAL')).toBe(false);
    expect(gmCanViewStage({ role: 'GM' }, 'ARCHIVED')).toBe(false);
    expect(gmCanViewStage({ role: 'GM' }, 'UNASSIGNED')).toBe(false);
  });
  it('GM-13 a non-GM may view any stage', () => {
    expect(gmCanViewStage({ role: 'ADMIN' }, 'DRAFT')).toBe(true);
    expect(gmCanViewStage({ role: 'ESTIMATOR' }, 'UNASSIGNED')).toBe(true);
    expect(gmCanViewStage(undefined, 'DRAFT')).toBe(true);
  });
});
