import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useSows, useCreateSow, useSowMutations, useEstimates } from '../lib/queries';
import type { SowSummary } from '../lib/types';

/** Statements of Work (BR-7) — list + create-from-estimate. */
export default function SowListPage() {
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'ESTIMATOR';
  const navigate = useNavigate();
  const { data, isLoading, error } = useSows();
  const { data: estimates } = useEstimates({});
  const create = useCreateSow();
  const [estimateId, setEstimateId] = useState('');

  function add() {
    if (!estimateId) return;
    create.mutate({ estimateId }, { onSuccess: (sow) => navigate(`/sow/${sow.id}`) });
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Statements of Work</h1>
        <p className="text-sm text-slate-500 max-w-2xl">
          Compose an official, legal Statement of Work from an estimate, edit its sections, then
          print it to PDF. Issuing a SOW locks it and snapshots its pricing (BR-7).
        </p>
      </div>

      {canEdit && (
        <div className="flex flex-wrap gap-2 items-center bg-white border border-slate-200 rounded-xl p-3">
          <select
            value={estimateId}
            onChange={(e) => setEstimateId(e.target.value)}
            className="border border-slate-300 rounded px-2 py-1 text-sm min-w-64"
            title="Source estimate"
          >
            <option value="">Select an estimate…</option>
            {estimates?.data.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
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
      )}

      {isLoading && <p className="text-slate-500">Loading…</p>}
      {error && <p className="text-rose-700">{(error as Error).message}</p>}

      {data && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-slate-600 text-left">
              <tr>
                <th className="px-4 py-2">Number</th>
                <th className="px-4 py-2">Title</th>
                <th className="px-4 py-2">Estimate</th>
                <th className="px-4 py-2">Client</th>
                <th className="px-4 py-2 text-center">Status</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                    No statements of work yet.
                  </td>
                </tr>
              )}
              {data.map((s) => (
                <SowRow key={s.id} s={s} canEdit={canEdit} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
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
