import { Fragment, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSow } from '../lib/queries';
import { sowFlavorLabel } from '../lib/types';
import { formatMoney } from '../lib/money';

/** Official, print-ready Statement of Work — "Save as PDF" via the browser (BR-7).
 *  The layout adapts to the SOW's template flavor: Concise trims the heavy sections,
 *  Proposal leads pricing with a subscription table, and Time & Materials shows a
 *  team-&-rates table with a not-to-exceed. */
export default function SowPrintPage() {
  const { id } = useParams<{ id: string }>();
  const { data: sow, isLoading, error } = useSow(id);

  if (isLoading) return <p className="text-slate-500">Loading…</p>;
  if (error) return <p className="text-rose-700">{(error as Error).message}</p>;
  if (!sow) return null;

  const cur = sow.currency;
  const money = (v: string) => formatMoney(v, cur);
  const p = sow.pricing;
  const flavor = sow.flavor;

  // ── Deliverables & milestone schedule (all flavors) ────────────────────────
  const renderDeliverables = (n: number): ReactNode => (
    <section className="mt-5 break-inside-avoid">
      <h2 className="font-semibold border-b border-slate-300 mb-1 text-sm uppercase tracking-wide">
        {n}. Deliverables &amp; Milestone Schedule
      </h2>
      <p className="text-sm whitespace-pre-wrap leading-relaxed">{sow.deliverables || '—'}</p>
      {p.phases.length > 0 && (
        <table className="w-full text-sm mt-3">
          <thead>
            <tr className="text-slate-500 text-left border-b border-slate-300">
              <th className="py-1">Phase / Milestone</th>
              <th className="py-1 text-right">Milestone fee (one-time)</th>
              <th className="py-1 text-right">Recurring (monthly)</th>
              <th className="py-1 text-right">Recurring (yearly)</th>
            </tr>
          </thead>
          <tbody>
            {p.phases.map((ph) => (
              <tr key={ph.phase} className="border-t border-slate-100">
                <td className="py-1">{ph.phase}</td>
                <td className="py-1 text-right tabular-nums">{money(ph.oneTime)}</td>
                <td className="py-1 text-right tabular-nums">{money(ph.monthly)}</td>
                <td className="py-1 text-right tabular-nums">{money(ph.yearly)}</td>
              </tr>
            ))}
            <tr className="border-t border-slate-300 font-semibold">
              <td className="py-1">Total</td>
              <td className="py-1 text-right tabular-nums">{money(p.oneTimeSubtotal)}</td>
              <td className="py-1 text-right tabular-nums">{money(p.monthlySubtotal)}</td>
              <td className="py-1 text-right tabular-nums">{money(p.yearlySubtotal)}</td>
            </tr>
          </tbody>
        </table>
      )}
      <p className="text-xs text-slate-400 mt-1">
        Each completed phase is a billable milestone: the one-time milestone fee is invoiced upon
        the Client&apos;s acceptance of that phase&apos;s deliverables. Recurring amounts bill on
        their stated cadence. Phase amounts exclude the project contingency.
      </p>
    </section>
  );

  // ── Pricing — flavor-aware ─────────────────────────────────────────────────
  const lineItemsTable = (
    <>
      <p className="text-xs font-medium text-slate-500 mt-2 mb-1">Estimate detail (line items)</p>
      <table className="w-full text-sm mb-4">
        <thead>
          <tr className="text-slate-500 text-left border-b border-slate-300">
            <th className="py-1">Item</th>
            <th className="py-1">Category</th>
            <th className="py-1 text-right">Qty</th>
            <th className="py-1 text-right">Rate / amount</th>
            <th className="py-1">Billing</th>
            <th className="py-1 text-right">Line total</th>
          </tr>
        </thead>
        <tbody>
          {sow.lineItems.map((li, i) => (
            <tr key={i} className="border-t border-slate-100">
              <td className="py-1">{li.item}</td>
              <td className="py-1 text-slate-500">{li.category}</td>
              <td className="py-1 text-right tabular-nums">{li.quantity}</td>
              <td className="py-1 text-right tabular-nums">{money(li.unitPrice)}</td>
              <td className="py-1 text-slate-500">{li.billingPeriod.toLowerCase()}</td>
              <td className="py-1 text-right tabular-nums">{money(li.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );

  const categoryTable = p.categories.length > 0 && (
    <>
      <p className="text-xs font-medium text-slate-500 mt-2 mb-1">
        Cost breakdown by category (post-upcharge, pre-contingency)
      </p>
      <table className="w-full text-sm mb-4">
        <thead>
          <tr className="text-slate-500 text-left border-b border-slate-300">
            <th className="py-1">Cost category</th>
            <th className="py-1 text-right">One-time</th>
            <th className="py-1 text-right">Monthly</th>
            <th className="py-1 text-right">Yearly</th>
          </tr>
        </thead>
        <tbody>
          {p.categories.map((c) => (
            <tr key={c.category} className="border-t border-slate-100">
              <td className="py-1">{c.category}</td>
              <td className="py-1 text-right tabular-nums">{money(c.oneTime)}</td>
              <td className="py-1 text-right tabular-nums">{money(c.monthly)}</td>
              <td className="py-1 text-right tabular-nums">{money(c.yearly)}</td>
            </tr>
          ))}
          <tr className="border-t border-slate-300 font-semibold">
            <td className="py-1">Subtotal</td>
            <td className="py-1 text-right tabular-nums">{money(p.oneTimeSubtotal)}</td>
            <td className="py-1 text-right tabular-nums">{money(p.monthlySubtotal)}</td>
            <td className="py-1 text-right tabular-nums">{money(p.yearlySubtotal)}</td>
          </tr>
        </tbody>
      </table>
    </>
  );

  const fullTotals = (
    <table className="w-full text-sm">
      <tbody>
        <Row label="One-time total" value={money(p.oneTimeTotal)} />
        <Row label="Monthly total" value={money(p.monthlyTotal)} />
        <Row label="Yearly total (annualized)" value={money(p.yearlyTotal)} />
        <Row label="Upcharge" value={money(p.upchargeAmount)} />
        <Row label="Contingency" value={money(p.contingencyAmount)} />
        <Row label="Grand total (cost)" value={money(p.grandTotal)} strong />
        <Row label="Total price to Client" value={money(p.clientPrice)} strong />
      </tbody>
    </table>
  );

  const renderPricing = (n: number): ReactNode => (
    <section className="mt-5">
      <h2 className="font-semibold border-b border-slate-300 mb-1 text-sm uppercase tracking-wide">
        {n}. Pricing
      </h2>

      {flavor === 'TIME_MATERIALS' && (
        <>
          <p className="text-xs font-medium text-slate-500 mt-2 mb-1">Team &amp; rates</p>
          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="text-slate-500 text-left border-b border-slate-300">
                <th className="py-1">Role / item</th>
                <th className="py-1">Category</th>
                <th className="py-1 text-right">Qty × units</th>
                <th className="py-1 text-right">Rate</th>
                <th className="py-1 text-right">Estimated cost</th>
              </tr>
            </thead>
            <tbody>
              {sow.lineItems.map((li, i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="py-1">{li.item}</td>
                  <td className="py-1 text-slate-500">{li.category}</td>
                  <td className="py-1 text-right tabular-nums">{li.quantity}</td>
                  <td className="py-1 text-right tabular-nums">{money(li.unitPrice)}</td>
                  <td className="py-1 text-right tabular-nums">{money(li.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <table className="w-full text-sm">
            <tbody>
              <Row label="Estimated cost" value={money(p.grandTotal)} />
              <Row label="Monthly run-rate (recurring)" value={money(p.monthlyTotal)} />
              <Row label="Not-to-exceed (incl. contingency)" value={money(p.clientPrice)} strong />
            </tbody>
          </table>
          <p className="text-xs text-slate-400 mt-1">
            Time &amp; materials: invoiced monthly for actual effort, capped at the not-to-exceed.
          </p>
        </>
      )}

      {flavor === 'PROPOSAL' && (
        <>
          <p className="text-xs font-medium text-slate-500 mt-2 mb-1">
            Subscription &amp; implementation
          </p>
          <table className="w-full text-sm mb-4">
            <tbody>
              <Row label="One-time implementation" value={money(p.oneTimeTotal)} />
              <Row label="Monthly subscription (recurring)" value={money(p.monthlyTotal)} />
              <Row label="Annual subscription (annualized)" value={money(p.yearlyTotal)} />
            </tbody>
          </table>
          {categoryTable}
          <table className="w-full text-sm">
            <tbody>
              <Row label="Contingency" value={money(p.contingencyAmount)} />
              <Row label="Grand total (cost)" value={money(p.grandTotal)} strong />
              <Row label="Total price to Client" value={money(p.clientPrice)} strong />
            </tbody>
          </table>
        </>
      )}

      {flavor === 'CONCISE' && (
        <table className="w-full text-sm">
          <tbody>
            <Row label="One-time total" value={money(p.oneTimeTotal)} />
            <Row label="Monthly total" value={money(p.monthlyTotal)} />
            <Row label="Grand total (cost)" value={money(p.grandTotal)} strong />
            <Row label="Total price to Client" value={money(p.clientPrice)} strong />
          </tbody>
        </table>
      )}

      {flavor !== 'TIME_MATERIALS' && flavor !== 'PROPOSAL' && flavor !== 'CONCISE' && (
        <>
          {lineItemsTable}
          {categoryTable}
          {fullTotals}
        </>
      )}

      <p className="text-xs text-slate-400 mt-1">
        {sow.status === 'ISSUED'
          ? 'Pricing snapshotted at issue; it will not change if the estimate is later edited.'
          : 'Draft pricing reflects the current estimate; issuing the SOW locks these figures.'}
      </p>
    </section>
  );

  // ── Section list — numbered dynamically; Concise trims the heavy ones ───────
  type Sec = {
    title: string;
    body?: string;
    render?: (n: number) => ReactNode;
    hideFor?: string[];
  };
  const sections: Sec[] = [
    { title: 'Executive Summary', body: sow.executiveSummary },
    { title: 'Customer Understanding', body: sow.customerUnderstanding, hideFor: ['CONCISE'] },
    { title: 'Overview', body: sow.overview },
    { title: 'Scope of Services', body: sow.scope },
    { title: 'Out of Scope', body: sow.outOfScope },
    { title: 'Proposed Solution', body: sow.solutionOverview },
    { title: 'Deliverables & Milestone Schedule', render: renderDeliverables },
    { title: 'Timeline', body: sow.timeline, hideFor: ['CONCISE'] },
    { title: 'Pricing', render: renderPricing },
    { title: 'Payment Terms', body: sow.paymentTerms },
    { title: 'Governance Model', body: sow.governanceModel, hideFor: ['CONCISE'] },
    { title: 'Roles & Responsibilities', body: sow.rolesResponsibilities, hideFor: ['CONCISE'] },
    {
      title: 'Non-Functional Requirements',
      body: sow.nonFunctionalRequirements,
      hideFor: ['CONCISE'],
    },
    { title: 'Testing Strategy', body: sow.testingStrategy, hideFor: ['CONCISE'] },
    { title: 'Maintenance & Support', body: sow.maintenanceSupport, hideFor: ['CONCISE'] },
    { title: 'Assumptions', body: sow.assumptions },
    { title: 'Risks & Mitigation', body: sow.risksMitigation, hideFor: ['CONCISE'] },
    { title: 'Acceptance Criteria', body: sow.acceptanceCriteria },
    { title: 'Change Control', body: sow.changeControl, hideFor: ['CONCISE'] },
    { title: 'Terms & Conditions', body: sow.termsAndConditions },
  ];
  const visible = sections.filter((s) => !s.hideFor?.includes(flavor));
  const acceptanceNo = visible.length + 1;

  return (
    <div className="max-w-3xl mx-auto bg-white text-slate-900 p-2 print:p-0">
      <div className="flex items-center justify-between gap-4 print:hidden">
        <Link to={`/sow/${sow.id}`} className="text-sm text-slate-500 hover:underline">
          ← Back to editor
        </Link>
        <button
          onClick={() => window.print()}
          className="bg-brand text-white rounded px-3 py-1.5 text-sm font-medium"
        >
          Print / Save as PDF
        </button>
      </div>

      <header className="text-center border-b-2 border-slate-800 pb-3 mt-3">
        <h1 className="text-2xl font-bold uppercase tracking-wide">Statement of Work</h1>
        <p className="text-base font-medium mt-1">{sow.title}</p>
        <p className="text-xs text-slate-500 mt-1">
          {sow.number} · {sow.status === 'ISSUED' ? 'Issued' : 'Draft'} ·{' '}
          {sowFlavorLabel(sow.flavor)}
          {sow.effectiveDate ? ` · Effective ${sow.effectiveDate}` : ''}
          {sow.issuedAt ? ` · Issued ${sow.issuedAt.slice(0, 10)}` : ''}
        </p>
      </header>

      <section className="grid grid-cols-2 gap-4 mt-4 text-sm">
        <Party label="Client" name={sow.clientName} />
        <Party label="Provider" name={sow.providerName} />
      </section>

      {visible.map((s, idx) => {
        const n = idx + 1;
        return s.render ? (
          <Fragment key={s.title}>{s.render(n)}</Fragment>
        ) : (
          <Prose key={s.title} title={`${n}. ${s.title}`} body={s.body ?? ''} />
        );
      })}

      <section className="mt-8 break-inside-avoid">
        <h2 className="font-semibold border-b border-slate-300 mb-3 text-sm uppercase tracking-wide">
          {acceptanceNo}. Acceptance
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          The parties, by their authorized representatives, agree to this Statement of Work.
        </p>
        <div className="grid grid-cols-2 gap-8 text-sm">
          <Signature party={sow.clientName || 'Client'} />
          <Signature party={sow.providerName || 'Provider'} />
        </div>
      </section>

      <footer className="mt-8 pt-2 border-t border-slate-200 text-[10px] text-slate-400 text-center">
        {sow.number} · Generated from estimate “{sow.estimateName}”
        {sow.preparedByEmail ? ` · Prepared by ${sow.preparedByEmail}` : ''}
      </footer>
    </div>
  );
}

function Party({ label, name }: { label: string; name: string }) {
  return (
    <div className="border border-slate-200 rounded p-2">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="font-semibold">{name || '—'}</div>
    </div>
  );
}

function Prose({ title, body }: { title: string; body: string }) {
  return (
    <section className="mt-5 break-inside-avoid">
      <h2 className="font-semibold border-b border-slate-300 mb-1 text-sm uppercase tracking-wide">
        {title}
      </h2>
      <p className="text-sm whitespace-pre-wrap leading-relaxed">{body || '—'}</p>
    </section>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <tr className={`border-t border-slate-100 ${strong ? 'font-semibold' : ''}`}>
      <td className="py-1">{label}</td>
      <td className="py-1 text-right tabular-nums">{value}</td>
    </tr>
  );
}

function Signature({ party }: { party: string }) {
  return (
    <div>
      <div className="border-b border-slate-400 h-10" />
      <div className="text-xs text-slate-500 mt-1">Signature — {party}</div>
      <div className="border-b border-slate-400 h-8 mt-4" />
      <div className="text-xs text-slate-500 mt-1">Name / Title</div>
      <div className="border-b border-slate-400 h-8 mt-4" />
      <div className="text-xs text-slate-500 mt-1">Date</div>
    </div>
  );
}
