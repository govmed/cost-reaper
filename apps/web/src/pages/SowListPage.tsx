import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useSows, useCreateSow, useSowMutations, useEligibleEstimates } from '../lib/queries';
import { usePagedSort } from '../lib/usePagedSort';
import { Pagination } from '../components/Pagination';
import { SortableTh } from '../components/SortableTh';
import { SOW_FLAVORS, type SowSummary } from '../lib/types';

/** Statements of Work (BR-7) — list + create from an *approved* estimate. */
export default function SowListPage() {
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'ESTIMATOR';
  const navigate = useNavigate();
  const { data, isLoading, error } = useSows();
  const { data: eligible } = useEligibleEstimates();
  const create = useCreateSow();
  const [estimateId, setEstimateId] = useState('');
  const [flavor, setFlavor] = useState('ENTERPRISE');
  // Client-side sort + pagination (the list loads all SOWs); newest first.
  const grid = usePagedSort(data ?? [], { initialSort: 'updatedAt', initialDir: 'desc' });

  function add() {
    if (!estimateId) return;
    create.mutate({ estimateId, flavor }, { onSuccess: (sow) => navigate(`/sow/${sow.id}`) });
  }

  const flavorDesc = SOW_FLAVORS.find((f) => f.key === flavor)?.description;

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
          <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
            <div className="flex flex-wrap gap-2 items-center">
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
              <select
                value={flavor}
                onChange={(e) => setFlavor(e.target.value)}
                className="border border-slate-300 rounded px-2 py-1 text-sm"
                title="Template style"
              >
                {SOW_FLAVORS.map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label}
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
            {flavorDesc && <p className="text-xs text-slate-500">{flavorDesc}</p>}
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
        <div className="space-y-3">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-slate-600 text-left">
                <tr>
                  <SortableTh
                    label="Number"
                    sortKey="number"
                    activeKey={grid.sortKey}
                    dir={grid.dir}
                    onSort={grid.toggleSort}
                  />
                  <SortableTh
                    label="Title"
                    sortKey="title"
                    activeKey={grid.sortKey}
                    dir={grid.dir}
                    onSort={grid.toggleSort}
                  />
                  <SortableTh
                    label="Estimate"
                    sortKey="estimateName"
                    activeKey={grid.sortKey}
                    dir={grid.dir}
                    onSort={grid.toggleSort}
                  />
                  <SortableTh
                    label="Client"
                    sortKey="clientName"
                    activeKey={grid.sortKey}
                    dir={grid.dir}
                    onSort={grid.toggleSort}
                  />
                  <SortableTh
                    label="Status"
                    sortKey="status"
                    activeKey={grid.sortKey}
                    dir={grid.dir}
                    onSort={grid.toggleSort}
                    align="center"
                  />
                  <SortableTh
                    label="Estimate updated"
                    sortKey="estimateUpdatedAt"
                    activeKey={grid.sortKey}
                    dir={grid.dir}
                    onSort={grid.toggleSort}
                  />
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {grid.total === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                      No statements of work yet.
                    </td>
                  </tr>
                )}
                {grid.pageRows.map((s) => (
                  <SowRow key={s.id} s={s} canEdit={canEdit} />
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={grid.page}
            lastPage={grid.lastPage}
            pageSize={grid.pageSize}
            total={grid.total}
            rangeStart={grid.rangeStart}
            rangeEnd={grid.rangeEnd}
            onPage={grid.setPage}
            onPageSize={grid.setPageSize}
          />
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
      <td
        className="px-4 py-2 text-slate-500 whitespace-nowrap"
        title="When the source estimate was last updated"
      >
        {new Date(s.estimateUpdatedAt).toLocaleString()}
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
