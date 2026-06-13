import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useFxMutation, useFxRates } from '../lib/queries';

/** Admin management of FX rates for multi-currency roll-ups (FR-17, FE-12). */
export default function FxRatesPage() {
  const { user } = useAuth();
  const { data, isLoading, error } = useFxRates();
  const fx = useFxMutation();
  const isAdmin = user?.role === 'ADMIN';
  const [newCur, setNewCur] = useState('');
  const [newRate, setNewRate] = useState('');

  function addRate() {
    const cur = newCur.trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(cur) || !newRate.trim()) return;
    fx.mutate(
      { currency: cur, rateToBase: newRate.trim() },
      {
        onSuccess: () => {
          setNewCur('');
          setNewRate('');
        },
      },
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">FX rates</h1>
        <p className="text-sm text-slate-500">
          Exchange rates vs the base currency (USD) — base units per 1 unit of the currency. Used to
          roll multi-currency estimates up to a base total (FR-17).
        </p>
      </div>

      {isLoading && <p className="text-slate-500">Loading…</p>}
      {error && <p className="text-rose-700">{(error as Error).message}</p>}

      {data && (
        <table className="w-full bg-white border border-slate-200 rounded-xl overflow-hidden text-sm max-w-xl">
          <thead className="bg-slate-100 text-slate-600 text-left">
            <tr>
              <th className="px-4 py-2">Currency</th>
              <th className="px-4 py-2 text-right">Rate → USD</th>
              <th className="px-4 py-2">Updated</th>
              {isAdmin && <th className="px-4 py-2"></th>}
            </tr>
          </thead>
          <tbody>
            {data.map((r) => (
              <tr key={r.currency} className="border-t border-slate-100">
                <td className="px-4 py-2 font-medium">{r.currency}</td>
                <td className="px-4 py-2 text-right tabular-nums">
                  {isAdmin && r.currency !== 'USD' ? (
                    <input
                      type="number"
                      step="0.000001"
                      defaultValue={r.rateToBase}
                      onBlur={(e) => {
                        if (e.target.value && e.target.value !== r.rateToBase)
                          fx.mutate({ currency: r.currency, rateToBase: e.target.value });
                      }}
                      className="w-32 border border-slate-200 rounded px-2 py-0.5 text-right"
                    />
                  ) : (
                    r.rateToBase
                  )}
                </td>
                <td className="px-4 py-2 text-xs text-slate-500">
                  {r.updatedByEmail ?? '—'}
                  {r.updatedAt ? ` · ${new Date(r.updatedAt).toLocaleDateString()}` : ''}
                </td>
                {isAdmin && <td className="px-4 py-2"></td>}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {isAdmin && (
        <div className="flex flex-wrap gap-2 items-center max-w-xl">
          <input
            value={newCur}
            onChange={(e) => setNewCur(e.target.value)}
            className="border border-slate-300 rounded px-2 py-1 text-sm w-24 uppercase"
            placeholder="CUR"
            maxLength={3}
          />
          <input
            value={newRate}
            onChange={(e) => setNewRate(e.target.value)}
            type="number"
            step="0.000001"
            className="border border-slate-300 rounded px-2 py-1 text-sm w-40"
            placeholder="rate → USD"
          />
          <button
            onClick={addRate}
            disabled={!newCur.trim() || !newRate.trim()}
            className="bg-slate-800 text-white rounded px-3 py-1 text-sm disabled:opacity-50"
          >
            Add / update rate
          </button>
        </div>
      )}
    </div>
  );
}
