import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { downloadCsv, downloadExcel } from '../lib/api';
import {
  useChecklist,
  useCloudPrices,
  useEstimate,
  useEstimateMutations,
  useBaselines,
  useRateCards,
  useReferenceValues,
  useScenarios,
  useWorkflow,
} from '../lib/queries';
import { SDLC_PHASES } from '../lib/types';
import { useCaseById, useCaseForChecklistKey } from '../lib/help-content';
import { useRefLabeler } from '../lib/refLabels';
import type {
  BillingPeriod,
  CapacityViolation,
  ChecklistResult,
  CloudPrice,
  EstimateDetail,
  EstimateWorkflow,
} from '../lib/types';

const PERIODS: BillingPeriod[] = ['ONE_TIME', 'MONTHLY', 'YEARLY'];

function Card({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={`rounded-xl border p-4 ${accent ? 'border-brand bg-teal-50' : 'border-slate-200 bg-white'}`}
    >
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function NumberSetting({
  label,
  value,
  onSave,
}: {
  label: string;
  value: number;
  onSave: (v: number) => void;
}) {
  const [v, setV] = useState(String(value));
  return (
    <label className="text-sm">
      <span className="text-slate-600">{label}</span>
      <input
        type="number"
        value={v}
        step="0.01"
        min="0"
        max="100"
        onChange={(e) => setV(e.target.value)}
        onBlur={() => {
          const n = Number.parseFloat(v);
          if (!Number.isNaN(n)) onSave(n);
        }}
        className="mt-1 block w-28 border border-slate-300 rounded px-2 py-1"
      />
    </label>
  );
}

function Section({ title, children, id }: { title: string; children: ReactNode; id?: string }) {
  return (
    <section
      id={id}
      className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 scroll-mt-20 transition-shadow"
    >
      <h2 className="font-semibold text-brand">{title}</h2>
      {children}
    </section>
  );
}

/** Where each checklist item is fixed — scroll the editor to that section + flash it. */
const CHECKLIST_ANCHOR: Record<string, string> = {
  rate_card_selected: 'sec-settings',
  upcharge_set: 'sec-settings',
  contingency_set: 'sec-settings',
  labor_role_assigned: 'sec-labor',
  resource_capacity: 'sec-labor',
  cloud_line_complete: 'sec-cloud',
  nonlabor_amount_period: 'sec-nonlabor',
  billing_period_set: 'sec-labor',
  totals_reconcile: 'sec-totals',
};
const SCOPE_ANCHOR: Record<string, string> = {
  ESTIMATE: 'sec-settings',
  LABOR: 'sec-labor',
  NONLABOR: 'sec-nonlabor',
  CLOUD: 'sec-cloud',
  RESOURCE: 'sec-labor',
};

function flash(el: HTMLElement, classes: string[], ms: number): void {
  el.classList.add(...classes);
  window.setTimeout(() => el.classList.remove(...classes), ms);
}

function goToChecklistItem(item: { key: string; scope: string; entityIds: string[] }): void {
  // Deep-link to the specific offending line(s) when the rule names them (FR-25);
  // otherwise fall back to the section where this kind of item is fixed.
  const rows = item.entityIds
    .map((eid) => document.getElementById(`line-${eid}`))
    .filter((el): el is HTMLElement => el != null);
  if (rows.length) {
    rows[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    rows.forEach((r) => flash(r, ['bg-amber-100', 'ring-2', 'ring-amber-400'], 2200));
    return;
  }
  const anchor = CHECKLIST_ANCHOR[item.key] ?? SCOPE_ANCHOR[item.scope] ?? 'sec-settings';
  const el = document.getElementById(anchor);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  flash(el, ['ring-2', 'ring-brand', 'ring-offset-2'], 1600);
}

export default function EstimateEditorPage() {
  const { id } = useParams<{ id: string }>();
  const { data: est, isLoading, error } = useEstimate(id);
  const m = useEstimateMutations(id ?? '');
  const { data: rateCards } = useRateCards();
  const { data: cloudPrices } = useCloudPrices();
  const { data: workflow } = useWorkflow(id);
  const {
    data: checklist,
    refetch: refetchChecklist,
    dataUpdatedAt: checklistCheckedAt,
    isFetching: checklistFetching,
  } = useChecklist(id);
  const { data: statuses } = useReferenceValues('ESTIMATE_STATUS');

  if (isLoading) return <p className="text-slate-500">Loading…</p>;
  if (error) return <p className="text-rose-700">{(error as Error).message}</p>;
  if (!est) return null;

  const t = est.totals;
  const cur = est.currency;
  const roles = (rateCards ?? []).flatMap((rc) =>
    rc.roles.map((r) => ({ id: r.id, label: `${r.roleName} (${rc.name}) — ${r.rate}/${r.unit}` })),
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <Link to="/" className="text-sm text-slate-500 hover:underline">
            ← Estimates
          </Link>
          <h1 className="text-2xl font-semibold">{est.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={est.status}
            onChange={(e) => m.patch.mutate({ status: e.target.value })}
            className="border border-slate-300 rounded px-2 py-1 text-sm"
          >
            {(statuses && statuses.length
              ? statuses
                  .filter((s) => s.isActive)
                  .map((s) => ({ code: s.code, label: s.displayName }))
              : [
                  { code: 'DRAFT', label: 'Draft' },
                  { code: 'FINAL', label: 'Final' },
                ]
            ).map((s) => (
              <option key={s.code} value={s.code}>
                {s.label}
              </option>
            ))}
          </select>
          <Link
            to={`/estimates/${est.id}/print`}
            className="border border-brand text-brand rounded px-3 py-1.5 text-sm font-medium hover:bg-teal-50"
          >
            Printable summary
          </Link>
          <button
            onClick={() => void downloadCsv(est.id, est.name)}
            className="bg-brand text-white rounded px-3 py-1.5 text-sm font-medium"
          >
            Export CSV
          </button>
          <button
            onClick={() => void downloadExcel(est.id, est.name)}
            className="bg-brand text-white rounded px-3 py-1.5 text-sm font-medium"
          >
            Export Excel
          </button>
        </div>
      </div>

      {/* Totals */}
      <div
        id="sec-totals"
        className="grid grid-cols-2 md:grid-cols-4 gap-3 rounded-xl scroll-mt-20 transition-shadow"
      >
        <Card label="One-time" value={`${t.oneTimeTotal} ${cur}`} />
        <Card label="Monthly" value={`${t.monthlyTotal} ${cur}`} />
        <Card label="Yearly" value={`${t.yearlyTotal} ${cur}`} />
        <Card label="Grand total (cost)" value={`${t.grandTotal} ${cur}`} />
      </div>
      {(est.marginPercent > 0 || est.taxPercent > 0) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card label="Margin" value={`${t.marginAmount} ${cur}`} />
          <Card label="Sell price" value={`${t.sellPrice} ${cur}`} />
          <Card label="Tax" value={`${t.taxAmount} ${cur}`} />
          <Card label="Client price" value={`${t.clientPrice} ${cur}`} accent />
        </div>
      )}

      {est.capacityViolations.length > 0 && <CapacityBanner violations={est.capacityViolations} />}

      <CategoryBreakdownSection categories={t.categories} cur={cur} />
      <PhaseBreakdownSection phases={t.phases} cur={cur} />

      <GovernanceSection
        workflow={workflow}
        checklist={checklist}
        m={m}
        onRecheck={() => refetchChecklist()}
        checkedAt={checklistCheckedAt}
        rechecking={checklistFetching}
      />

      <ScenariosSection est={est} m={m} />

      <BaselinesSection est={est} m={m} />

      <Section title="Settings" id="sec-settings">
        <div className="flex flex-wrap gap-6 items-end">
          <label className="text-sm">
            <span className="text-slate-600">Rate card</span>
            <select
              value={est.rateCardId ?? ''}
              onChange={(e) => m.patch.mutate({ rateCardId: e.target.value || null })}
              className="mt-1 block border border-slate-300 rounded px-2 py-1 min-w-56"
            >
              <option value="">— none —</option>
              {(rateCards ?? []).map((rc) => (
                <option key={rc.id} value={rc.id}>
                  {rc.name} ({rc.currency})
                </option>
              ))}
            </select>
          </label>
          <NumberSetting
            label="Global upcharge %"
            value={est.globalUpchargePercent}
            onSave={(v) => m.patch.mutate({ globalUpchargePercent: v })}
          />
          <NumberSetting
            label="Contingency %"
            value={est.contingencyPercent}
            onSave={(v) => m.patch.mutate({ contingencyPercent: v })}
          />
          <NumberSetting
            label="Margin %"
            value={est.marginPercent}
            onSave={(v) => m.patch.mutate({ marginPercent: v })}
          />
          <NumberSetting
            label="Tax %"
            value={est.taxPercent}
            onSave={(v) => m.patch.mutate({ taxPercent: v })}
          />
          <div className="text-sm text-slate-500">
            Upcharge {t.upchargeAmount} · Contingency {t.contingencyAmount} {cur}
          </div>
        </div>
      </Section>

      <LaborSection est={est} roles={roles} m={m} />
      <NonLaborSection est={est} m={m} />
      <CloudSection est={est} prices={cloudPrices ?? []} m={m} />
      <AssumptionsSection est={est} m={m} />
      <CommentsSection est={est} m={m} />
    </div>
  );
}

type Mutations = ReturnType<typeof useEstimateMutations>;

function GovernanceSection({
  workflow,
  checklist,
  m,
  onRecheck,
  checkedAt,
  rechecking,
}: {
  workflow: EstimateWorkflow | undefined;
  checklist: ChecklistResult | undefined;
  m: Mutations;
  onRecheck: () => void;
  checkedAt: number;
  rechecking: boolean;
}) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Section title="Approval workflow">
        <div className="text-sm">
          <span className="text-slate-500">Current stage:</span>{' '}
          <span className="font-medium text-brand">{workflow?.currentStageLabel ?? '—'}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(workflow?.availableTransitions ?? []).map((tr) => {
            const disabled = !tr.allowedForUser || tr.blockedByChecklist;
            const reason = tr.blockedByChecklist
              ? 'Blocked by the checklist'
              : !tr.allowedForUser
                ? `Requires the ${tr.allowedRole} role`
                : '';
            return (
              <button
                key={tr.toStageKey}
                disabled={disabled}
                title={reason}
                onClick={() => m.transition.mutate({ toStageKey: tr.toStageKey })}
                className="bg-brand text-white rounded px-3 py-1.5 text-sm disabled:opacity-40"
              >
                {tr.label}
              </button>
            );
          })}
          {(workflow?.availableTransitions.length ?? 0) === 0 && (
            <span className="text-slate-400 text-sm">No transitions from here.</span>
          )}
        </div>
        {workflow && workflow.history.length > 0 && (
          <ul className="text-xs text-slate-500 space-y-0.5 pt-2 border-t border-slate-100">
            {workflow.history.map((h) => (
              <li key={h.id}>
                {(h.fromStageKey ?? 'start') + ' → ' + h.toStageKey} ·{' '}
                {new Date(h.occurredAt).toLocaleString()}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Smart checklist">
        {checklist && (
          <>
            <div className="text-sm flex items-center gap-2 flex-wrap">
              <span className={checklist.blocking ? 'text-rose-700' : 'text-emerald-700'}>
                {checklist.blocking ? 'Blocking items present' : 'All blocking checks pass'}
              </span>
              <span className="text-slate-400">
                · {Math.round(checklist.completeness * 100)}% complete
              </span>
              <span className="ml-auto text-xs text-slate-400">
                {checkedAt > 0 ? `checked ${new Date(checkedAt).toLocaleTimeString()}` : ''}
              </span>
              <button
                onClick={onRecheck}
                disabled={rechecking}
                title="Re-evaluate the checklist now"
                className="text-xs text-brand hover:underline disabled:opacity-50"
              >
                {rechecking ? 'Re-checking…' : '↻ Re-check'}
              </button>
            </div>
            {checklist.items.length === 0 && (
              <div className="text-sm text-slate-500 flex items-center gap-2">
                <span>No checklist items match this estimate yet.</span>
                <Link
                  to="/help#uc-smart-checklist"
                  title="How the smart checklist works"
                  className="shrink-0 text-xs text-brand hover:underline px-1 py-0.5"
                >
                  How?
                </Link>
              </div>
            )}
            <ul className="text-sm space-y-1">
              {checklist.items.map((i) => {
                // A rule with nothing to check yet (no lines of its type) is N/A —
                // shown muted, not as a (vacuous) green pass and with nothing to fix.
                if (!i.applicable) {
                  return (
                    <li
                      key={i.key}
                      className="flex items-start gap-2 px-1 py-0.5 text-slate-400"
                      title="Nothing to check yet"
                    >
                      <span className="text-slate-300">–</span>
                      <span>{i.message}</span>
                      <span className="ml-auto text-[10px] uppercase tracking-wide text-slate-300">
                        N/A
                      </span>
                    </li>
                  );
                }
                // Failing items deep-link to their specific guide; if no guide
                // matches the rule key, fall back to the general checklist guide.
                const guide = !i.passed
                  ? (useCaseForChecklistKey(i.key) ?? useCaseById('smart-checklist'))
                  : undefined;
                return (
                  <li key={i.key} className="flex items-start gap-1">
                    <button
                      onClick={() => goToChecklistItem(i)}
                      title="Go to where to fix this"
                      className="flex-1 flex items-start gap-2 text-left rounded hover:bg-slate-50 px-1 py-0.5 group"
                    >
                      <span
                        className={
                          i.passed
                            ? 'text-emerald-600'
                            : i.severity === 'BLOCKER'
                              ? 'text-rose-600'
                              : 'text-amber-600'
                        }
                      >
                        {i.passed ? '✓' : '✕'}
                      </span>
                      <span className="text-slate-600 group-hover:text-slate-900 group-hover:underline">
                        {i.message}
                      </span>
                      <span className="ml-auto text-slate-300 group-hover:text-brand">→</span>
                    </button>
                    {guide && (
                      <Link
                        to={`/help#uc-${guide.id}`}
                        title={`How to fix: ${guide.title}`}
                        className="shrink-0 text-xs text-brand hover:underline px-1 py-0.5"
                      >
                        How?
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
            {checklist.items.length > 0 && (
              <p className="text-xs text-slate-400">
                Tip: click an item to jump to where it’s fixed, or “How?” for a step-by-step guide.
              </p>
            )}
          </>
        )}
      </Section>
    </div>
  );
}

function CapacityBanner({ violations }: { violations: CapacityViolation[] }) {
  return (
    <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm" role="alert">
      <div className="font-semibold text-rose-800">Resource over-allocation (FR-27)</div>
      <ul className="mt-1 space-y-0.5 text-rose-700">
        {violations.map((v) => (
          <li key={`${v.resourceName}-${v.date}`}>
            <span className="font-medium">{v.resourceName}</span> is allocated {v.totalPercent}% on{' '}
            {v.date} (max 100%).
          </li>
        ))}
      </ul>
    </div>
  );
}

function PhaseBreakdownSection({
  phases,
  cur,
}: {
  phases: EstimateDetail['totals']['phases'];
  cur: string;
}) {
  if (phases.length === 0) return null;
  return (
    <Section title="Cost by SDLC phase">
      <table className="w-full text-sm">
        <thead className="text-slate-500">
          <tr>
            <Th>Phase</Th>
            <Th right>One-time</Th>
            <Th right>Monthly</Th>
            <Th right>Yearly</Th>
          </tr>
        </thead>
        <tbody>
          {phases.map((p) => (
            <tr key={p.phase} className="border-t border-slate-100">
              <td className="px-3 py-2 font-medium">{p.phase}</td>
              <td className="px-3 py-2 text-right tabular-nums">
                {p.oneTime} {cur}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {p.monthly} {cur}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {p.yearly} {cur}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}

function CategoryBreakdownSection({
  categories,
  cur,
}: {
  categories: EstimateDetail['totals']['categories'];
  cur: string;
}) {
  if (categories.length === 0) return null;
  return (
    <Section title="Cost by category">
      <table className="w-full text-sm">
        <thead className="text-slate-500">
          <tr>
            <Th>Category</Th>
            <Th right>One-time</Th>
            <Th right>Monthly</Th>
            <Th right>Yearly</Th>
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c.category} className="border-t border-slate-100">
              <td className="px-3 py-2 font-medium">{c.category}</td>
              <td className="px-3 py-2 text-right tabular-nums">
                {c.oneTime} {cur}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {c.monthly} {cur}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {c.yearly} {cur}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}

function Th({ children, right }: { children: ReactNode; right?: boolean }) {
  return (
    <th className={`px-3 py-2 font-medium ${right ? 'text-right' : 'text-left'}`}>{children}</th>
  );
}

function PeriodSelect({
  value,
  onChange,
}: {
  value: BillingPeriod;
  onChange: (v: BillingPeriod) => void;
}) {
  // Labels come from the DB-driven BILLING_PERIOD reference type (FR-29); the
  // stored value stays the code. Falls back to the built-in codes.
  const billing = useRefLabeler('BILLING_PERIOD');
  const opts = billing.options.length
    ? billing.options
    : PERIODS.map((p) => ({ code: p, label: p }));
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as BillingPeriod)}
      className="border border-slate-300 rounded px-2 py-1 text-sm"
    >
      {opts.map((o) => (
        <option key={o.code} value={o.code}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function SdlcSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  // Options + labels come from the DB-driven SDLC_PHASE reference data (FR-29);
  // any active value is selectable (the column is a plain code now). Falls back
  // to the built-in codes only until that request resolves.
  const { data } = useReferenceValues('SDLC_PHASE');
  const fromApi = (data ?? [])
    .filter((r) => r.isActive)
    .map((r) => ({ code: r.code, label: r.displayName }));
  const options = fromApi.length ? fromApi : SDLC_PHASES.map((p) => ({ code: p, label: p }));
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border border-slate-300 rounded px-2 py-1 text-sm"
      title="SDLC phase"
    >
      <option value="">Phase…</option>
      {options.map((o) => (
        <option key={o.code} value={o.code}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/** Short '7/01–7/31' window for a labor line (FR-27). */
function fmtWindow(start: string | null, end: string | null): string {
  if (!start || !end) return '—';
  const d = (iso: string) => {
    const [, m, day] = iso.split('-');
    return `${Number(m)}/${day}`;
  };
  return `${d(start)}–${d(end)}`;
}

function LaborSection({
  est,
  roles,
  m,
}: {
  est: EstimateDetail;
  roles: { id: string; label: string }[];
  m: Mutations;
}) {
  const billing = useRefLabeler('BILLING_PERIOD');
  const [roleId, setRoleId] = useState('');
  const [units, setUnits] = useState('1');
  const [quantity, setQuantity] = useState('1');
  const [period, setPeriod] = useState<BillingPeriod>('ONE_TIME');
  const [phase, setPhase] = useState<string>('');
  const [resourceName, setResourceName] = useState('');
  const [allocation, setAllocation] = useState('100');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  // Three-point / PERT estimate (FR-13): all three → effective units = PERT.
  const [opt, setOpt] = useState('');
  const [likely, setLikely] = useState('');
  const [pess, setPess] = useState('');

  function add() {
    if (!roleId) return;
    const body: Record<string, unknown> = {
      rateCardRoleId: roleId,
      units: Number.parseFloat(units) || 0,
      quantity: Number.parseFloat(quantity) || 1,
      billingPeriod: period,
    };
    if (phase) body.sdlcPhase = phase;
    if (resourceName.trim()) {
      body.resourceName = resourceName.trim();
      body.allocationPercent = Number.parseFloat(allocation) || 100;
    }
    if (startDate && endDate) {
      body.startDate = startDate;
      body.endDate = endDate;
    }
    if (opt && likely && pess) {
      body.unitsOptimistic = Number.parseFloat(opt) || 0;
      body.unitsMostLikely = Number.parseFloat(likely) || 0;
      body.unitsPessimistic = Number.parseFloat(pess) || 0;
    }
    m.addLabor.mutate(body, { onSuccess: () => setRoleId('') });
  }

  return (
    <Section title="Labor" id="sec-labor">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-slate-500">
            <tr>
              <Th>Role</Th>
              <Th>Resource</Th>
              <Th right>Alloc</Th>
              <Th>Window</Th>
              <Th>Phase</Th>
              <Th right>Qty</Th>
              <Th right>Units</Th>
              <Th right>Rate</Th>
              <Th>Billing</Th>
              <Th right>Line total</Th>
              <Th>{''}</Th>
            </tr>
          </thead>
          <tbody>
            {est.laborItems.map((l) => (
              <tr
                key={l.id}
                id={`line-${l.id}`}
                className="border-t border-slate-100 scroll-mt-24 transition-colors"
              >
                <td className="px-3 py-2">{l.roleName ?? l.description ?? '—'}</td>
                <td className="px-3 py-2">{l.resourceName ?? '—'}</td>
                <td className="px-3 py-2 text-right tabular-nums">{l.allocationPercent}%</td>
                <td className="px-3 py-2 whitespace-nowrap">{fmtWindow(l.startDate, l.endDate)}</td>
                <td className="px-3 py-2">{l.sdlcPhase ?? '—'}</td>
                <td className="px-3 py-2 text-right tabular-nums">{l.quantity}</td>
                <td className="px-3 py-2 text-right tabular-nums">{l.units}</td>
                <td className="px-3 py-2 text-right tabular-nums">{l.rateSnapshot}</td>
                <td className="px-3 py-2">{billing.label(l.billingPeriod)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{l.lineTotal}</td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => m.delLabor.mutate(l.id)}
                    className="text-rose-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-slate-100">
        <select
          value={roleId}
          onChange={(e) => setRoleId(e.target.value)}
          className="border border-slate-300 rounded px-2 py-1 text-sm min-w-56"
        >
          <option value="">Select role…</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
        <input
          value={resourceName}
          onChange={(e) => setResourceName(e.target.value)}
          className="border border-slate-300 rounded px-2 py-1 text-sm w-36"
          placeholder="resource (optional)"
        />
        <input
          value={allocation}
          onChange={(e) => setAllocation(e.target.value)}
          type="number"
          min="0"
          max="100"
          className="border border-slate-300 rounded px-2 py-1 text-sm w-20"
          title="Allocation %"
          placeholder="alloc %"
        />
        <input
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          type="date"
          className="border border-slate-300 rounded px-2 py-1 text-sm"
          title="Start date"
        />
        <input
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          type="date"
          className="border border-slate-300 rounded px-2 py-1 text-sm"
          title="End date"
        />
        <SdlcSelect value={phase} onChange={setPhase} />
        <input
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          type="number"
          className="border border-slate-300 rounded px-2 py-1 text-sm w-20"
          placeholder="qty"
        />
        <input
          value={units}
          onChange={(e) => setUnits(e.target.value)}
          type="number"
          className="border border-slate-300 rounded px-2 py-1 text-sm w-24"
          placeholder="units"
        />
        <span className="text-slate-400 text-xs" title="Optional three-point (PERT) estimate">
          PERT:
        </span>
        <input
          value={opt}
          onChange={(e) => setOpt(e.target.value)}
          type="number"
          className="border border-slate-300 rounded px-2 py-1 text-sm w-16"
          placeholder="opt"
          title="Optimistic units"
        />
        <input
          value={likely}
          onChange={(e) => setLikely(e.target.value)}
          type="number"
          className="border border-slate-300 rounded px-2 py-1 text-sm w-16"
          placeholder="likely"
          title="Most-likely units"
        />
        <input
          value={pess}
          onChange={(e) => setPess(e.target.value)}
          type="number"
          className="border border-slate-300 rounded px-2 py-1 text-sm w-16"
          placeholder="pess"
          title="Pessimistic units"
        />
        <PeriodSelect value={period} onChange={setPeriod} />
        <button
          onClick={add}
          disabled={!roleId}
          className="bg-slate-800 text-white rounded px-3 py-1 text-sm disabled:opacity-50"
        >
          Add labor
        </button>
      </div>
      {m.addLabor.isError && (
        <p className="text-rose-700 text-sm" role="alert">
          {(m.addLabor.error as Error).message}
        </p>
      )}
    </Section>
  );
}

function NonLaborSection({ est, m }: { est: EstimateDetail; m: Mutations }) {
  const billing = useRefLabeler('BILLING_PERIOD');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<BillingPeriod>('ONE_TIME');
  const [phase, setPhase] = useState<string>('');
  // Cost categories are governed (FR-29, FE-11): pick from the COST_CATEGORY reference list.
  const { data: categories } = useReferenceValues('COST_CATEGORY');
  const catOptions = (categories ?? []).filter((c) => c.isActive).map((c) => c.displayName);

  function add() {
    if (!category.trim() || !amount) return;
    m.addNonLabor.mutate({
      category,
      amount,
      type: period === 'ONE_TIME' ? 'FIXED' : 'RECURRING',
      billingPeriod: period,
      periods: 1,
      ...(phase ? { sdlcPhase: phase } : {}),
    });
    setCategory('');
    setAmount('');
  }

  return (
    <Section title="Non-labor" id="sec-nonlabor">
      <table className="w-full text-sm">
        <thead className="text-slate-500">
          <tr>
            <Th>Category</Th>
            <Th right>Amount</Th>
            <Th>Billing</Th>
            <Th>Phase</Th>
            <Th right>Line total</Th>
            <Th>{''}</Th>
          </tr>
        </thead>
        <tbody>
          {est.nonLaborItems.map((n) => (
            <tr
              key={n.id}
              id={`line-${n.id}`}
              className="border-t border-slate-100 scroll-mt-24 transition-colors"
            >
              <td className="px-3 py-2">{n.category}</td>
              <td className="px-3 py-2 text-right tabular-nums">{n.amount}</td>
              <td className="px-3 py-2">{billing.label(n.billingPeriod)}</td>
              <td className="px-3 py-2">{n.sdlcPhase ?? '—'}</td>
              <td className="px-3 py-2 text-right tabular-nums">{n.lineTotal}</td>
              <td className="px-3 py-2 text-right">
                <button
                  onClick={() => m.delNonLabor.mutate(n.id)}
                  className="text-rose-600 hover:underline"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-slate-100">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border border-slate-300 rounded px-2 py-1 text-sm"
          title="Cost category"
        >
          <option value="">Category…</option>
          {catOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          type="number"
          className="border border-slate-300 rounded px-2 py-1 text-sm w-32"
          placeholder="amount"
        />
        <PeriodSelect value={period} onChange={setPeriod} />
        <SdlcSelect value={phase} onChange={setPhase} />
        <button
          onClick={add}
          disabled={!category.trim() || !amount}
          className="bg-slate-800 text-white rounded px-3 py-1 text-sm disabled:opacity-50"
        >
          Add non-labor
        </button>
      </div>
    </Section>
  );
}

function CloudSection({
  est,
  prices,
  m,
}: {
  est: EstimateDetail;
  prices: CloudPrice[];
  m: Mutations;
}) {
  const provider = useRefLabeler('CLOUD_PROVIDER');
  const [priceId, setPriceId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [hours, setHours] = useState('730');
  const [phase, setPhase] = useState<string>('');

  function add() {
    if (!priceId) return;
    m.addCloud.mutate({
      cloudPriceId: priceId,
      quantity: Number.parseFloat(quantity) || 1,
      usageHoursPerMonth: Number.parseFloat(hours) || 730,
      billingPeriod: 'MONTHLY',
      ...(phase ? { sdlcPhase: phase } : {}),
    });
    setPriceId('');
  }

  return (
    <Section title="Cloud compute" id="sec-cloud">
      <table className="w-full text-sm">
        <thead className="text-slate-500">
          <tr>
            <Th>Provider / Instance</Th>
            <Th right>Qty</Th>
            <Th right>Usage/mo</Th>
            <Th right>Unit price</Th>
            <Th>Phase</Th>
            <Th right>Line total</Th>
            <Th>{''}</Th>
          </tr>
        </thead>
        <tbody>
          {est.cloudItems.map((c) => (
            <tr
              key={c.id}
              id={`line-${c.id}`}
              className="border-t border-slate-100 scroll-mt-24 transition-colors"
            >
              <td className="px-3 py-2">
                {provider.label(c.provider)} · {c.skuOrInstance}{' '}
                <span className="text-slate-400">({c.region})</span>
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{c.quantity}</td>
              <td className="px-3 py-2 text-right tabular-nums">{c.usageHoursPerMonth}</td>
              <td className="px-3 py-2 text-right tabular-nums">{c.unitPriceSnapshot}</td>
              <td className="px-3 py-2">{c.sdlcPhase ?? '—'}</td>
              <td className="px-3 py-2 text-right tabular-nums">{c.lineTotal}</td>
              <td className="px-3 py-2 text-right">
                <button
                  onClick={() => m.delCloud.mutate(c.id)}
                  className="text-rose-600 hover:underline"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-slate-100">
        <select
          value={priceId}
          onChange={(e) => setPriceId(e.target.value)}
          className="border border-slate-300 rounded px-2 py-1 text-sm min-w-72"
        >
          <option value="">Select cloud resource…</option>
          {Object.entries(
            prices.reduce<Record<string, CloudPrice[]>>((acc, p) => {
              (acc[p.category] ??= []).push(p);
              return acc;
            }, {}),
          )
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([cat, items]) => (
              <optgroup key={cat} label={cat}>
                {items.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.provider} · {p.service} {p.skuOrInstance} ({p.region}) — {p.unitPrice}/
                    {p.unit}
                  </option>
                ))}
              </optgroup>
            ))}
        </select>
        <input
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          type="number"
          className="border border-slate-300 rounded px-2 py-1 text-sm w-20"
          placeholder="qty"
        />
        <input
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          type="number"
          className="border border-slate-300 rounded px-2 py-1 text-sm w-24"
          placeholder="usage/mo"
          title="Usage units per month — hours for compute, or GB / requests / seats / 1 month for other units"
        />
        <SdlcSelect value={phase} onChange={setPhase} />
        <button
          onClick={add}
          disabled={!priceId}
          className="bg-slate-800 text-white rounded px-3 py-1 text-sm disabled:opacity-50"
        >
          Add cloud
        </button>
      </div>
    </Section>
  );
}

function BaselinesSection({ est, m }: { est: EstimateDetail; m: Mutations }) {
  const { data: baselines } = useBaselines(est.id);
  const [label, setLabel] = useState('');
  const cur = est.currency;
  const currentGrand = Number(est.totals.grandTotal);
  function capture() {
    if (!label.trim()) return;
    m.captureBaseline.mutate({ label: label.trim() }, { onSuccess: () => setLabel('') });
  }
  const delta = (base: string) => {
    const d = currentGrand - Number(base);
    const sign = d > 0 ? '+' : '';
    return `${sign}${d.toFixed(4)}`;
  };
  return (
    <Section title="Baselines & versions">
      <div className="flex gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="border border-slate-300 rounded px-2 py-1 text-sm flex-1"
          placeholder="Baseline label (e.g. v1 approved)"
        />
        <button
          onClick={capture}
          disabled={!label.trim()}
          className="bg-slate-800 text-white rounded px-3 py-1 text-sm disabled:opacity-50"
        >
          Capture baseline
        </button>
      </div>
      {baselines && baselines.length > 0 && (
        <table className="w-full text-sm">
          <thead className="text-slate-500 text-left">
            <tr>
              <th className="px-2 py-1">Label</th>
              <th className="px-2 py-1">Captured</th>
              <th className="px-2 py-1 text-right">Grand total</th>
              <th className="px-2 py-1 text-right">Δ vs current</th>
              <th className="px-2 py-1"></th>
            </tr>
          </thead>
          <tbody>
            {baselines.map((b) => {
              const d = currentGrand - Number(b.grandTotal);
              return (
                <tr key={b.id} className="border-t border-slate-100">
                  <td className="px-2 py-1">{b.label}</td>
                  <td className="px-2 py-1 text-xs text-slate-500">
                    {b.createdByEmail} · {new Date(b.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-2 py-1 text-right tabular-nums">
                    {b.grandTotal} {cur}
                  </td>
                  <td
                    className={`px-2 py-1 text-right tabular-nums ${
                      d > 0 ? 'text-rose-700' : d < 0 ? 'text-emerald-700' : 'text-slate-400'
                    }`}
                  >
                    {delta(b.grandTotal)} {cur}
                  </td>
                  <td className="px-2 py-1 text-right">
                    <button
                      onClick={() => m.delBaseline.mutate(b.id)}
                      className="text-rose-600 hover:underline text-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </Section>
  );
}

function ScenariosSection({ est, m }: { est: EstimateDetail; m: Mutations }) {
  const { data: scenarios } = useScenarios(est.id);
  const list = scenarios ?? [];
  // Only show the panel once there's a group (more than just this estimate).
  if (list.length <= 1 && !m.createScenario.isPending) {
    return (
      <Section title="Scenarios">
        <div className="flex items-center justify-between">
          <span className="text-slate-500 text-sm">
            Create variants of this estimate to compare options.
          </span>
          <button
            onClick={() => m.createScenario.mutate(undefined)}
            className="bg-slate-800 text-white rounded px-3 py-1 text-sm"
          >
            Create scenario
          </button>
        </div>
      </Section>
    );
  }
  return (
    <Section title="Scenarios — compare">
      <table className="w-full text-sm">
        <thead className="text-slate-500 text-left">
          <tr>
            <th className="px-2 py-1">Name</th>
            <th className="px-2 py-1">Status</th>
            <th className="px-2 py-1 text-right">Grand total (cost)</th>
            <th className="px-2 py-1 text-right">Client price</th>
          </tr>
        </thead>
        <tbody>
          {list.map((s) => (
            <tr
              key={s.id}
              className={`border-t border-slate-100 ${s.isCurrent ? 'bg-teal-50' : ''}`}
            >
              <td className="px-2 py-1">
                <Link to={`/estimates/${s.id}`} className="text-brand hover:underline">
                  {s.name}
                </Link>
                {s.isRoot && <span className="text-slate-400 text-xs"> · base</span>}
              </td>
              <td className="px-2 py-1">{s.status}</td>
              <td className="px-2 py-1 text-right tabular-nums">
                {s.grandTotal} {s.currency}
              </td>
              <td className="px-2 py-1 text-right tabular-nums">
                {s.clientPrice} {s.currency}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        onClick={() => m.createScenario.mutate(undefined)}
        className="bg-slate-800 text-white rounded px-3 py-1 text-sm"
      >
        Create another scenario
      </button>
    </Section>
  );
}

function CommentsSection({ est, m }: { est: EstimateDetail; m: Mutations }) {
  const [text, setText] = useState('');
  function add() {
    if (!text.trim()) return;
    m.addComment.mutate({ text }, { onSuccess: () => setText('') });
  }
  return (
    <Section title="Comments">
      <ul className="space-y-2 text-sm">
        {est.comments.map((c) => (
          <li key={c.id} className="border-b border-slate-100 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {c.authorEmail} · {new Date(c.createdAt).toLocaleString()}
              </span>
              <button
                onClick={() => m.delComment.mutate(c.id)}
                className="text-rose-600 hover:underline text-xs"
              >
                Delete
              </button>
            </div>
            <div className="whitespace-pre-wrap">{c.text}</div>
          </li>
        ))}
        {est.comments.length === 0 && <li className="text-slate-400">No comments yet.</li>}
      </ul>
      <div className="flex gap-2 pt-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') add();
          }}
          className="border border-slate-300 rounded px-2 py-1 text-sm flex-1"
          placeholder="Add a comment…"
        />
        <button
          onClick={add}
          disabled={!text.trim()}
          className="bg-slate-800 text-white rounded px-3 py-1 text-sm disabled:opacity-50"
        >
          Comment
        </button>
      </div>
    </Section>
  );
}

function AssumptionsSection({ est, m }: { est: EstimateDetail; m: Mutations }) {
  const [text, setText] = useState('');
  function add() {
    if (!text.trim()) return;
    m.addAssumption.mutate({ text });
    setText('');
  }
  return (
    <Section title="Assumptions & notes">
      <ul className="space-y-1 text-sm">
        {est.assumptions.map((a) => (
          <li
            key={a.id}
            className="flex items-center justify-between border-b border-slate-100 py-1"
          >
            <span>{a.text}</span>
            <button
              onClick={() => m.delAssumption.mutate(a.id)}
              className="text-rose-600 hover:underline text-xs"
            >
              Delete
            </button>
          </li>
        ))}
        {est.assumptions.length === 0 && <li className="text-slate-400">None yet.</li>}
      </ul>
      <div className="flex gap-2 pt-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="border border-slate-300 rounded px-2 py-1 text-sm flex-1"
          placeholder="Add an assumption…"
        />
        <button
          onClick={add}
          disabled={!text.trim()}
          className="bg-slate-800 text-white rounded px-3 py-1 text-sm disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </Section>
  );
}
