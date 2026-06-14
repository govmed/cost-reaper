import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useChecklistRules, useChecklistRuleMutations } from '../lib/queries';
import type { ChecklistRuleAdmin } from '../lib/types';

const SEVERITIES = ['BLOCKER', 'WARNING', 'INFO'];
const SCOPES = ['ESTIMATE', 'LABOR', 'NONLABOR', 'CLOUD', 'RESOURCE'];

const severityClass: Record<string, string> = {
  BLOCKER: 'text-rose-700 bg-rose-50',
  WARNING: 'text-amber-700 bg-amber-50',
  INFO: 'text-slate-600 bg-slate-100',
};

/** Admin authoring of the smart-checklist rules (FR-25, FE-44). */
export default function ChecklistRulesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const { data, isLoading, error } = useChecklistRules();
  const m = useChecklistRuleMutations();

  const mutationError = (m.create.error || m.update.error || m.remove.error) ?? null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Checklist rules</h1>
        <p className="text-sm text-slate-500 max-w-2xl">
          Configure the smart checklist that validates estimates and gates workflow transitions
          (FR-25). Toggle a rule on/off, change its severity, or add an advisory rule. A failing{' '}
          <span className="font-medium text-rose-700">BLOCKER</span> stops an estimate from
          advancing.
        </p>
      </div>

      {isLoading && <p className="text-slate-500">Loading…</p>}
      {error && <p className="text-rose-700">{(error as Error).message}</p>}
      {mutationError && (
        <p
          className="text-rose-700 text-sm bg-rose-50 border border-rose-200 rounded px-3 py-2"
          role="alert"
        >
          {(mutationError as Error).message}
        </p>
      )}

      {data && (
        <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <table className="w-full text-sm">
            <thead className="text-slate-500 text-left">
              <tr>
                <th className="px-2 py-1">Rule</th>
                <th className="px-2 py-1">Scope</th>
                <th className="px-2 py-1">Severity</th>
                <th className="px-2 py-1">Logic</th>
                <th className="px-2 py-1 text-center">Active</th>
                {isAdmin && <th className="px-2 py-1"></th>}
              </tr>
            </thead>
            <tbody>
              {data.map((r) => (
                <RuleRow key={r.id} r={r} isAdmin={isAdmin} m={m} />
              ))}
            </tbody>
          </table>
          {isAdmin && <AddRuleRow m={m} />}
          <p className="text-xs text-slate-400">
            “Advisory” rules have no built-in check, so they always pass — useful as reminders.
            Built-in rules can be deactivated or re-tuned but not deleted.
          </p>
        </section>
      )}
    </div>
  );
}

type Mutations = ReturnType<typeof useChecklistRuleMutations>;

function RuleRow({ r, isAdmin, m }: { r: ChecklistRuleAdmin; isAdmin: boolean; m: Mutations }) {
  return (
    <tr className="border-t border-slate-100">
      <td className="px-2 py-1">
        <div className="font-mono text-xs text-slate-500">{r.key}</div>
        {isAdmin ? (
          <input
            defaultValue={r.description}
            onBlur={(e) => {
              if (e.target.value.trim() && e.target.value !== r.description)
                m.update.mutate({ id: r.id, body: { description: e.target.value.trim() } });
            }}
            className="border border-slate-200 rounded px-2 py-0.5 w-full min-w-64"
          />
        ) : (
          r.description
        )}
      </td>
      <td className="px-2 py-1 text-xs text-slate-500">{r.scope}</td>
      <td className="px-2 py-1">
        {isAdmin ? (
          <select
            value={r.severity}
            onChange={(e) => m.update.mutate({ id: r.id, body: { severity: e.target.value } })}
            className={`border border-slate-200 rounded px-2 py-0.5 ${severityClass[r.severity] ?? ''}`}
          >
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        ) : (
          <span className={`rounded px-1.5 py-0.5 text-xs ${severityClass[r.severity] ?? ''}`}>
            {r.severity}
          </span>
        )}
      </td>
      <td className="px-2 py-1 text-xs">
        {r.hasLogic ? (
          <span className="text-emerald-700">built-in check</span>
        ) : (
          <span className="text-slate-400" title="No built-in logic — always passes">
            advisory
          </span>
        )}
      </td>
      <td className="px-2 py-1 text-center">
        <input
          type="checkbox"
          checked={r.isActive}
          disabled={!isAdmin}
          onChange={(e) => m.update.mutate({ id: r.id, body: { isActive: e.target.checked } })}
          title="Active"
        />
      </td>
      {isAdmin && (
        <td className="px-2 py-1 text-right">
          {!r.isBuiltin ? (
            <button
              onClick={() => m.remove.mutate(r.id)}
              className="text-rose-600 hover:underline text-xs"
            >
              Delete
            </button>
          ) : (
            <span className="text-slate-300 text-xs" title="Built-in rules can’t be deleted">
              built-in
            </span>
          )}
        </td>
      )}
    </tr>
  );
}

function AddRuleRow({ m }: { m: Mutations }) {
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('WARNING');
  const [scope, setScope] = useState('ESTIMATE');

  function add() {
    const k = key.trim().toLowerCase();
    if (!k || !description.trim()) return;
    m.create.mutate(
      { key: k, description: description.trim(), severity, scope },
      {
        onSuccess: () => {
          setKey('');
          setDescription('');
          setSeverity('WARNING');
          setScope('ESTIMATE');
        },
      },
    );
  }

  return (
    <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-slate-100">
      <input
        value={key}
        onChange={(e) => setKey(e.target.value)}
        className="border border-slate-300 rounded px-2 py-1 text-sm w-44 font-mono"
        placeholder="rule_key"
      />
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="border border-slate-300 rounded px-2 py-1 text-sm flex-1 min-w-56"
        placeholder="What this rule checks"
      />
      <select
        value={scope}
        onChange={(e) => setScope(e.target.value)}
        className="border border-slate-300 rounded px-2 py-1 text-sm"
        title="Scope"
      >
        {SCOPES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <select
        value={severity}
        onChange={(e) => setSeverity(e.target.value)}
        className="border border-slate-300 rounded px-2 py-1 text-sm"
        title="Severity"
      >
        {SEVERITIES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <button
        onClick={add}
        disabled={!key.trim() || !description.trim() || m.create.isPending}
        className="bg-slate-800 text-white rounded px-3 py-1 text-sm disabled:opacity-50"
      >
        Add rule
      </button>
    </div>
  );
}
