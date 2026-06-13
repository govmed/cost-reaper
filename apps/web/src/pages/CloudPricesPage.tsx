import { useMemo, useState } from 'react';
import { useAuth } from '../lib/auth';
import { useCloudPrices, useCloudSync, useLastPulled } from '../lib/queries';

const PROVIDERS = ['', 'AWS', 'GCP', 'AZURE'];

/** Format an ISO datetime as MM/DD/CCYY (FR-21b), or em-dash when never pulled. */
function fmtPulled(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}/${dd}/${d.getFullYear()}`;
}

export default function CloudPricesPage() {
  const { user } = useAuth();
  const { data, isLoading, error } = useCloudPrices();
  const { data: freshness } = useLastPulled();
  const sync = useCloudSync();
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

      {/* Per-provider freshness — last pulled (FR-21b) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 max-w-md">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-brand">Price freshness</h2>
          {user?.role === 'ADMIN' && (
            <button
              onClick={() => sync.mutate({})}
              disabled={sync.isPending}
              className="bg-brand text-white rounded px-3 py-1 text-sm disabled:opacity-50"
            >
              {sync.isPending ? 'Refreshing…' : 'Refresh prices'}
            </button>
          )}
        </div>
        <table className="w-full text-sm">
          <thead className="text-slate-500 text-left">
            <tr>
              <th className="py-1">Provider</th>
              <th className="py-1">Last pulled</th>
              <th className="py-1 text-right">Prices</th>
            </tr>
          </thead>
          <tbody>
            {(freshness ?? []).map((f) => (
              <tr key={f.provider} className="border-t border-slate-100">
                <td className="py-1 font-medium">{f.provider}</td>
                <td className="py-1 tabular-nums">{fmtPulled(f.lastPulled)}</td>
                <td className="py-1 text-right tabular-nums">{f.priceCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
