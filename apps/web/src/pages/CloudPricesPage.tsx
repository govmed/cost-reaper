import { useMemo, useState } from 'react';
import { useCloudPrices } from '../lib/queries';

const PROVIDERS = ['', 'AWS', 'GCP', 'AZURE'];

export default function CloudPricesPage() {
  const { data, isLoading, error } = useCloudPrices();
  const [provider, setProvider] = useState('');
  const [q, setQ] = useState('');

  const rows = useMemo(() => {
    const all = data ?? [];
    const ql = q.trim().toLowerCase();
    return all.filter(
      (p) =>
        (!provider || p.provider === provider) &&
        (!ql || `${p.region} ${p.service} ${p.skuOrInstance}`.toLowerCase().includes(ql)),
    );
  }, [data, provider, q]);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Cloud prices</h1>
      <p className="text-sm text-slate-500 -mt-3">
        The seeded AWS / GCP / Azure price catalog used by cloud line items (read-only).
      </p>

      <div className="flex flex-wrap gap-2 items-end">
        <label className="text-sm">
          <span className="text-slate-600">Provider</span>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="mt-1 block border border-slate-300 rounded px-3 py-2"
          >
            {PROVIDERS.map((p) => (
              <option key={p} value={p}>
                {p || 'All'}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm flex-1 min-w-48">
          <span className="text-slate-600">Search (region / service / instance)</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="mt-1 w-full border border-slate-300 rounded px-3 py-2"
            placeholder="e.g. us-east-1, EC2, m5.large"
          />
        </label>
      </div>

      {isLoading && <p className="text-slate-500">Loading…</p>}
      {error && <p className="text-rose-700">{(error as Error).message}</p>}
      {data && (
        <table className="w-full bg-white border border-slate-200 rounded-xl overflow-hidden text-sm">
          <thead className="bg-slate-100 text-slate-600 text-left">
            <tr>
              <th className="px-4 py-2">Provider</th>
              <th className="px-4 py-2">Region</th>
              <th className="px-4 py-2">Service</th>
              <th className="px-4 py-2">Instance / SKU</th>
              <th className="px-4 py-2">Unit</th>
              <th className="px-4 py-2 text-right">Unit price</th>
              <th className="px-4 py-2">Cur</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-medium">{p.provider}</td>
                <td className="px-4 py-2">{p.region}</td>
                <td className="px-4 py-2">{p.service}</td>
                <td className="px-4 py-2">{p.skuOrInstance}</td>
                <td className="px-4 py-2">{p.unit}</td>
                <td className="px-4 py-2 text-right tabular-nums">{p.unitPrice}</td>
                <td className="px-4 py-2">{p.currency}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                  No matching prices.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
