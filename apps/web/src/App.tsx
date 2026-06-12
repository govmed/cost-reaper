import { useEffect, useState } from 'react';

const apiBase = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1';
const healthUrl = new URL('/health', apiBase).toString();

type Status = 'checking' | 'ok' | 'down';

export default function App() {
  const [status, setStatus] = useState<Status>('checking');

  useEffect(() => {
    let cancelled = false;
    fetch(healthUrl)
      .then((res) => {
        if (!cancelled) setStatus(res.ok ? 'ok' : 'down');
      })
      .catch(() => {
        if (!cancelled) setStatus('down');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const badge =
    status === 'ok'
      ? 'bg-emerald-100 text-emerald-800'
      : status === 'down'
        ? 'bg-rose-100 text-rose-800'
        : 'bg-slate-100 text-slate-600';

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans flex items-center justify-center p-6">
      <div className="max-w-xl w-full rounded-2xl bg-white shadow-sm border border-slate-200 p-8">
        <h1 className="text-2xl font-semibold text-brand">cost-reaper</h1>
        <p className="mt-2 text-slate-600">
          Technology Project Cost Estimator — Sprint&nbsp;0 foundation is up.
        </p>

        <div className="mt-6 flex items-center gap-3">
          <span className="text-sm text-slate-500">API health:</span>
          <span className={`text-sm font-medium px-2.5 py-1 rounded-full ${badge}`}>
            {status === 'checking' ? 'checking…' : status === 'ok' ? 'healthy' : 'unreachable'}
          </span>
        </div>

        <dl className="mt-6 text-sm text-slate-500 space-y-1">
          <div className="flex gap-2">
            <dt className="font-medium text-slate-600">API</dt>
            <dd>{apiBase}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-medium text-slate-600">Docs</dt>
            <dd>{new URL('/docs', apiBase).toString()}</dd>
          </div>
        </dl>
      </div>
    </main>
  );
}
