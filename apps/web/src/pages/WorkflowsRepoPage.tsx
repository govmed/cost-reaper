import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useWorkflows, useWorkflowRepoMutations } from '../lib/queries';
import type { WorkflowSummary } from '../lib/types';

/** Repo of approval workflows (FR-24) — list + admin create/update/delete. */
export default function WorkflowsRepoPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const { data, isLoading, error } = useWorkflows();
  const m = useWorkflowRepoMutations();
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
        <h1 className="text-2xl font-semibold">Workflows</h1>
        <p className="text-sm text-slate-500 max-w-2xl">
          A repository of approval workflows. Each has a system-assigned key; you give it a label
          and description. Open one to author its stages and transitions (FR-24).
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
                <th className="px-4 py-2 text-center">Stages</th>
                <th className="px-4 py-2 text-center">Transitions</th>
                <th className="px-4 py-2 text-center">Active</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {data.map((w) => (
                <WorkflowRow key={w.id} w={w} isAdmin={isAdmin} m={m} />
              ))}
            </tbody>
          </table>
          {isAdmin && (
            <div className="flex flex-wrap gap-2 items-center p-3 border-t border-slate-100">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="New workflow label"
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
                Create workflow
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type Repo = ReturnType<typeof useWorkflowRepoMutations>;

function WorkflowRow({ w, isAdmin, m }: { w: WorkflowSummary; isAdmin: boolean; m: Repo }) {
  return (
    <tr className="border-t border-slate-100 align-top">
      <td className="px-4 py-2 font-mono text-xs text-slate-500 whitespace-nowrap">
        {w.key}
        {w.isDefault && <span className="ml-1 text-brand">· default</span>}
      </td>
      <td className="px-4 py-2">
        {isAdmin ? (
          <input
            defaultValue={w.name}
            onBlur={(e) => {
              if (e.target.value.trim() && e.target.value !== w.name)
                m.update.mutate({ id: w.id, body: { name: e.target.value.trim() } });
            }}
            className="border border-slate-200 rounded px-2 py-0.5 w-48"
          />
        ) : (
          <span className="font-medium">{w.name}</span>
        )}
      </td>
      <td className="px-4 py-2">
        {isAdmin ? (
          <input
            defaultValue={w.description ?? ''}
            placeholder="add context…"
            onBlur={(e) => {
              if (e.target.value !== (w.description ?? ''))
                m.update.mutate({ id: w.id, body: { description: e.target.value } });
            }}
            className="border border-slate-200 rounded px-2 py-0.5 w-full min-w-48"
          />
        ) : (
          (w.description ?? '—')
        )}
      </td>
      <td className="px-4 py-2 text-center tabular-nums">{w.stageCount}</td>
      <td className="px-4 py-2 text-center tabular-nums">{w.transitionCount}</td>
      <td className="px-4 py-2 text-center">
        <input
          type="checkbox"
          checked={w.isActive}
          disabled={!isAdmin}
          onChange={(e) => m.update.mutate({ id: w.id, body: { isActive: e.target.checked } })}
        />
      </td>
      <td className="px-4 py-2 text-right whitespace-nowrap">
        <Link to={`/workflows/${w.id}`} className="text-brand hover:underline text-xs">
          Edit stages →
        </Link>
        {isAdmin && !w.isDefault && (
          <button
            onClick={() => m.remove.mutate(w.id)}
            className="ml-3 text-rose-600 hover:underline text-xs"
          >
            Delete
          </button>
        )}
      </td>
    </tr>
  );
}
