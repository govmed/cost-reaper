import { useState } from 'react';
import { useUserMutations, useUsers } from '../lib/queries';

const ROLES = ['ADMIN', 'ESTIMATOR', 'VIEWER'];

export default function UsersPage() {
  const { data, isLoading, error } = useUsers();
  const m = useUserMutations();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('ESTIMATOR');
  const [displayName, setDisplayName] = useState('');

  async function onCreate() {
    if (!email.trim() || password.length < 8) return;
    await m.create.mutateAsync({
      email,
      password,
      role,
      displayName: displayName.trim() || undefined,
    });
    setEmail('');
    setPassword('');
    setDisplayName('');
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Users</h1>
      <p className="text-sm text-slate-500 -mt-3">
        Admin-only: manage accounts, roles, and access (deny-by-default RBAC).
      </p>

      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap gap-2 items-end">
        <label className="text-sm">
          <span className="text-slate-600">Email</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            className="mt-1 block border border-slate-300 rounded px-3 py-2 w-56"
          />
        </label>
        <label className="text-sm">
          <span className="text-slate-600">Password (≥8)</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            className="mt-1 block border border-slate-300 rounded px-3 py-2 w-44"
          />
        </label>
        <label className="text-sm">
          <span className="text-slate-600">Name</span>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1 block border border-slate-300 rounded px-3 py-2 w-44"
          />
        </label>
        <label className="text-sm">
          <span className="text-slate-600">Role</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="mt-1 block border border-slate-300 rounded px-3 py-2"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={onCreate}
          disabled={m.create.isPending || !email.trim() || password.length < 8}
          className="bg-brand text-white rounded px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          Add user
        </button>
      </div>

      {isLoading && <p className="text-slate-500">Loading…</p>}
      {error && <p className="text-rose-700">{(error as Error).message}</p>}
      {data && (
        <table className="w-full bg-white border border-slate-200 rounded-xl overflow-hidden text-sm">
          <thead className="bg-slate-100 text-slate-600 text-left">
            <tr>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Active</th>
              <th className="px-4 py-2">Last login</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {data.map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-medium">{u.email}</td>
                <td className="px-4 py-2">{u.displayName ?? '—'}</td>
                <td className="px-4 py-2">
                  <select
                    value={u.role}
                    onChange={(e) => m.update.mutate({ id: u.id, body: { role: e.target.value } })}
                    className="border border-slate-200 rounded px-2 py-1"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2">
                  <input
                    type="checkbox"
                    checked={u.isActive}
                    onChange={(e) =>
                      m.update.mutate({ id: u.id, body: { isActive: e.target.checked } })
                    }
                  />
                </td>
                <td className="px-4 py-2 text-slate-500">
                  {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-2 text-right">
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete user "${u.email}"?`)) m.remove.mutate(u.id);
                    }}
                    className="text-rose-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
