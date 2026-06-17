/**
 * SOW Milestone Schedule (BR-7, FR-28) — proves the SOW's §7 "Deliverables &
 * Milestone Schedule" is the estimate's **cost per SDLC phase**. The SOW renders
 * `pricing.phases` from the engine, so these assert that engine output directly:
 * each tagged phase is a milestone fee (one-time, invoiced on acceptance),
 * recurring cost is shown separately, untagged lines roll up under "Unassigned",
 * milestones list in lifecycle order, upcharge is included, contingency is not,
 * and the milestone fees sum to the one-time subtotal.
 */
import { describe, it, expect } from 'vitest';
import { computeEstimate } from '@cost-reaper/engine';
import type { EngineInput, EngineLine } from '@cost-reaper/types';

const line = (o: Partial<EngineLine> & { baseAmount: string }): EngineLine => ({
  id: 'L',
  category: 'Labor',
  quantity: 1,
  billingPeriod: 'ONE_TIME',
  upchargePercentOverride: null,
  sdlcPhase: null,
  ...o,
});
const run = (lines: EngineLine[], extra: Partial<EngineInput> = {}) =>
  computeEstimate({
    globalUpchargePercent: 0,
    contingencyPercent: 0,
    marginPercent: 0,
    taxPercent: 0,
    moneyScale: 4,
    lines,
    ...extra,
  });
const phaseFee = (ps: { phase: string; oneTime: string }[], name: string) =>
  ps.find((p) => p.phase === name)?.oneTime;

describe('SOW milestone schedule = cost per SDLC phase', () => {
  it('MS-01 each tagged phase becomes a milestone with its one-time fee', () => {
    const ps = run([
      line({ baseAmount: '5000', sdlcPhase: 'PLANNING' }),
      line({ baseAmount: '20000', sdlcPhase: 'DEVELOPMENT' }),
    ]).phases;
    expect(phaseFee(ps, 'PLANNING')).toBe('5000.0000');
    expect(phaseFee(ps, 'DEVELOPMENT')).toBe('20000.0000');
  });

  it('MS-02 the milestone fee is qty × base for the phase', () => {
    const ps = run([line({ baseAmount: '1000', quantity: 5, sdlcPhase: 'PLANNING' })]).phases;
    expect(phaseFee(ps, 'PLANNING')).toBe('5000.0000');
  });

  it('MS-03 multiple lines in the same phase aggregate into one milestone', () => {
    const ps = run([
      line({ baseAmount: '12000', sdlcPhase: 'DEVELOPMENT' }),
      line({ baseAmount: '8000', sdlcPhase: 'DEVELOPMENT' }),
    ]).phases;
    expect(ps.filter((p) => p.phase === 'DEVELOPMENT')).toHaveLength(1);
    expect(phaseFee(ps, 'DEVELOPMENT')).toBe('20000.0000');
  });

  it('MS-04 milestones list in SDLC lifecycle order', () => {
    const ps = run([
      line({ baseAmount: '1', sdlcPhase: 'TESTING' }),
      line({ baseAmount: '1', sdlcPhase: 'PLANNING' }),
      line({ baseAmount: '1', sdlcPhase: 'DEVELOPMENT' }),
      line({ baseAmount: '1', sdlcPhase: 'DEPLOYMENT' }),
    ]).phases;
    expect(ps.map((p) => p.phase)).toEqual(['PLANNING', 'DEVELOPMENT', 'TESTING', 'DEPLOYMENT']);
  });

  it('MS-05 untagged lines roll up under an "Unassigned" milestone, listed last', () => {
    const ps = run([
      line({ baseAmount: '3000', sdlcPhase: 'PLANNING' }),
      line({ baseAmount: '1500', sdlcPhase: null }),
    ]).phases;
    expect(phaseFee(ps, 'Unassigned')).toBe('1500.0000');
    expect(ps[ps.length - 1].phase).toBe('Unassigned');
  });

  it('MS-06 the milestone fees sum to the one-time subtotal (the milestone total)', () => {
    const r = run([
      line({ baseAmount: '5000', sdlcPhase: 'PLANNING' }),
      line({ baseAmount: '20000', sdlcPhase: 'DEVELOPMENT' }),
      line({ baseAmount: '7000', sdlcPhase: 'TESTING' }),
    ]);
    const sum = r.phases.reduce((a, p) => a + Number(p.oneTime), 0);
    expect(sum).toBe(Number(r.oneTimeSubtotal));
    expect(r.oneTimeSubtotal).toBe('32000.0000');
  });

  it('MS-07 a recurring-only phase has a ZERO one-time milestone fee (billed on cadence, not a milestone)', () => {
    const ps = run([
      line({ baseAmount: '1000', sdlcPhase: 'DEPLOYMENT', billingPeriod: 'MONTHLY' }),
    ]).phases;
    const dep = ps.find((p) => p.phase === 'DEPLOYMENT')!;
    expect(dep.oneTime).toBe('0.0000');
    expect(dep.monthly).toBe('1000.0000');
    expect(dep.yearly).toBe('12000.0000');
  });

  it('MS-08 a phase mixing one-time + monthly splits the milestone fee from the recurring', () => {
    const ps = run([
      line({ baseAmount: '20000', sdlcPhase: 'DEVELOPMENT' }),
      line({ baseAmount: '1000', sdlcPhase: 'DEVELOPMENT', billingPeriod: 'MONTHLY' }),
    ]).phases;
    const dev = ps.find((p) => p.phase === 'DEVELOPMENT')!;
    expect(dev.oneTime).toBe('20000.0000'); // the invoiceable milestone fee
    expect(dev.monthly).toBe('1000.0000');
    expect(dev.yearly).toBe('12000.0000');
  });

  it('MS-09 a yearly-billed phase annualizes (monthly = yearly ÷ 12), one-time stays 0', () => {
    const ps = run([
      line({ baseAmount: '12000', sdlcPhase: 'MAINTENANCE', billingPeriod: 'YEARLY' }),
    ]).phases;
    const m = ps.find((p) => p.phase === 'MAINTENANCE')!;
    expect(m.oneTime).toBe('0.0000');
    expect(m.monthly).toBe('1000.0000');
    expect(m.yearly).toBe('12000.0000');
  });

  it('MS-10 the milestone fee INCLUDES the upcharge (post-markup)', () => {
    const ps = run([line({ baseAmount: '20000', sdlcPhase: 'DEVELOPMENT' })], {
      globalUpchargePercent: 10,
    }).phases;
    expect(phaseFee(ps, 'DEVELOPMENT')).toBe('22000.0000'); // 20000 × 1.10
  });

  it('MS-11 a per-line upcharge override flows into that phase milestone fee', () => {
    const ps = run(
      [line({ baseAmount: '20000', sdlcPhase: 'DEVELOPMENT', upchargePercentOverride: 25 })],
      {
        globalUpchargePercent: 10,
      },
    ).phases;
    expect(phaseFee(ps, 'DEVELOPMENT')).toBe('25000.0000'); // 20000 × 1.25 (override wins)
  });

  it('MS-12 contingency is EXCLUDED from milestone fees (carried in the grand total)', () => {
    const r = run([line({ baseAmount: '5000', sdlcPhase: 'PLANNING' })], {
      contingencyPercent: 10,
    });
    expect(phaseFee(r.phases, 'PLANNING')).toBe('5000.0000'); // no contingency in the milestone
    expect(r.contingencyAmount).toBe('500.0000'); // contingency lives at the estimate level
    expect(r.grandTotal).toBe('5500.0000');
  });

  it('MS-13 an estimate with no lines has no milestones', () => {
    expect(run([]).phases).toEqual([]);
  });

  it('MS-14 a full phased build produces one milestone per phase with correct fees', () => {
    const r = run([
      line({ baseAmount: '8000', sdlcPhase: 'PLANNING' }),
      line({ baseAmount: '15000', sdlcPhase: 'DESIGN' }),
      line({ baseAmount: '60000', sdlcPhase: 'DEVELOPMENT' }),
      line({ baseAmount: '12000', sdlcPhase: 'TESTING' }),
      line({ baseAmount: '5000', sdlcPhase: 'DEPLOYMENT' }),
    ]);
    expect(r.phases.map((p) => p.phase)).toEqual([
      'PLANNING',
      'DESIGN',
      'DEVELOPMENT',
      'TESTING',
      'DEPLOYMENT',
    ]);
    expect(r.phases.map((p) => p.oneTime)).toEqual([
      '8000.0000',
      '15000.0000',
      '60000.0000',
      '12000.0000',
      '5000.0000',
    ]);
    expect(r.oneTimeSubtotal).toBe('100000.0000');
  });
});
