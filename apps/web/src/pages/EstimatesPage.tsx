import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateEstimate, useEstimates } from '../lib/queries';
import { useAuth } from '../lib/auth';
import { canAuthorEstimates } from '../lib/permissions';
import { usePagedSort } from '../lib/usePagedSort';
import { Pagination } from '../components/Pagination';
import { SortableTh } from '../components/SortableTh';
import { formatMoney } from '../lib/money';

export default function EstimatesPage() {
  const [q, setQ] = useState('');
  const [name, setName] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isLoading, error } = useEstimates({ q });
  const create = useCreateEstimate();

  // Only users who can author estimates see the create form (FR-30). A GM is an
  // approver — they review/approve, they don't create their own estimates.
  const canCreate = canAuthorEstimates(user);

  const grid = usePagedSort(data?.data ?? [], {
    initialSort: 'updatedAt',
    initialDir: 'desc',
    getValue: (e, k) =>
      k === 'grandTotal' ? Number(e.grandTotal) : (e as unknown as Record<string, unknown>)[k],
  });

  async function onCreate() {
    if (!name.trim()) return;
    const est = await create.mutateAsync({
      name,
      currency: 'USD',
      globalUpchargePercent: 0,
      contingencyPercent: 0,
    });
    setName('');
    navigate(`/estimates/${est.id}`);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-semibold">Estimates</h1>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name…"
          className="border border-slate-300 rounded px-3 py-2 text-sm w-64"
        />
      </div>

      {canCreate && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex gap-2 items-end">
          <label className="text-sm flex-1">
            <span className="text-slate-600">New estimate name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full border border-slate-300 rounded px-3 py-2"
              placeholder="Q3 Platform build"
            />
          </label>
          <button
            onClick={onCreate}
            disabled={create.isPending || !name.trim()}
            className="bg-brand text-white rounded px-4 py-2 text-sm font-medium disabled:opacity-60"
          >
            Create
          </button>
        </div>
      )}

      {isLoading && <p className="text-slate-500">Loading…</p>}
      {error && <p className="text-rose-700">{(error as Error).message}</p>}
      {data && (
        <div className="space-y-3">
          <table className="w-full bg-white border border-slate-200 rounded-xl overflow-hidden text-sm">
            <thead className="bg-slate-100 text-slate-600 text-left">
              <tr>
                <SortableTh
                  label="Name"
                  sortKey="name"
                  activeKey={grid.sortKey}
                  dir={grid.dir}
                  onSort={grid.toggleSort}
                />
                <SortableTh
                  label="Stage"
                  sortKey="currentStageKey"
                  activeKey={grid.sortKey}
                  dir={grid.dir}
                  onSort={grid.toggleSort}
                />
                <SortableTh
                  label="Currency"
                  sortKey="currency"
                  activeKey={grid.sortKey}
                  dir={grid.dir}
                  onSort={grid.toggleSort}
                />
                <SortableTh
                  label="Grand total"
                  sortKey="grandTotal"
                  activeKey={grid.sortKey}
                  dir={grid.dir}
                  onSort={grid.toggleSort}
                  align="right"
                />
                <SortableTh
                  label="Updated"
                  sortKey="updatedAt"
                  activeKey={grid.sortKey}
                  dir={grid.dir}
                  onSort={grid.toggleSort}
                />
              </tr>
            </thead>
            <tbody>
              {grid.pageRows.map((e) => (
                <tr
                  key={e.id}
                  className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer"
                  onClick={() => navigate(`/estimates/${e.id}`)}
                >
                  <td className="px-4 py-2 font-medium text-brand">{e.name}</td>
                  <td className="px-4 py-2">{e.currentStageLabel ?? '—'}</td>
                  <td className="px-4 py-2">{e.currency}</td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {formatMoney(e.grandTotal, e.currency)}
                  </td>
                  <td className="px-4 py-2 text-slate-500">
                    {new Date(e.updatedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {grid.total === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    No estimates yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
