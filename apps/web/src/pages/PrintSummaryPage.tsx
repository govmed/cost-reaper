import { Link, useParams } from 'react-router-dom';
import { useEstimate } from '../lib/queries';
import { useRefLabeler } from '../lib/refLabels';
import { formatMoney } from '../lib/money';
import type { EngineResult } from '../lib/types';

/** Printable, read-only estimate summary (FR-10, FE-23). Reuses the detail payload. */
export default function PrintSummaryPage() {
  const { id } = useParams<{ id: string }>();
  const { data: est, isLoading, error } = useEstimate(id);
  const billing = useRefLabeler('BILLING_PERIOD');
  const provider = useRefLabeler('CLOUD_PROVIDER');

  if (isLoading) return <p className="text-slate-500">Loading…</p>;
  if (error) return <p className="text-rose-700">{(error as Error).message}</p>;
  if (!est) return null;

  const t = est.totals;
  const cur = est.currency;
  const money = (v: string) => formatMoney(v, cur);

  return (
    <div className="max-w-3xl mx-auto bg-white text-slate-900 p-2 print:p-0">
      <div className="flex items-center justify-between gap-4 print:hidden">
        <Link to={`/estimates/${est.id}`} className="text-sm text-slate-500 hover:underline">
          ← Back to editor
        </Link>
        <button
          onClick={() => window.print()}
          className="bg-brand text-white rounded px-3 py-1.5 text-sm font-medium"
        >
          Print
        </button>
      </div>

      <header className="border-b border-slate-300 pb-3 mt-3">
        <h1 className="text-2xl font-bold">{est.name}</h1>
        <p className="text-sm text-slate-500">
          {est.currentStageLabel ?? '—'} · {cur}
          {est.description ? ` · ${est.description}` : ''}
        </p>
        <p className="text-xs text-slate-400">
          Upcharge {est.globalUpchargePercent}% · Contingency {est.contingencyPercent}%
        </p>
      </header>

      <Totals t={t} money={money} />

      {est.laborItems.length > 0 && (
        <LineTable
          title="Labor"
          head={['Role / Resource', 'Qty', 'Units', 'Rate', 'Billing', 'Phase', 'Line total']}
          rows={est.laborItems.map((l) => [
            l.roleName ?? l.description ?? '—',
            l.quantity,
            l.units,
            money(l.rateSnapshot),
            billing.label(l.billingPeriod),
            l.sdlcPhase ?? '—',
            money(l.lineTotal),
          ])}
        />
      )}
      {est.nonLaborItems.length > 0 && (
        <LineTable
          title="Non-labor"
          head={['Category', 'Amount', 'Billing', 'Phase', 'Line total']}
          rows={est.nonLaborItems.map((n) => [
            n.category,
            money(n.amount),
            billing.label(n.billingPeriod),
            n.sdlcPhase ?? '—',
            money(n.lineTotal),
          ])}
        />
      )}
      {est.cloudItems.length > 0 && (
        <LineTable
          title="Cloud compute"
          head={['Provider / Instance', 'Qty', 'Hrs/mo', 'Unit price', 'Phase', 'Line total']}
          rows={est.cloudItems.map((c) => [
            `${provider.label(c.provider)} · ${c.skuOrInstance} (${c.region})`,
            c.quantity,
            c.usageHoursPerMonth,
            money(c.unitPriceSnapshot),
            c.sdlcPhase ?? '—',
            money(c.lineTotal),
          ])}
        />
      )}

      {t.phases.length > 0 && (
        <Breakdown
          title="Cost by SDLC phase"
          rows={t.phases.map((p) => [p.phase, money(p.oneTime), money(p.monthly), money(p.yearly)])}
        />
      )}
      {t.categories.length > 0 && (
        <Breakdown
          title="Cost by category"
          rows={t.categories.map((c) => [
            c.category,
            money(c.oneTime),
            money(c.monthly),
            money(c.yearly),
          ])}
        />
      )}

      {est.assumptions.length > 0 && (
        <section className="mt-4">
          <h2 className="font-semibold border-b border-slate-200 mb-1">Assumptions &amp; notes</h2>
          <ul className="list-disc pl-5 text-sm">
            {est.assumptions.map((a) => (
              <li key={a.id}>{a.text}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Totals({ t, money }: { t: EngineResult; money: (v: string) => string }) {
  const items: [string, string][] = [
    ['One-time total', money(t.oneTimeTotal)],
    ['Monthly total', money(t.monthlyTotal)],
    ['Yearly total', money(t.yearlyTotal)],
    ['Upcharge', money(t.upchargeAmount)],
    ['Contingency', money(t.contingencyAmount)],
    ['Grand total', money(t.grandTotal)],
  ];
  return (
    <section className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
      {items.map(([label, value]) => (
        <div key={label} className="border border-slate-200 rounded p-2">
          <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
          <div className="font-semibold tabular-nums">{value}</div>
        </div>
      ))}
    </section>
  );
}

function LineTable({
  title,
  head,
  rows,
}: {
  title: string;
  head: string[];
  rows: (string | number)[][];
}) {
  return (
    <section className="mt-4">
      <h2 className="font-semibold border-b border-slate-200 mb-1">{title}</h2>
      <table className="w-full text-sm">
        <thead className="text-slate-500 text-left">
          <tr>
            {head.map((h, i) => (
              <th key={h} className={`py-1 ${i === 0 ? 'text-left' : 'text-right'}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} className="border-t border-slate-100">
              {r.map((cell, ci) => (
                <td
                  key={ci}
                  className={`py-1 ${ci === 0 ? 'text-left' : 'text-right tabular-nums'}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function Breakdown({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <section className="mt-4">
      <h2 className="font-semibold border-b border-slate-200 mb-1">{title}</h2>
      <table className="w-full text-sm">
        <thead className="text-slate-500 text-left">
          <tr>
            <th className="py-1">Group</th>
            <th className="py-1 text-right">One-time</th>
            <th className="py-1 text-right">Monthly</th>
            <th className="py-1 text-right">Yearly</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]} className="border-t border-slate-100">
              <td className="py-1">{r[0]}</td>
              <td className="py-1 text-right tabular-nums">{r[1]}</td>
              <td className="py-1 text-right tabular-nums">{r[2]}</td>
              <td className="py-1 text-right tabular-nums">{r[3]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
