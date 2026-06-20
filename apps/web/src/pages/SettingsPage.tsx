import { useEffect, useState } from 'react';
import { useDocumentUploadLimit, useUpdateDocumentUploadLimit } from '../lib/queries';

/** Admin → Settings: application configuration (settings.manage). */
export default function SettingsPage() {
  const { data, isLoading, error } = useDocumentUploadLimit();
  const update = useUpdateDocumentUploadLimit();
  const [mb, setMb] = useState('');

  useEffect(() => {
    if (data) setMb(String(data.maxUploadMb));
  }, [data]);

  const n = Number.parseInt(mb, 10);
  const valid = Number.isInteger(n) && n >= 1 && n <= 100;

  return (
    <div className="space-y-5 max-w-xl">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <p className="text-sm text-slate-500 -mt-3">Admin-only application configuration.</p>

      {isLoading && <p className="text-slate-500">Loading…</p>}
      {error && <p className="text-rose-700">{(error as Error).message}</p>}

      {data && (
        <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <h2 className="font-semibold text-brand">Supporting documents</h2>
          <label className="text-sm block">
            <span className="text-slate-600">Maximum upload size per file (MB)</span>
            <input
              type="number"
              min={1}
              max={100}
              value={mb}
              onChange={(e) => setMb(e.target.value)}
              className="mt-1 block w-32 border border-slate-300 rounded px-3 py-2"
            />
          </label>
          <p className="text-xs text-slate-500">
            Between 1 and 100 MB (100 MB is the hard ceiling the API will accept).
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => update.mutate(n)}
              disabled={!valid || update.isPending || n === data.maxUploadMb}
              className="bg-brand text-white rounded px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {update.isPending ? 'Saving…' : 'Save'}
            </button>
            {update.isSuccess && !update.isPending && (
              <span className="text-emerald-700 text-sm">Saved.</span>
            )}
            {update.isError && (
              <span className="text-rose-700 text-sm" role="alert">
                {(update.error as Error).message}
              </span>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
