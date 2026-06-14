import { Link, useParams } from 'react-router-dom';
import { useSow } from '../lib/queries';

/** Official, print-ready Statement of Work — "Save as PDF" via the browser (BR-7). */
export default function SowPrintPage() {
  const { id } = useParams<{ id: string }>();
  const { data: sow, isLoading, error } = useSow(id);

  if (isLoading) return <p className="text-slate-500">Loading…</p>;
  if (error) return <p className="text-rose-700">{(error as Error).message}</p>;
  if (!sow) return null;

  const cur = sow.currency;
  const money = (v: string) => `${v} ${cur}`;
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

      <Prose title="1. Overview" body={sow.overview} />
      <Prose title="2. Scope of Services" body={sow.scope} />
      <Prose title="3. Deliverables" body={sow.deliverables} />
      <Prose title="4. Timeline" body={sow.timeline} />

      <section className="mt-5">
        <h2 className="font-semibold border-b border-slate-300 mb-1 text-sm uppercase tracking-wide">
          5. Pricing
        </h2>
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

      <Prose title="6. Payment Terms" body={sow.paymentTerms} />
      <Prose title="7. Assumptions" body={sow.assumptions} />
      <Prose title="8. Terms &amp; Conditions" body={sow.termsAndConditions} />

      <section className="mt-8 break-inside-avoid">
        <h2 className="font-semibold border-b border-slate-300 mb-3 text-sm uppercase tracking-wide">
          9. Acceptance
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
