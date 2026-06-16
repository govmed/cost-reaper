import { useMemo, useState } from 'react';
import { useAuth } from '../lib/auth';
import { useCloudPrices, useCloudSync, useLastPulled } from '../lib/queries';
import { useRefLabeler } from '../lib/refLabels';
import { formatMoney } from '../lib/money';

// Fallback provider codes used until the DB reference labels load (FR-29).
const PROVIDERS = ['', 'AWS', 'GCP', 'AZURE', 'SAAS'];

/**
 * Format an ISO datetime as MM/DD/CCYY HH:MM:SS in the viewer's local time
 * (FR-21b — date and time of the last pull), or em-dash when never pulled.
 * Stored value is UTC; shown localized per NFR-13.
 */
function fmtPulled(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  const date = `${p(d.getMonth() + 1)}/${p(d.getDate())}/${d.getFullYear()}`;
  const time = `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  return `${date} ${time}`;
}

export default function CloudPricesPage() {
  const { user } = useAuth();
  const { data, isLoading, error } = useCloudPrices();
  const { data: freshness } = useLastPulled();
  const sync = useCloudSync();
  const prov = useRefLabeler('CLOUD_PROVIDER');
  const unitLabeler = useRefLabeler('CLOUD_PRICE_UNIT');
  const providerOptions = prov.ready
    ? [{ code: '', label: 'All' }, ...prov.options]
    : PROVIDERS.map((c) => ({ code: c, label: c || 'All' }));
  const [provider, setProvider] = useState('');
  const [category, setCategory] = useState('');
  const [q, setQ] = useState('');

  const categories = useMemo(
    () => Array.from(new Set((data ?? []).map((p) => p.category))).sort(),
    [data],
  );

  const rows = useMemo(() => {
    const all = data ?? [];
    const ql = q.trim().toLowerCase();
    return all.filter(
      (p) =>
        (!provider || p.provider === provider) &&
        (!category || p.category === category) &&
        (!ql ||
          `${p.category} ${p.region} ${p.service} ${p.skuOrInstance}`.toLowerCase().includes(ql)),
    );
  }, [data, provider, category, q]);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Cloud prices</h1>
      <p className="text-sm text-slate-500 -mt-3">
        The seeded AWS / GCP / Azure price catalog used by cloud line items (read-only).
      </p>

      {/* Per-provider freshness — last pulled (FR-21b) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 max-w-lg">
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
              <th className="py-1">Last pulled (local)</th>
              <th className="py-1 text-right">Prices</th>
            </tr>
          </thead>
          <tbody>
            {(freshness ?? []).map((f) => (
              <tr key={f.provider} className="border-t border-slate-100">
                <td className="py-1 font-medium">{prov.label(f.provider)}</td>
                <td className="py-1 tabular-nums whitespace-nowrap">{fmtPulled(f.lastPulled)}</td>
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
            {providerOptions.map((o) => (
              <option key={o.code} value={o.code}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="text-slate-600">Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 block border border-slate-300 rounded px-3 py-2"
          >
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
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
              <th className="px-4 py-2">Category</th>
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
                <td className="px-4 py-2 font-medium">{prov.label(p.provider)}</td>
                <td className="px-4 py-2 text-slate-500">{p.category}</td>
                <td className="px-4 py-2">{p.region}</td>
                <td className="px-4 py-2">{p.service}</td>
                <td className="px-4 py-2">{p.skuOrInstance}</td>
                <td className="px-4 py-2">{unitLabeler.label(p.unit)}</td>
                <td className="px-4 py-2 text-right tabular-nums">
                  {formatMoney(p.unitPrice, p.currency)}
                </td>
                <td className="px-4 py-2">{p.currency}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
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
