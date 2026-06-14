import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDashboard, useStageEstimates } from '../lib/queries';

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

/** Drill-down list of the estimates currently in a workflow stage (FR-18). */
function StageDetail({ stageKey }: { stageKey: string }) {
  const { data, isLoading, error } = useStageEstimates(stageKey);
  if (isLoading) return <p className="text-xs text-slate-400 pl-5 py-1">Loading…</p>;
  if (error) return <p className="text-xs text-rose-700 pl-5 py-1">{(error as Error).message}</p>;
  if (!data || data.length === 0)
    return <p className="text-xs text-slate-400 pl-5 py-1">No estimates in this stage.</p>;
  return (
    <ul className="pl-5 pb-2 space-y-1">
      {data.map((e) => (
        <li key={e.id} className="flex items-center justify-between gap-2 text-xs">
          <Link to={`/estimates/${e.id}`} className="text-brand hover:underline truncate">
            {e.name}
          </Link>
          <span className="text-slate-500 tabular-nums whitespace-nowrap">
            {e.grandTotal} {e.currency} · {new Date(e.updatedAt).toLocaleDateString()}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboard();
  const [openStage, setOpenStage] = useState<string | null>(null);

  if (isLoading) return <p className="text-slate-500">Loading…</p>;
  if (error) return <p className="text-rose-700">{(error as Error).message}</p>;
  if (!data) return null;

  const draft = data.byStatus.find((s) => s.status === 'DRAFT')?.count ?? 0;
  const final = data.byStatus.find((s) => s.status === 'FINAL')?.count ?? 0;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Estimates" value={data.totalEstimates} />
        <Stat label="Drafts" value={draft} />
        <Stat label="Final" value={final} />
        <Stat
          label="Total value"
          value={
            data.totalsByCurrency.length
              ? data.totalsByCurrency.map((t) => `${t.grandTotal} ${t.currency}`).join(' · ')
              : '—'
          }
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Stat
          label={`Total (${data.baseCurrency} equivalent)`}
          value={`${data.baseCurrencyTotal} ${data.baseCurrency}`}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
          <h2 className="font-semibold text-brand">By workflow stage</h2>
          {data.byStage.length === 0 && <p className="text-slate-400 text-sm">No estimates yet.</p>}
          {data.byStage.length > 0 && (
            <p className="text-xs text-slate-400">Click a stage to see its estimates.</p>
          )}
          <ul className="text-sm">
            {data.byStage.map((s) => {
              const open = openStage === s.stageKey;
              return (
                <li key={s.stageKey} className="border-b border-slate-100">
                  <button
                    onClick={() => setOpenStage(open ? null : s.stageKey)}
                    aria-expanded={open}
                    className="w-full flex items-center justify-between py-1 px-1 text-left rounded hover:bg-slate-50 group"
                  >
                    <span className="text-slate-600 group-hover:text-slate-900">
                      <span className="inline-block w-3 text-slate-400">{open ? '▾' : '▸'}</span>{' '}
                      {s.stageLabel}
                    </span>
                    <span className="tabular-nums font-medium">{s.count}</span>
                  </button>
                  {open && <StageDetail stageKey={s.stageKey} />}
                </li>
              );
            })}
          </ul>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
          <h2 className="font-semibold text-brand">Recent activity</h2>
          {data.recent.length === 0 && <p className="text-slate-400 text-sm">Nothing yet.</p>}
          <ul className="text-sm space-y-1">
            {data.recent.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between border-b border-slate-100 py-1"
              >
                <Link to={`/estimates/${r.id}`} className="text-brand hover:underline truncate">
                  {r.name}
                </Link>
                <span className="text-slate-500 tabular-nums whitespace-nowrap">
                  {r.grandTotal} {r.currency}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
