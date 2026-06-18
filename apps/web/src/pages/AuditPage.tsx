import { useState } from 'react';
import { useAudit, useAuditEntityTypes } from '../lib/queries';

const PAGE_SIZE = 50;

/** Read-only viewer for the immutable audit trail (FR-11, NFR-11). */
export default function AuditPage() {
  const [q, setQ] = useState('');
  const [entityType, setEntityType] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, error, isFetching } = useAudit({
    q: q.trim() || undefined,
    entityType: entityType || undefined,
    page,
    pageSize: PAGE_SIZE,
  });
  const { data: types } = useAuditEntityTypes();

  const total = data?.total ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Audit log</h1>
        <p className="text-sm text-slate-500 max-w-2xl">
          The <strong>immutable, append-only</strong> record of who changed what, and when (FR-11).
          This view is <strong>read-only</strong> — entries cannot be edited or deleted. Times are
          shown in your local timezone.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 items-end bg-white border border-slate-200 rounded-xl p-3">
        <label className="text-sm">
          <span className="text-slate-600 text-xs">Search</span>
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="entity, action, or id…"
            className="mt-1 block border border-slate-300 rounded px-2 py-1 w-64"
          />
        </label>
        <label className="text-sm">
          <span className="text-slate-600 text-xs">Entity type</span>
          <select
            value={entityType}
            onChange={(e) => {
              setEntityType(e.target.value);
              setPage(1);
            }}
            className="mt-1 block border border-slate-300 rounded px-2 py-1"
          >
            <option value="">All</option>
            {(types ?? []).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        {isFetching && <span className="text-xs text-slate-400">Loading…</span>}
      </div>

      {isLoading && <p className="text-slate-500">Loading…</p>}
      {error && <p className="text-rose-700">{(error as Error).message}</p>}

      {data && (
        <>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-slate-600 text-left">
                <tr>
                  <th className="px-4 py-2 whitespace-nowrap">When</th>
                  <th className="px-4 py-2">Actor</th>
                  <th className="px-4 py-2">Action</th>
                  <th className="px-4 py-2">Entity</th>
                  <th className="px-4 py-2">Reference</th>
                  <th className="px-4 py-2 whitespace-nowrap">IP</th>
                  <th className="px-4 py-2 whitespace-nowrap">Location</th>
                </tr>
              </thead>
              <tbody>
                {data.data.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                      No audit entries match.
                    </td>
                  </tr>
                )}
                {data.data.map((e) => (
                  <tr key={e.id} className="border-t border-slate-100 align-top">
                    <td className="px-4 py-2 whitespace-nowrap text-slate-600">
                      {new Date(e.occurredAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-slate-600">{e.actorEmail ?? '—'}</td>
                    <td className="px-4 py-2">
                      <ActionBadge action={e.action} />
                    </td>
                    <td className="px-4 py-2 font-medium text-slate-800">{e.entityType}</td>
                    <td className="px-4 py-2 font-mono text-xs text-slate-500 break-all">
                      {e.entityId}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-slate-500 whitespace-nowrap">
                      {e.ipAddress ?? '—'}
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-500 whitespace-nowrap">
                      {e.location ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>{total === 0 ? 'No entries' : `Showing ${from}–${to} of ${total}`}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="border border-slate-300 rounded px-3 py-1 disabled:opacity-40"
              >
                ← Prev
              </button>
              <span>
                Page {page} of {lastPage}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                disabled={page >= lastPage}
                className="border border-slate-300 rounded px-3 py-1 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ActionBadge({ action }: { action: string }) {
  const a = action.toUpperCase();
  const cls = a.startsWith('CREATE')
    ? 'bg-emerald-50 text-emerald-700'
    : a.startsWith('DELETE')
      ? 'bg-rose-50 text-rose-700'
      : a.startsWith('WORKFLOW') || a.startsWith('ISSUE')
        ? 'bg-teal-50 text-brand'
        : 'bg-slate-100 text-slate-600';
  return <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${cls}`}>{action}</span>;
}
