import type {
  ChecklistItemResult,
  ChecklistResult,
  ChecklistScope,
  ChecklistSeverity,
} from '@cost-reaper/types';
import { findCapacityViolations } from '@cost-reaper/engine';

export interface ChecklistRuleDef {
  key: string;
  description: string;
  severity: ChecklistSeverity;
  scope: ChecklistScope;
}

export interface ChecklistEstimate {
  rateCardId: string | null;
  globalUpchargePercent: number;
  contingencyPercent: number;
  labor: {
    id: string;
    rateCardRoleId: string | null;
    rateSnapshot: string;
    quantity: number;
    units: number;
    billingPeriod: string;
    resourceName: string | null;
    allocationPercent: number;
    startDate: string | null;
    endDate: string | null;
  }[];
  nonLabor: { id: string; amount: string; billingPeriod: string }[];
  cloud: {
    id: string;
    cloudPriceId: string | null;
    unitPriceSnapshot: string;
    quantity: number;
    usageHoursPerMonth: number;
    region: string;
    skuOrInstance: string;
    billingPeriod: string;
  }[];
}

/**
 * An evaluator may name the specific offending line IDs (for deep-linking) and
 * may declare itself **not applicable** — e.g. a per-line rule on an estimate
 * that has no lines of that type yet. A not-applicable rule shows as an
 * actionable **"To do" (not started)** rather than a (vacuously) green pass, so
 * green still means "verified". Its message reads as the next step to take, so
 * the not-applicable branch returns an imperative to-do, not "nothing to check".
 */
type Evaluator = (e: ChecklistEstimate) => {
  passed: boolean;
  message: string;
  entityIds?: string[];
  applicable?: boolean;
};

/** Built-in rule logic, keyed by ChecklistRule.key (FR-25). Unknown keys pass. */
const EVALUATORS: Record<string, Evaluator> = {
  rate_card_selected: (e) => ({
    passed: e.rateCardId != null,
    message: e.rateCardId ? 'Rate card selected.' : 'Select a rate card for the estimate.',
  }),
  labor_role_assigned: (e) => {
    const bad = e.labor.filter(
      (l) => (!l.rateCardRoleId && Number(l.rateSnapshot) <= 0) || l.units <= 0 || l.quantity <= 0,
    );
    return {
      applicable: e.labor.length > 0,
      passed: bad.length === 0,
      message: !e.labor.length
        ? 'Add labor lines and assign each a role.'
        : bad.length
          ? `${bad.length} labor line(s) missing a role/rate, quantity or units.`
          : 'Every labor line has a role and quantity.',
      entityIds: bad.map((l) => l.id),
    };
  },
  cloud_line_complete: (e) => {
    const bad = e.cloud.filter(
      (c) =>
        !c.cloudPriceId ||
        Number(c.unitPriceSnapshot) <= 0 ||
        c.usageHoursPerMonth <= 0 ||
        !c.region ||
        !c.skuOrInstance,
    );
    return {
      applicable: e.cloud.length > 0,
      passed: bad.length === 0,
      message: !e.cloud.length
        ? 'Add cloud lines (provider, region, instance & usage).'
        : bad.length
          ? `${bad.length} cloud line(s) missing provider/region/instance/usage or price.`
          : 'Every cloud line is complete with a snapshotted price.',
      entityIds: bad.map((c) => c.id),
    };
  },
  nonlabor_amount_period: (e) => {
    const bad = e.nonLabor.filter((n) => Number(n.amount) <= 0 || !n.billingPeriod);
    return {
      applicable: e.nonLabor.length > 0,
      passed: bad.length === 0,
      message: !e.nonLabor.length
        ? 'Add non-labor lines with an amount and billing period.'
        : bad.length
          ? `${bad.length} non-labor line(s) missing an amount or billing period.`
          : 'Every non-labor line has an amount and billing period.',
      entityIds: bad.map((n) => n.id),
    };
  },
  billing_period_set: (e) => {
    const all = [...e.labor, ...e.nonLabor, ...e.cloud];
    const bad = all.filter((x) => !x.billingPeriod);
    return {
      applicable: all.length > 0,
      passed: bad.length === 0,
      message: !all.length
        ? 'Add line items (each needs a billing period).'
        : bad.length
          ? `${bad.length} line(s) missing a billing period.`
          : 'All lines have a billing period.',
      entityIds: bad.map((x) => x.id),
    };
  },
  // Upcharge/contingency only matter once there's something to mark up — until
  // the estimate has lines they're not-started "To do" (not a green pass on the
  // default 0), so a brand-new estimate shows nothing green. Once there are
  // lines the message shows the actual value rather than a vague "is set".
  upcharge_set: (e) => {
    const hasLines = e.labor.length + e.nonLabor.length + e.cloud.length > 0;
    return {
      applicable: hasLines,
      passed: e.globalUpchargePercent != null,
      message: hasLines
        ? `Global upcharge is ${e.globalUpchargePercent}%.`
        : 'Set a global upcharge % for the estimate (or leave it 0).',
    };
  },
  contingency_set: (e) => {
    const hasLines = e.labor.length + e.nonLabor.length + e.cloud.length > 0;
    return {
      applicable: hasLines,
      passed: e.contingencyPercent != null,
      message: hasLines
        ? `Contingency is ${e.contingencyPercent}%.`
        : 'Set a contingency % for the estimate (or leave it 0).',
    };
  },
  totals_reconcile: (e) => {
    const count = e.labor.length + e.nonLabor.length + e.cloud.length;
    return {
      passed: count > 0,
      message: count > 0 ? 'Estimate has line items.' : 'Add at least one line item.',
    };
  },
  resource_capacity: (e) => {
    const hasResources = e.labor.some((l) => l.resourceName);
    const violations = findCapacityViolations(
      e.labor.map((l) => ({
        resourceName: l.resourceName,
        allocationPercent: l.allocationPercent,
        startDate: l.startDate,
        endDate: l.endDate,
      })),
    );
    if (!violations.length) {
      return {
        applicable: hasResources,
        passed: true,
        message: hasResources
          ? 'No resource exceeds 100% on any date.'
          : 'Assign resources to labor lines (kept ≤100% per day).',
      };
    }
    const offending = new Set(violations.map((v) => v.resourceName));
    const entityIds = e.labor
      .filter((l) => l.resourceName && offending.has(l.resourceName))
      .map((l) => l.id);
    const v = violations[0];
    const more = violations.length > 1 ? ` (+${violations.length - 1} more)` : '';
    return {
      passed: false,
      message: `${v.resourceName} is over-allocated to ${v.totalPercent}% on ${v.date}${more}.`,
      entityIds,
    };
  },
};

/** Rule keys that have built-in evaluation logic; others are advisory (always pass). */
export const EVALUATOR_KEYS: string[] = Object.keys(EVALUATORS);

export function evaluateChecklist(
  rules: ChecklistRuleDef[],
  e: ChecklistEstimate,
): ChecklistResult {
  const items: ChecklistItemResult[] = rules.map((r) => {
    const evaluator = EVALUATORS[r.key];
    const res = evaluator ? evaluator(e) : { passed: true, message: r.description };
    return {
      key: r.key,
      description: r.description,
      severity: r.severity,
      scope: r.scope,
      passed: res.passed,
      message: res.message,
      entityIds: res.entityIds ?? [],
      applicable: res.applicable ?? true,
    };
  });
  // Only applicable rules count toward blocking/completeness — a rule with nothing
  // to check (a not-started "To do") neither blocks nor inflates progress.
  const blocking = items.some((i) => i.severity === 'BLOCKER' && i.applicable && !i.passed);
  const applicable = items.filter((i) => i.applicable);
  const passedCount = applicable.filter((i) => i.passed).length;
  return {
    passed: !blocking,
    blocking,
    completeness: applicable.length ? passedCount / applicable.length : 1,
    items,
  };
}
