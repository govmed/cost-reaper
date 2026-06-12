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
  const res = await request('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  }, false);
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

/** Fetch the CSV with the auth header and trigger a browser download. */
export async function downloadCsv(id: string, name: string): Promise<void> {
  let res = await request(`/estimates/${id}/export`, {}, true);
  if (res.status === 401 && (await tryRefresh())) res = await request(`/estimates/${id}/export`, {}, true);
  if (!res.ok) throw new Error('Export failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name || 'estimate'}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
