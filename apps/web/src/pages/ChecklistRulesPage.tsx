import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useChecklistRules, useChecklistRuleMutations, useChecklistRuleSets } from '../lib/queries';
import { useRefLabeler } from '../lib/refLabels';
import { CHECKLIST_RULE_CATALOG } from '../lib/types';
import type { ChecklistRuleAdmin } from '../lib/types';

// Fallback option lists (codes) used until the DB reference labels load (FR-29).
const SEVERITIES = ['BLOCKER', 'WARNING', 'INFO'];
const SCOPES = ['ESTIMATE', 'LABOR', 'NONLABOR', 'CLOUD', 'RESOURCE'];

const severityClass: Record<string, string> = {
  BLOCKER: 'text-rose-700 bg-rose-50',
  WARNING: 'text-amber-700 bg-amber-50',
  INFO: 'text-slate-600 bg-slate-100',
};

/** Admin authoring of the smart-checklist rules in one rule set (FR-25, FE-44). */
export default function ChecklistRulesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const { id: ruleSetId } = useParams();
  const { data, isLoading, error } = useChecklistRules(ruleSetId);
  const { data: sets } = useChecklistRuleSets();
  const m = useChecklistRuleMutations();
  const set = sets?.find((s) => s.id === ruleSetId);

  const mutationError = (m.create.error || m.update.error || m.remove.error) ?? null;

  return (
    <div className="space-y-5">
      <div>
        <Link to="/checklist-rules" className="text-brand hover:underline text-sm">
          ← Rule sets
        </Link>
        <h1 className="text-2xl font-semibold mt-1">
          {set ? set.name : 'Checklist rules'}
          {set && <span className="ml-2 font-mono text-sm text-slate-400">{set.key}</span>}
        </h1>
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
          {isAdmin && (
            <AddRuleRow
              m={m}
              ruleSetId={ruleSetId}
              existingKeys={new Set((data ?? []).map((r) => r.key))}
            />
          )}
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
  const sev = useRefLabeler('CHECKLIST_SEVERITY');
  const scope = useRefLabeler('CHECKLIST_SCOPE');
  const sevOptions = sev.ready ? sev.options : SEVERITIES.map((c) => ({ code: c, label: c }));
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
      <td className="px-2 py-1 text-xs text-slate-500">{scope.label(r.scope)}</td>
      <td className="px-2 py-1">
        {isAdmin ? (
          <select
            value={r.severity}
            onChange={(e) => m.update.mutate({ id: r.id, body: { severity: e.target.value } })}
            className={`border border-slate-200 rounded px-2 py-0.5 ${severityClass[r.severity] ?? ''}`}
          >
            {sevOptions.map((o) => (
              <option key={o.code} value={o.code}>
                {o.label}
              </option>
            ))}
          </select>
        ) : (
          <span className={`rounded px-1.5 py-0.5 text-xs ${severityClass[r.severity] ?? ''}`}>
            {sev.label(r.severity)}
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

const CUSTOM = '__custom__';

function AddRuleRow({
  m,
  ruleSetId,
  existingKeys,
}: {
  m: Mutations;
  ruleSetId?: string;
  existingKeys: Set<string>;
}) {
  const sevLabeler = useRefLabeler('CHECKLIST_SEVERITY');
  const scopeLabeler = useRefLabeler('CHECKLIST_SCOPE');
  const sevOptions = sevLabeler.ready
    ? sevLabeler.options
    : SEVERITIES.map((c) => ({ code: c, label: c }));
  const scopeOptions = scopeLabeler.ready
    ? scopeLabeler.options
    : SCOPES.map((c) => ({ code: c, label: c }));

  // Pick a real built-in rule by its description; only offer ones not already in
  // this set. The rule key + sensible defaults come from the catalog (FR-25), so
  // the user never has to know the underlying rule_key.
  const available = CHECKLIST_RULE_CATALOG.filter((r) => !existingKeys.has(r.key));

  const [selected, setSelected] = useState(''); // a catalog key, CUSTOM, or ''
  const [customKey, setCustomKey] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('WARNING');
  const [scope, setScope] = useState('ESTIMATE');
  const isCustom = selected === CUSTOM;

  function onSelect(v: string) {
    setSelected(v);
    if (v === CUSTOM || v === '') {
      setCustomKey('');
      setDescription('');
      setSeverity('WARNING');
      setScope('ESTIMATE');
      return;
    }
    const e = CHECKLIST_RULE_CATALOG.find((r) => r.key === v);
    if (e) {
      setDescription(e.description);
      setSeverity(e.severity);
      setScope(e.scope);
    }
  }

  const effectiveKey = isCustom ? customKey.trim().toLowerCase() : selected;
  const keyOk = !isCustom || /^[a-z][a-z0-9_]*$/.test(effectiveKey);
  const valid = !!effectiveKey && description.trim().length > 0 && keyOk;

  function reset() {
    setSelected('');
    setCustomKey('');
    setDescription('');
    setSeverity('WARNING');
    setScope('ESTIMATE');
  }
  function add() {
    if (!valid) return;
    m.create.mutate(
      { key: effectiveKey, description: description.trim(), severity, scope, ruleSetId },
      { onSuccess: reset },
    );
  }

  return (
    <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-slate-100">
      <select
        value={selected}
        onChange={(e) => onSelect(e.target.value)}
        className="border border-slate-300 rounded px-2 py-1 text-sm min-w-72"
        title="Rule"
      >
        <option value="">Select a rule…</option>
        {available.map((r) => (
          <option key={r.key} value={r.key}>
            {r.description}
          </option>
        ))}
        <option value={CUSTOM}>➕ Custom advisory rule…</option>
      </select>
      {isCustom && (
        <>
          <input
            value={customKey}
            onChange={(e) => setCustomKey(e.target.value)}
            className="border border-slate-300 rounded px-2 py-1 text-sm w-40 font-mono"
            placeholder="rule_key"
            title="lower_snake_case key"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border border-slate-300 rounded px-2 py-1 text-sm flex-1 min-w-56"
            placeholder="What this rule checks"
          />
        </>
      )}
      <select
        value={scope}
        onChange={(e) => setScope(e.target.value)}
        className="border border-slate-300 rounded px-2 py-1 text-sm"
        title="Scope"
        disabled={!selected}
      >
        {scopeOptions.map((o) => (
          <option key={o.code} value={o.code}>
            {o.label}
          </option>
        ))}
      </select>
      <select
        value={severity}
        onChange={(e) => setSeverity(e.target.value)}
        className="border border-slate-300 rounded px-2 py-1 text-sm"
        title="Severity"
        disabled={!selected}
      >
        {sevOptions.map((o) => (
          <option key={o.code} value={o.code}>
            {o.label}
          </option>
        ))}
      </select>
      <button
        onClick={add}
        disabled={!valid || m.create.isPending}
        className="bg-slate-800 text-white rounded px-3 py-1 text-sm disabled:opacity-50"
      >
        Add rule
      </button>
    </div>
  );
}
