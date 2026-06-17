import { useMemo, useState } from 'react';
import { useAuth } from '../lib/auth';
import { usePermissionCatalog, useRoleMutations, useRoles } from '../lib/queries';
import type { PermissionMeta, RoleDto } from '../lib/types';

/**
 * Roles & permissions (FR-30, NFR-16). Admins create roles and toggle the
 * permissions each grants; access is deny-by-default and enforced server-side.
 * The built-in ADMIN role holds the wildcard (all permissions, locked).
 */
export default function RolesPage() {
  const { user } = useAuth();
  const canManage = user?.role === 'ADMIN';
  const { data: roles, isLoading, error } = useRoles();
  const { data: catalog } = usePermissionCatalog();
  const m = useRoleMutations();

  const groups = useMemo(() => {
    const byGroup = new Map<string, PermissionMeta[]>();
    for (const p of catalog ?? []) {
      const list = byGroup.get(p.group) ?? [];
      list.push(p);
      byGroup.set(p.group, list);
    }
    return [...byGroup.entries()];
  }, [catalog]);

  if (isLoading) return <p className="text-slate-500">Loading…</p>;
  if (error) return <p className="text-rose-700">{(error as Error).message}</p>;
  if (!roles) return null;

  const isAll = (r: RoleDto) => r.permissions.includes('*');
  const toggle = (r: RoleDto, key: string) => {
    if (!canManage || isAll(r)) return;
    const next = r.permissions.includes(key)
      ? r.permissions.filter((p) => p !== key)
      : [...r.permissions, key];
    m.update.mutate({ id: r.id, body: { permissions: next } });
  };
  const myLabel = roles.find((r) => r.code === user?.role)?.displayName ?? user?.role;
  const mutationError = (m.create.error || m.update.error || m.remove.error) ?? null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Roles &amp; permissions</h1>
        <p className="text-sm text-slate-500 max-w-2xl">
          Access is <span className="font-medium">deny-by-default</span> and enforced on the server
          for every action.{' '}
          {canManage
            ? 'Create roles and toggle what each may do — changes apply immediately.'
            : 'This is what each role can and cannot do.'}
          {user && (
            <>
              {' '}
              You are signed in as <span className="font-medium text-brand">{myLabel}</span>.
            </>
          )}
        </p>
      </div>

      {mutationError && (
        <p
          className="text-rose-700 text-sm bg-rose-50 border border-rose-200 rounded px-3 py-2"
          role="alert"
        >
          {(mutationError as Error).message}
        </p>
      )}

      {/* Role summary cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {roles.map((r) => (
          <div
            key={r.id}
            className={`rounded-xl border p-4 ${
              r.code === user?.role ? 'border-brand bg-teal-50' : 'border-slate-200 bg-white'
            } ${r.isActive ? '' : 'opacity-60'}`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="font-semibold text-brand">{r.displayName}</div>
              <span className="text-[10px] uppercase tracking-wide text-slate-400">
                {r.isBuiltin ? 'Built-in' : 'Custom'}
              </span>
            </div>
            <div className="font-mono text-xs text-slate-400">{r.code}</div>
            {r.description && <p className="text-xs text-slate-500 mt-1">{r.description}</p>}
            <p className="text-xs text-slate-400 mt-2">
              {isAll(r) ? 'All permissions' : `${r.permissions.length} permission(s)`} ·{' '}
              {r.userCount} user(s)
            </p>
            {canManage && !r.isBuiltin && (
              <div className="flex gap-3 mt-2 text-xs">
                <button
                  onClick={() => m.update.mutate({ id: r.id, body: { isActive: !r.isActive } })}
                  className="text-slate-600 hover:underline"
                >
                  {r.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Delete role "${r.displayName}"?`)) m.remove.mutate(r.id);
                  }}
                  className="text-rose-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {canManage && (
        <NewRoleForm onCreate={(body) => m.create.mutate(body)} pending={m.create.isPending} />
      )}

      {/* Permission matrix */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-4 py-2 text-left">Permission</th>
              {roles.map((r) => (
                <th
                  key={r.id}
                  className={`px-3 py-2 text-center ${r.code === user?.role ? 'text-brand' : ''}`}
                >
                  {r.displayName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map(([group, perms]) => (
              <PermissionRows
                key={group}
                group={group}
                perms={perms}
                roles={roles}
                isAll={isAll}
                canManage={canManage}
                onToggle={toggle}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PermissionRows({
  group,
  perms,
  roles,
  isAll,
  canManage,
  onToggle,
}: {
  group: string;
  perms: PermissionMeta[];
  roles: RoleDto[];
  isAll: (r: RoleDto) => boolean;
  canManage: boolean;
  onToggle: (r: RoleDto, key: string) => void;
}) {
  return (
    <>
      <tr className="bg-slate-50">
        <td
          colSpan={1 + roles.length}
          className="px-4 py-1 text-xs uppercase tracking-wide text-slate-400"
        >
          {group}
        </td>
      </tr>
      {perms.map((p) => (
        <tr key={p.key} className="border-t border-slate-100 align-top">
          <td className="px-4 py-2">
            <div className="font-medium text-slate-800">{p.label}</div>
            <div className="text-xs text-slate-500">{p.description}</div>
          </td>
          {roles.map((r) => {
            const checked = isAll(r) || r.permissions.includes(p.key);
            const locked = !canManage || isAll(r);
            return (
              <td key={r.id} className="px-3 py-2 text-center">
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={locked}
                  onChange={() => onToggle(r, p.key)}
                  aria-label={`${p.label} for ${r.displayName}`}
                  title={isAll(r) ? 'Wildcard — all permissions' : p.label}
                />
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}

function NewRoleForm({
  onCreate,
  pending,
}: {
  onCreate: (body: { code: string; displayName: string; description?: string }) => void;
  pending: boolean;
}) {
  const [code, setCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const codeOk = /^[A-Z][A-Z0-9_]*$/.test(code);
  const valid = codeOk && displayName.trim().length > 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap gap-2 items-end">
      <div className="text-sm font-medium text-slate-600 w-full">Add a role</div>
      <label className="text-sm">
        <span className="text-slate-600 text-xs">Code (UPPER_SNAKE)</span>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="REVIEWER"
          className="mt-1 block border border-slate-300 rounded px-2 py-1 w-40 font-mono"
        />
      </label>
      <label className="text-sm">
        <span className="text-slate-600 text-xs">Display name</span>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Reviewer"
          className="mt-1 block border border-slate-300 rounded px-2 py-1 w-48"
        />
      </label>
      <label className="text-sm flex-1 min-w-48">
        <span className="text-slate-600 text-xs">Description (optional)</span>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 block border border-slate-300 rounded px-2 py-1 w-full"
        />
      </label>
      <button
        onClick={() => {
          onCreate({ code, displayName, description: description.trim() || undefined });
          setCode('');
          setDisplayName('');
          setDescription('');
        }}
        disabled={!valid || pending}
        className="bg-brand text-white rounded px-4 py-2 text-sm font-medium disabled:opacity-60"
      >
        Add role
      </button>
      {code && !codeOk && (
        <span className="text-xs text-amber-700 w-full">
          Code must be UPPER_SNAKE (A–Z, 0–9, _).
        </span>
      )}
    </div>
  );
}
