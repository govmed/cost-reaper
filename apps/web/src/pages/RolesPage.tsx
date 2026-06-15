import { useAuth } from '../lib/auth';
import { useRefLabeler } from '../lib/refLabels';
import {
  ROLES,
  ROLE_CAPABILITIES,
  ROLE_CAPABILITY_CATEGORIES,
  ROLE_LABELS,
  ROLE_SUMMARIES,
} from '../lib/roleCapabilities';
import type { Role } from '../lib/types';

/** What each role can and cannot do (FR-2, NFR-16) — read-only reference. */
export default function RolesPage() {
  const { user } = useAuth();
  const myRole = user?.role as Role | undefined;
  // Role display labels come from the DB reference data (FR-29); ROLE_LABELS is
  // the fallback used until they load. Codes (the matrix keys) stay code-coupled.
  const roleLabeler = useRefLabeler('ROLE');
  const roleLabel = (r: Role): string => {
    return roleLabeler.ready ? roleLabeler.label(r) : ROLE_LABELS[r];
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Roles &amp; permissions</h1>
        <p className="text-sm text-slate-500 max-w-2xl">
          Access is <span className="font-medium">deny-by-default</span> and enforced on the server
          for every action. This is what each role can and cannot do.
          {myRole && (
            <>
              {' '}
              You are signed in as{' '}
              <span className="font-medium text-brand">{roleLabel(myRole)}</span>.
            </>
          )}
        </p>
      </div>

      {/* Role summaries */}
      <div className="grid sm:grid-cols-3 gap-3">
        {ROLES.map((r) => (
          <div
            key={r}
            className={`rounded-xl border p-4 ${
              r === myRole ? 'border-brand bg-teal-50' : 'border-slate-200 bg-white'
            }`}
          >
            <div className="font-semibold text-brand">{roleLabel(r)}</div>
            <p className="text-xs text-slate-500 mt-1">{ROLE_SUMMARIES[r]}</p>
          </div>
        ))}
      </div>

      {/* Capability matrix */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-4 py-2 text-left">Capability</th>
              {ROLES.map((r) => (
                <th key={r} className={`px-4 py-2 text-center ${r === myRole ? 'text-brand' : ''}`}>
                  {roleLabel(r)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROLE_CAPABILITY_CATEGORIES.map((category) => (
              <CategoryRows key={category} category={category} myRole={myRole} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CategoryRows({ category, myRole }: { category: string; myRole: Role | undefined }) {
  const caps = ROLE_CAPABILITIES.filter((c) => c.category === category);
  if (caps.length === 0) return null;
  return (
    <>
      <tr className="bg-slate-50">
        <td
          colSpan={1 + ROLES.length}
          className="px-4 py-1 text-xs uppercase tracking-wide text-slate-400"
        >
          {category}
        </td>
      </tr>
      {caps.map((c) => (
        <tr key={c.key} className="border-t border-slate-100 align-top">
          <td className="px-4 py-2">
            <div className="font-medium text-slate-800">{c.label}</div>
            <div className="text-xs text-slate-500">{c.description}</div>
          </td>
          {ROLES.map((r) => (
            <td key={r} className={`px-4 py-2 text-center ${r === myRole ? 'bg-teal-50/60' : ''}`}>
              {c.roles[r] ? (
                <span className="text-emerald-600" title="Allowed">
                  ✓
                </span>
              ) : (
                <span className="text-slate-300" title="Not allowed">
                  ✕
                </span>
              )}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
