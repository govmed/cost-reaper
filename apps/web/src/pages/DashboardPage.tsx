import { Link } from 'react-router-dom';
import { useDashboard } from '../lib/queries';

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboard();

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

      <div className="grid md:grid-cols-2 gap-4">
        <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
          <h2 className="font-semibold text-brand">By workflow stage</h2>
          {data.byStage.length === 0 && <p className="text-slate-400 text-sm">No estimates yet.</p>}
          <ul className="text-sm space-y-1">
            {data.byStage.map((s) => (
              <li key={s.stageKey} className="flex justify-between border-b border-slate-100 py-1">
                <span className="text-slate-600">{s.stageLabel}</span>
                <span className="tabular-nums font-medium">{s.count}</span>
              </li>
            ))}
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
