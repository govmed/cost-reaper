import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateEstimate, useEstimates } from '../lib/queries';

export default function EstimatesPage() {
  const [q, setQ] = useState('');
  const [name, setName] = useState('');
  const navigate = useNavigate();
  const { data, isLoading, error } = useEstimates({ q });
  const create = useCreateEstimate();

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

      {isLoading && <p className="text-slate-500">Loading…</p>}
      {error && <p className="text-rose-700">{(error as Error).message}</p>}
      {data && (
        <table className="w-full bg-white border border-slate-200 rounded-xl overflow-hidden text-sm">
          <thead className="bg-slate-100 text-slate-600 text-left">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Currency</th>
              <th className="px-4 py-2 text-right">Grand total</th>
              <th className="px-4 py-2">Updated</th>
            </tr>
          </thead>
          <tbody>
            {data.data.map((e) => (
              <tr
                key={e.id}
                className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer"
                onClick={() => navigate(`/estimates/${e.id}`)}
              >
                <td className="px-4 py-2 font-medium text-brand">{e.name}</td>
                <td className="px-4 py-2">{e.status}</td>
                <td className="px-4 py-2">{e.currency}</td>
                <td className="px-4 py-2 text-right tabular-nums">{e.grandTotal}</td>
                <td className="px-4 py-2 text-slate-500">
                  {new Date(e.updatedAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {data.data.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  No estimates yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
