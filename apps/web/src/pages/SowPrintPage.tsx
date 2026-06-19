import { Link, useParams } from 'react-router-dom';
import { useSow } from '../lib/queries';
import { formatMoney } from '../lib/money';

/** Official, print-ready Statement of Work — "Save as PDF" via the browser (BR-7). */
export default function SowPrintPage() {
  const { id } = useParams<{ id: string }>();
  const { data: sow, isLoading, error } = useSow(id);

  if (isLoading) return <p className="text-slate-500">Loading…</p>;
  if (error) return <p className="text-rose-700">{(error as Error).message}</p>;
  if (!sow) return null;

  const cur = sow.currency;
  const money = (v: string) => formatMoney(v, cur);
  const p = sow.pricing;

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
          {sow.number} · {sow.status === 'ISSUED' ? 'Issued' : 'Draft'}
          {sow.effectiveDate ? ` · Effective ${sow.effectiveDate}` : ''}
          {sow.issuedAt ? ` · Issued ${sow.issuedAt.slice(0, 10)}` : ''}
        </p>
      </header>

      <section className="grid grid-cols-2 gap-4 mt-4 text-sm">
        <Party label="Client" name={sow.clientName} />
        <Party label="Provider" name={sow.providerName} />
      </section>

      <Prose title="1. Executive Summary" body={sow.executiveSummary} />
      <Prose title="2. Customer Understanding" body={sow.customerUnderstanding} />
      <Prose title="3. Overview" body={sow.overview} />
      <Prose title="4. Scope of Services" body={sow.scope} />
      <Prose title="5. Out of Scope" body={sow.outOfScope} />
      <Prose title="6. Proposed Solution" body={sow.solutionOverview} />
      <section className="mt-5 break-inside-avoid">
        <h2 className="font-semibold border-b border-slate-300 mb-1 text-sm uppercase tracking-wide">
          7. Deliverables &amp; Milestone Schedule
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
          the Client&apos;s acceptance of that phase&apos;s deliverables. Recurring amounts are
          billed on their stated cadence (see §9 Pricing). Phase amounts exclude the project
          contingency.
        </p>
      </section>

      <Prose title="8. Timeline" body={sow.timeline} />

      <section className="mt-5">
        <h2 className="font-semibold border-b border-slate-300 mb-1 text-sm uppercase tracking-wide">
          9. Pricing
        </h2>
        {sow.lineItems.length > 0 && (
          <>
            <p className="text-xs font-medium text-slate-500 mt-2 mb-1">
              Estimate detail (line items)
            </p>
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
        )}
        {p.categories.length > 0 && (
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
        )}
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
        <p className="text-xs text-slate-400 mt-1">
          {sow.status === 'ISSUED'
            ? 'Pricing snapshotted at issue; it will not change if the estimate is later edited.'
            : 'Draft pricing reflects the current estimate; issuing the SOW locks these figures.'}
        </p>
      </section>

      <Prose title="10. Payment Terms" body={sow.paymentTerms} />
      <Prose title="11. Governance Model" body={sow.governanceModel} />
      <Prose title="12. Roles &amp; Responsibilities" body={sow.rolesResponsibilities} />
      <Prose title="13. Non-Functional Requirements" body={sow.nonFunctionalRequirements} />
      <Prose title="14. Testing Strategy" body={sow.testingStrategy} />
      <Prose title="15. Maintenance &amp; Support" body={sow.maintenanceSupport} />
      <Prose title="16. Assumptions" body={sow.assumptions} />
      <Prose title="17. Risks &amp; Mitigation" body={sow.risksMitigation} />
      <Prose title="18. Acceptance Criteria" body={sow.acceptanceCriteria} />
      <Prose title="19. Change Control" body={sow.changeControl} />
      <Prose title="20. Terms &amp; Conditions" body={sow.termsAndConditions} />

      <section className="mt-8 break-inside-avoid">
        <h2 className="font-semibold border-b border-slate-300 mb-3 text-sm uppercase tracking-wide">
          21. Acceptance
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
