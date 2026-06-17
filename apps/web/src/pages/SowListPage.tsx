import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useSows, useCreateSow, useSowMutations, useEligibleEstimates } from '../lib/queries';
import type { SowSummary } from '../lib/types';

type SortKey = 'number' | 'title' | 'estimateName' | 'clientName' | 'status' | 'updatedAt';

/** Statements of Work (BR-7) — list + create from an *approved* estimate. */
export default function SowListPage() {
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'ESTIMATOR';
  const navigate = useNavigate();
  const { data, isLoading, error } = useSows();
  const { data: eligible } = useEligibleEstimates();
  const create = useCreateSow();
  const [estimateId, setEstimateId] = useState('');
  // Client-side column sorting (the list loads all SOWs). null = API default
  // (most-recently-updated first).
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' } | null>(null);

  const sorted = useMemo(() => {
    if (!data) return data;
    if (!sort) return data;
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...data].sort((a, b) => {
      const av = String(a[sort.key] ?? '');
      const bv = String(b[sort.key] ?? '');
      return av.localeCompare(bv, undefined, { numeric: true }) * dir;
    });
  }, [data, sort]);

  function toggleSort(key: SortKey) {
    setSort((s) => {
      if (s?.key !== key) return { key, dir: 'asc' };
      return { key, dir: s.dir === 'asc' ? 'desc' : 'asc' };
    });
  }
  function arrow(key: SortKey): string {
    if (sort?.key !== key) return '';
    return sort.dir === 'asc' ? ' ▲' : ' ▼';
  }

  function add() {
    if (!estimateId) return;
    create.mutate({ estimateId }, { onSuccess: (sow) => navigate(`/sow/${sow.id}`) });
  }

  const hasEligible = (eligible?.length ?? 0) > 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Statements of Work</h1>
        <p className="text-sm text-slate-500 max-w-2xl">
          Compose an official, legal Statement of Work from an <strong>approved</strong> estimate,
          edit its sections, then print it to PDF. Only estimates that have reached the
          Approved/Final stage of their workflow can be a SOW source. Issuing a SOW locks it and
          snapshots its pricing (BR-7).
        </p>
      </div>

      {canEdit &&
        (hasEligible ? (
          <div className="flex flex-wrap gap-2 items-center bg-white border border-slate-200 rounded-xl p-3">
            <select
              value={estimateId}
              onChange={(e) => setEstimateId(e.target.value)}
              className="border border-slate-300 rounded px-2 py-1 text-sm min-w-64"
              title="Source estimate"
            >
              <option value="">Select an approved estimate…</option>
              {eligible?.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} · {e.stageLabel}
                </option>
              ))}
            </select>
            <button
              onClick={add}
              disabled={!estimateId || create.isPending}
              className="bg-slate-800 text-white rounded px-3 py-1 text-sm disabled:opacity-50"
            >
              New SOW from estimate
            </button>
            {create.error && (
              <span className="text-rose-700 text-sm" role="alert">
                {(create.error as Error).message}
              </span>
            )}
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 text-sm">
            No approved estimates yet. Move an estimate to the <strong>Approved</strong> (or Final)
            stage in its workflow — once its smart checklist passes — to create a SOW from it.
          </div>
        ))}

      {isLoading && <p className="text-slate-500">Loading…</p>}
      {error && <p className="text-rose-700">{(error as Error).message}</p>}

      {data && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-slate-600 text-left">
              <tr>
                <SortTh label="Number" k="number" onSort={toggleSort} arrow={arrow} />
                <SortTh label="Title" k="title" onSort={toggleSort} arrow={arrow} />
                <SortTh label="Estimate" k="estimateName" onSort={toggleSort} arrow={arrow} />
                <SortTh label="Client" k="clientName" onSort={toggleSort} arrow={arrow} />
                <SortTh label="Status" k="status" onSort={toggleSort} arrow={arrow} center />
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {sorted!.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                    No statements of work yet.
                  </td>
                </tr>
              )}
              {sorted!.map((s) => (
                <SowRow key={s.id} s={s} canEdit={canEdit} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SortTh({
  label,
  k,
  onSort,
  arrow,
  center,
}: {
  label: string;
  k: SortKey;
  onSort: (k: SortKey) => void;
  arrow: (k: SortKey) => string;
  center?: boolean;
}) {
  return (
    <th className={`px-4 py-2 ${center ? 'text-center' : ''}`}>
      <button
        onClick={() => onSort(k)}
        className="font-medium hover:text-brand"
        aria-label={`Sort by ${label}`}
      >
        {label}
        {arrow(k)}
      </button>
    </th>
  );
}

function SowRow({ s, canEdit }: { s: SowSummary; canEdit: boolean }) {
  const m = useSowMutations(s.id);
  return (
    <tr className="border-t border-slate-100">
      <td className="px-4 py-2 font-mono text-xs text-slate-500 whitespace-nowrap">{s.number}</td>
      <td className="px-4 py-2">
        <Link to={`/sow/${s.id}`} className="text-brand hover:underline">
          {s.title}
        </Link>
      </td>
      <td className="px-4 py-2 text-slate-600">{s.estimateName}</td>
      <td className="px-4 py-2 text-slate-600">{s.clientName || '—'}</td>
      <td className="px-4 py-2 text-center">
        <span
          className={`rounded px-1.5 py-0.5 text-xs ${
            s.status === 'ISSUED' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {s.status === 'ISSUED' ? 'Issued' : 'Draft'}
        </span>
      </td>
      <td className="px-4 py-2 text-right whitespace-nowrap">
        <Link to={`/sow/${s.id}/print`} className="text-brand hover:underline text-xs">
          PDF →
        </Link>
        {canEdit && (
          <button
            onClick={() => {
              if (confirm(`Delete ${s.number}?`)) m.remove.mutate();
            }}
            className="ml-3 text-rose-600 hover:underline text-xs"
          >
            Delete
          </button>
        )}
      </td>
    </tr>
  );
}
