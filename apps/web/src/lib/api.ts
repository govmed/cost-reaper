import type { LoginResponse } from './types';

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1';

let accessToken: string | null = localStorage.getItem('accessToken');
let refreshToken: string | null = localStorage.getItem('refreshToken');

export function setTokens(a: string | null, r: string | null): void {
  accessToken = a;
  refreshToken = r;
  if (a) localStorage.setItem('accessToken', a);
  else localStorage.removeItem('accessToken');
  if (r) localStorage.setItem('refreshToken', r);
  else localStorage.removeItem('refreshToken');
}

function request(path: string, init: RequestInit, auth: boolean): Promise<Response> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set('Content-Type', 'application/json');
  if (auth && accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  return fetch(`${BASE}${path}`, { ...init, headers });
}

async function tryRefresh(): Promise<boolean> {
  if (!refreshToken) return false;
  const res = await request(
    '/auth/refresh',
    {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    },
    false,
  );
  if (!res.ok) return false;
  const data = (await res.json()) as { accessToken: string; refreshToken: string };
  setTokens(data.accessToken, data.refreshToken);
  return true;
}

export async function api<T>(path: string, init: RequestInit = {}, auth = true): Promise<T> {
  let res = await request(path, init, auth);
  if (res.status === 401 && auth && (await tryRefresh())) {
    res = await request(path, init, auth);
  }
  if (!res.ok) {
    let message = res.statusText;
    try {
      const problem = (await res.json()) as { detail?: string; title?: string };
      message = problem.detail ?? problem.title ?? message;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  const contentType = res.headers.get('content-type') ?? '';
  return contentType.includes('application/json')
    ? ((await res.json()) as T)
    : ((await res.text()) as unknown as T);
}

export async function login(email: string, password: string): Promise<LoginResponse['user']> {
  const data = await api<LoginResponse>(
    '/auth/login',
    { method: 'POST', body: JSON.stringify({ email, password }) },
    false,
  );
  setTokens(data.accessToken, data.refreshToken);
  return data.user;
}

// ── Single Sign-On (FR-26) ───────────────────────────────────────────────────
export interface SsoStatus {
  /** Active identity system: LOCAL (built-in) or an external SSO protocol. */
  mode: string;
  enabled: boolean;
  protocol: string | null;
  displayName: string | null;
  /** When true, the built-in password form is hidden (SSO is the only option). */
  forceSso: boolean;
}

/** Public: which identity system is active, and the SSO button label. Never throws. */
export async function getSsoStatus(): Promise<SsoStatus> {
  try {
    return await api<SsoStatus>('/auth/sso', {}, false);
  } catch {
    return { mode: 'LOCAL', enabled: false, protocol: null, displayName: null, forceSso: false };
  }
}

/** The API endpoint that redirects the browser to the configured IdP. */
export function ssoLoginUrl(): string {
  return `${BASE}/auth/sso/login`;
}

/** Fetch the CSV with the auth header and trigger a browser download. */
async function downloadExport(path: string, filename: string): Promise<void> {
  let res = await request(path, {}, true);
  if (res.status === 401 && (await tryRefresh())) res = await request(path, {}, true);
  if (!res.ok) throw new Error('Export failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadCsv(id: string, name: string): Promise<void> {
  return downloadExport(`/estimates/${id}/export`, `${name || 'estimate'}.csv`);
}

export function downloadExcel(id: string, name: string): Promise<void> {
  return downloadExport(`/estimates/${id}/export-excel`, `${name || 'estimate'}.xlsx`);
}
