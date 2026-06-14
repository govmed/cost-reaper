import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { getSsoStatus, ssoLoginUrl, type SsoStatus } from '../lib/api';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(() => {
    const e = new URLSearchParams(window.location.search).get('sso_error');
    return e ? `SSO sign-in failed: ${e}` : null;
  });
  const [busy, setBusy] = useState(false);
  const [sso, setSso] = useState<SsoStatus | null>(null);

  useEffect(() => {
    void getSsoStatus().then(setSso);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="max-w-sm mx-auto mt-16 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4"
    >
      <h1 className="text-xl font-semibold text-brand">Sign in</h1>
      {error && <div className="text-sm text-rose-700 bg-rose-50 rounded px-3 py-2">{error}</div>}

      {/* Built-in (LOCAL) identity — hidden when SSO is forced. */}
      {!sso?.forceSso && (
        <>
          <label className="block text-sm">
            <span className="text-slate-600">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full border border-slate-300 rounded px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full border border-slate-300 rounded px-3 py-2"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-brand text-white rounded py-2 font-medium disabled:opacity-60"
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </>
      )}

      {sso?.enabled && (
        <>
          {!sso.forceSso && (
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="h-px flex-1 bg-slate-200" />
              or
              <span className="h-px flex-1 bg-slate-200" />
            </div>
          )}
          <a
            href={ssoLoginUrl()}
            className="block text-center w-full border border-brand text-brand rounded py-2 font-medium hover:bg-teal-50"
          >
            Sign in with {sso.displayName}
          </a>
        </>
      )}
    </form>
  );
}
