import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useChecklistRuleSets, useChecklistRuleSetMutations } from '../lib/queries';
import type { ChecklistRuleSet } from '../lib/types';

/** Repo of smart-checklist rule sets (FR-25) — list + admin create/update/delete. */
export default function ChecklistRuleSetsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const { data, isLoading, error } = useChecklistRuleSets();
  const m = useChecklistRuleSetMutations();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const mutationError = (m.create.error || m.update.error || m.remove.error) ?? null;

  function add() {
    if (!name.trim()) return;
    m.create.mutate(
      { name: name.trim(), description: description.trim() || undefined },
      {
        onSuccess: () => {
          setName('');
          setDescription('');
        },
      },
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Checklist rule sets</h1>
        <p className="text-sm text-slate-500 max-w-2xl">
          A repository of smart-checklist rule sets. Each has a system-assigned key; you give it a
          label and description. The <span className="font-medium">default</span> set validates
          every estimate and gates workflow transitions (FR-25). Open one to author its rules.
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
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-slate-600 text-left">
              <tr>
                <th className="px-4 py-2">Key</th>
                <th className="px-4 py-2">Label</th>
                <th className="px-4 py-2">Description</th>
                <th className="px-4 py-2 text-center">Rules</th>
                <th className="px-4 py-2 text-center">Active</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {data.map((s) => (
                <RuleSetRow key={s.id} s={s} isAdmin={isAdmin} m={m} />
              ))}
            </tbody>
          </table>
          {isAdmin && (
            <div className="flex flex-wrap gap-2 items-center p-3 border-t border-slate-100">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="New rule set label"
                className="border border-slate-300 rounded px-2 py-1 text-sm w-56"
              />
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
                className="border border-slate-300 rounded px-2 py-1 text-sm flex-1 min-w-56"
              />
              <button
                onClick={add}
                disabled={!name.trim() || m.create.isPending}
                className="bg-slate-800 text-white rounded px-3 py-1 text-sm disabled:opacity-50"
              >
                Create rule set
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type Repo = ReturnType<typeof useChecklistRuleSetMutations>;

function RuleSetRow({ s, isAdmin, m }: { s: ChecklistRuleSet; isAdmin: boolean; m: Repo }) {
  return (
    <tr className="border-t border-slate-100 align-top">
      <td className="px-4 py-2 font-mono text-xs text-slate-500 whitespace-nowrap">
        {s.key}
        {s.isDefault && <span className="ml-1 text-brand">· default</span>}
      </td>
      <td className="px-4 py-2">
        {isAdmin ? (
          <input
            defaultValue={s.name}
            onBlur={(e) => {
              if (e.target.value.trim() && e.target.value !== s.name)
                m.update.mutate({ id: s.id, body: { name: e.target.value.trim() } });
            }}
            className="border border-slate-200 rounded px-2 py-0.5 w-48"
          />
        ) : (
          <span className="font-medium">{s.name}</span>
        )}
      </td>
      <td className="px-4 py-2">
        {isAdmin ? (
          <input
            defaultValue={s.description ?? ''}
            placeholder="add context…"
            onBlur={(e) => {
              if (e.target.value !== (s.description ?? ''))
                m.update.mutate({ id: s.id, body: { description: e.target.value } });
            }}
            className="border border-slate-200 rounded px-2 py-0.5 w-full min-w-48"
          />
        ) : (
          (s.description ?? '—')
        )}
      </td>
      <td className="px-4 py-2 text-center tabular-nums">{s.ruleCount}</td>
      <td className="px-4 py-2 text-center">
        <input
          type="checkbox"
          checked={s.isActive}
          disabled={!isAdmin}
          onChange={(e) => m.update.mutate({ id: s.id, body: { isActive: e.target.checked } })}
        />
      </td>
      <td className="px-4 py-2 text-right whitespace-nowrap">
        <Link to={`/checklist-rules/${s.id}`} className="text-brand hover:underline text-xs">
          Edit rules →
        </Link>
        {isAdmin && !s.isDefault && (
          <button
            onClick={() => m.remove.mutate(s.id)}
            className="ml-3 text-rose-600 hover:underline text-xs"
          >
            Delete
          </button>
        )}
      </td>
    </tr>
  );
}
