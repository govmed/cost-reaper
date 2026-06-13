import Decimal from 'decimal.js';
import type {
  CategorySubtotal,
  EngineInput,
  EngineLine,
  EngineResult,
  PhaseSubtotal,
} from '@cost-reaper/types';
import { SDLC_PHASE_ORDER, UNASSIGNED_PHASE } from '@cost-reaper/types';

// Exact decimal money math — never floats (NFR-5).
Decimal.set({ rounding: Decimal.ROUND_HALF_UP, precision: 40 });

const HUNDRED = new Decimal(100);
const TWELVE = new Decimal(12);

const d = (v: Decimal.Value): Decimal => new Decimal(v);

/**
 * Effective upcharge for a line (FR-22): the per-line override wins when set
 * (including an explicit 0); otherwise the estimate's global upcharge applies.
 */
/** Exact base line total = baseAmount × quantity, rounded to `scale` (pre-upcharge). */
export function lineTotal(baseAmount: string, quantity: number, scale = 4): string {
  return new Decimal(baseAmount).times(quantity).toFixed(scale);
}

/** Exact sum of decimal-string money values (never floats); used for roll-ups. */
export function sumMoney(values: string[], scale = 4): string {
  return values.reduce((acc, v) => acc.plus(new Decimal(v)), new Decimal(0)).toFixed(scale);
}

/**
 * PERT / three-point expected value (FR-13): (optimistic + 4·mostLikely + pessimistic) / 6.
 * Exact decimal math. Used to derive a labor line's effective units when a
 * three-point estimate is supplied.
 */
export function pert(optimistic: number, mostLikely: number, pessimistic: number): number {
  return new Decimal(optimistic)
    .plus(new Decimal(mostLikely).times(4))
    .plus(pessimistic)
    .div(6)
    .toNumber();
}

export function effectiveUpcharge(line: EngineLine, globalUpchargePercent: number): Decimal {
  const override = line.upchargePercentOverride;
  return d(override === null || override === undefined ? globalUpchargePercent : override);
}

interface LineComputation {
  base: Decimal;
  markedUp: Decimal;
  upcharge: Decimal;
  billingPeriod: EngineLine['billingPeriod'];
  category: string;
  phase: string;
}

function computeLine(line: EngineLine, globalUpchargePercent: number): LineComputation {
  const base = d(line.baseAmount).times(d(line.quantity ?? 1));
  const up = effectiveUpcharge(line, globalUpchargePercent);
  const markedUp = base.times(HUNDRED.plus(up).div(HUNDRED));
  return {
    base,
    markedUp,
    upcharge: markedUp.minus(base),
    billingPeriod: line.billingPeriod,
    category: line.category,
    phase: line.sdlcPhase ?? UNASSIGNED_PHASE,
  };
}

/** Stable SDLC ordering: canonical phases first in lifecycle order, "Unassigned" last (FR-28). */
function phaseRank(phase: string): number {
  const i = (SDLC_PHASE_ORDER as readonly string[]).indexOf(phase);
  return i === -1 ? SDLC_PHASE_ORDER.length : i;
}

/**
 * The single source of truth for estimate math (FR-7, FR-22, FR-23).
 *
 * Order (CLAUDE.md Section 10): base line value → apply effective upcharge →
 * category subtotals → apply contingency on the upcharged subtotal → grand total.
 *
 * Recurring roll-up (FR-23):
 *   ONE_TIME → one-off bucket only
 *   MONTHLY  → +amount to monthly, +amount×12 to yearly
 *   YEARLY   → +amount÷12 to monthly, +amount to yearly
 *
 * grandTotal = (one-time + annualized yearly) after contingency.
 */
export function computeEstimate(input: EngineInput): EngineResult {
  const scale = input.moneyScale ?? 4;
  const globalUp = input.globalUpchargePercent ?? 0;
  const contingency = d(input.contingencyPercent ?? 0).div(HUNDRED);

  let oneTime = new Decimal(0);
  let monthly = new Decimal(0);
  let yearly = new Decimal(0);
  let upchargeTotal = new Decimal(0);

  type Bucket = { oneTime: Decimal; monthly: Decimal; yearly: Decimal };
  const newBucket = (): Bucket => ({
    oneTime: new Decimal(0),
    monthly: new Decimal(0),
    yearly: new Decimal(0),
  });
  const accrue = (b: Bucket, billingPeriod: LineComputation['billingPeriod'], amount: Decimal) => {
    if (billingPeriod === 'ONE_TIME') {
      b.oneTime = b.oneTime.plus(amount);
    } else if (billingPeriod === 'MONTHLY') {
      b.monthly = b.monthly.plus(amount);
      b.yearly = b.yearly.plus(amount.times(TWELVE));
    } else {
      b.monthly = b.monthly.plus(amount.div(TWELVE));
      b.yearly = b.yearly.plus(amount);
    }
  };

  const catMap = new Map<string, Bucket>();
  const phaseMap = new Map<string, Bucket>();

  for (const line of input.lines) {
    const c = computeLine(line, globalUp);
    upchargeTotal = upchargeTotal.plus(c.upcharge);

    if (c.billingPeriod === 'ONE_TIME') {
      oneTime = oneTime.plus(c.markedUp);
    } else if (c.billingPeriod === 'MONTHLY') {
      monthly = monthly.plus(c.markedUp);
      yearly = yearly.plus(c.markedUp.times(TWELVE));
    } else {
      monthly = monthly.plus(c.markedUp.div(TWELVE));
      yearly = yearly.plus(c.markedUp);
    }

    const cat = catMap.get(c.category) ?? newBucket();
    accrue(cat, c.billingPeriod, c.markedUp);
    catMap.set(c.category, cat);

    const ph = phaseMap.get(c.phase) ?? newBucket();
    accrue(ph, c.billingPeriod, c.markedUp);
    phaseMap.set(c.phase, ph);
  }

  const factor = new Decimal(1).plus(contingency);
  const oneTimeTotal = oneTime.times(factor);
  const monthlyTotal = monthly.times(factor);
  const yearlyTotal = yearly.times(factor);
  const grand = oneTime.plus(yearly).times(factor);
  const contingencyAmount = grand.minus(oneTime.plus(yearly));

  const categories: CategorySubtotal[] = [...catMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, v]) => ({
      category,
      oneTime: v.oneTime.toFixed(scale),
      monthly: v.monthly.toFixed(scale),
      yearly: v.yearly.toFixed(scale),
    }));

  const phases: PhaseSubtotal[] = [...phaseMap.entries()]
    .sort(([a], [b]) => phaseRank(a) - phaseRank(b) || a.localeCompare(b))
    .map(([phase, v]) => ({
      phase,
      oneTime: v.oneTime.toFixed(scale),
      monthly: v.monthly.toFixed(scale),
      yearly: v.yearly.toFixed(scale),
    }));

  return {
    oneTimeSubtotal: oneTime.toFixed(scale),
    monthlySubtotal: monthly.toFixed(scale),
    yearlySubtotal: yearly.toFixed(scale),
    upchargeAmount: upchargeTotal.toFixed(scale),
    contingencyAmount: contingencyAmount.toFixed(scale),
    oneTimeTotal: oneTimeTotal.toFixed(scale),
    monthlyTotal: monthlyTotal.toFixed(scale),
    yearlyTotal: yearlyTotal.toFixed(scale),
    grandTotal: grand.toFixed(scale),
    categories,
    phases,
  };
}
