import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import type { AuthUser } from '../lib/types';

/** Receives the SSO tokens from the API redirect (URL fragment) and signs in. */
function b64urlToJson(s: string): unknown {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  return JSON.parse(atob(padded));
}

export default function SsoCallbackPage() {
  const { completeSso } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const access = hash.get('access');
    const refresh = hash.get('refresh');
    const userRaw = hash.get('user');
    if (access && refresh && userRaw) {
      try {
        const user = b64urlToJson(userRaw) as AuthUser;
        completeSso(access, refresh, user);
        navigate('/', { replace: true });
        return;
      } catch {
        /* fall through to error */
      }
    }
    navigate('/login?sso_error=Could%20not%20complete%20sign-in', { replace: true });
  }, [completeSso, navigate]);

  return <p className="text-slate-500 mt-16 text-center">Signing you in…</p>;
}
