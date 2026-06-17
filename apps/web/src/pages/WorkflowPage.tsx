import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useRoles, useWorkflowAuthoring, useWorkflowDefinition } from '../lib/queries';
import type { WorkflowDefinition, WorkflowStageDef } from '../lib/types';

// Fallback role codes used until the data-driven roles API loads (FR-30).
const FALLBACK_ROLES = ['ADMIN', 'GM', 'ESTIMATOR', 'VIEWER'];

/** Admin authoring of one workflow's stages + transitions (FR-24, FE-43). */
export default function WorkflowPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const { id = 'default' } = useParams<{ id: string }>();
  const { data, isLoading, error } = useWorkflowDefinition(id);
  const a = useWorkflowAuthoring(id);

  const mutationError =
    (a.addStage.error ||
      a.updateStage.error ||
      a.deleteStage.error ||
      a.addTransition.error ||
      a.updateTransition.error ||
      a.deleteTransition.error) ??
    null;

  return (
    <div className="space-y-5">
      <div>
        <Link to="/workflows" className="text-sm text-slate-500 hover:underline">
          ← Workflows
        </Link>
        <h1 className="text-2xl font-semibold">{data ? data.name : 'Workflow'}</h1>
        <p className="text-sm text-slate-500 max-w-2xl">
          {data?.key && <span className="font-mono text-xs text-slate-400">{data.key}</span>}
          {data?.description ? ` · ${data.description}` : ''}
          <br />
          Configure this workflow — its stages and the role-gated transitions between them.
          Transitions can require the smart checklist to pass (FR-24).
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
        <>
          <div className="text-sm text-slate-600">
            Editing: <span className="font-medium text-brand">{data.name}</span>
            {!isAdmin && <span className="text-slate-400"> · read-only (admins can edit)</span>}
          </div>
          <StagesSection wf={data} isAdmin={isAdmin} a={a} />
          <TransitionsSection wf={data} isAdmin={isAdmin} a={a} />
        </>
      )}
    </div>
  );
}

type Authoring = ReturnType<typeof useWorkflowAuthoring>;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      <h2 className="font-semibold text-brand">{title}</h2>
      {children}
    </section>
  );
}

function StagesSection({
  wf,
  isAdmin,
  a,
}: {
  wf: WorkflowDefinition;
  isAdmin: boolean;
  a: Authoring;
}) {
  const stages = [...wf.stages].sort((s1, s2) => s1.sortOrder - s2.sortOrder);
  const [key, setKey] = useState('');
  const [label, setLabel] = useState('');
  const [initial, setInitial] = useState(false);
  const [terminal, setTerminal] = useState(false);

  function add() {
    const k = key.trim().toUpperCase();
    if (!k || !label.trim()) return;
    a.addStage.mutate(
      { key: k, label: label.trim(), isInitial: initial, isTerminal: terminal },
      {
        onSuccess: () => {
          setKey('');
          setLabel('');
          setInitial(false);
          setTerminal(false);
        },
      },
    );
  }

  return (
    <Section title="Stages">
      <table className="w-full text-sm">
        <thead className="text-slate-500 text-left">
          <tr>
            <th className="px-2 py-1">Key</th>
            <th className="px-2 py-1">Label</th>
            <th className="px-2 py-1 text-right">Order</th>
            <th className="px-2 py-1 text-center">Initial</th>
            <th className="px-2 py-1 text-center">Terminal</th>
            {isAdmin && <th className="px-2 py-1"></th>}
          </tr>
        </thead>
        <tbody>
          {stages.map((s) => (
            <StageRow key={s.id} s={s} isAdmin={isAdmin} a={a} />
          ))}
        </tbody>
      </table>

      {isAdmin && (
        <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-slate-100">
          <input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="border border-slate-300 rounded px-2 py-1 text-sm w-40 uppercase"
            placeholder="STAGE_KEY"
          />
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="border border-slate-300 rounded px-2 py-1 text-sm w-40"
            placeholder="Label"
          />
          <label className="text-xs text-slate-600 flex items-center gap-1">
            <input
              type="checkbox"
              checked={initial}
              onChange={(e) => setInitial(e.target.checked)}
            />
            Initial
          </label>
          <label className="text-xs text-slate-600 flex items-center gap-1">
            <input
              type="checkbox"
              checked={terminal}
              onChange={(e) => setTerminal(e.target.checked)}
            />
            Terminal
          </label>
          <button
            onClick={add}
            disabled={!key.trim() || !label.trim() || a.addStage.isPending}
            className="bg-slate-800 text-white rounded px-3 py-1 text-sm disabled:opacity-50"
          >
            Add stage
          </button>
        </div>
      )}
    </Section>
  );
}

function StageRow({ s, isAdmin, a }: { s: WorkflowStageDef; isAdmin: boolean; a: Authoring }) {
  const save = (body: Record<string, unknown>) => a.updateStage.mutate({ id: s.id, body });
  return (
    <tr className="border-t border-slate-100">
      <td className="px-2 py-1 font-mono text-xs">{s.key}</td>
      <td className="px-2 py-1">
        {isAdmin ? (
          <input
            defaultValue={s.label}
            onBlur={(e) => {
              if (e.target.value.trim() && e.target.value !== s.label)
                save({ label: e.target.value.trim() });
            }}
            className="border border-slate-200 rounded px-2 py-0.5 w-40"
          />
        ) : (
          s.label
        )}
      </td>
      <td className="px-2 py-1 text-right tabular-nums">
        {isAdmin ? (
          <input
            type="number"
            defaultValue={s.sortOrder}
            onBlur={(e) => {
              const n = Number.parseInt(e.target.value, 10);
              if (!Number.isNaN(n) && n !== s.sortOrder) save({ sortOrder: n });
            }}
            className="border border-slate-200 rounded px-2 py-0.5 w-16 text-right"
          />
        ) : (
          s.sortOrder
        )}
      </td>
      <td className="px-2 py-1 text-center">
        <input
          type="checkbox"
          checked={s.isInitial}
          disabled={!isAdmin}
          onChange={(e) => save({ isInitial: e.target.checked })}
          title="Initial stage (only one)"
        />
      </td>
      <td className="px-2 py-1 text-center">
        <input
          type="checkbox"
          checked={s.isTerminal}
          disabled={!isAdmin}
          onChange={(e) => save({ isTerminal: e.target.checked })}
          title="Terminal stage"
        />
      </td>
      {isAdmin && (
        <td className="px-2 py-1 text-right">
          <button
            onClick={() => a.deleteStage.mutate(s.id)}
            className="text-rose-600 hover:underline text-xs"
          >
            Delete
          </button>
        </td>
      )}
    </tr>
  );
}

function TransitionsSection({
  wf,
  isAdmin,
  a,
}: {
  wf: WorkflowDefinition;
  isAdmin: boolean;
  a: Authoring;
}) {
  const labelOf = (k: string) => wf.stages.find((s) => s.key === k)?.label ?? k;
  // Gate transitions by any active role (FR-30) — including admin-created ones.
  const { data: rolesData } = useRoles();
  const ROLES = rolesData?.filter((r) => r.isActive).map((r) => r.code) ?? FALLBACK_ROLES;
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [role, setRole] = useState('ESTIMATOR');
  const [label, setLabel] = useState('');
  const [desc, setDesc] = useState('');
  const [requires, setRequires] = useState(true);

  function add() {
    if (!from || !to || !label.trim()) return;
    a.addTransition.mutate(
      {
        fromStageKey: from,
        toStageKey: to,
        allowedRole: role,
        label: label.trim(),
        description: desc.trim() || undefined,
        requiresChecklistPass: requires,
      },
      {
        onSuccess: () => {
          setFrom('');
          setTo('');
          setLabel('');
          setDesc('');
          setRequires(true);
        },
      },
    );
  }

  return (
    <Section title="Transitions">
      <table className="w-full text-sm">
        <thead className="text-slate-500 text-left">
          <tr>
            <th className="px-2 py-1">Key</th>
            <th className="px-2 py-1">From → To</th>
            <th className="px-2 py-1">Button label</th>
            <th className="px-2 py-1">Context</th>
            <th className="px-2 py-1">Allowed role</th>
            <th className="px-2 py-1 text-center">Needs checklist</th>
            {isAdmin && <th className="px-2 py-1"></th>}
          </tr>
        </thead>
        <tbody>
          {wf.transitions.map((t) => (
            <tr key={t.id} className="border-t border-slate-100">
              <td className="px-2 py-1 font-mono text-xs text-slate-400 whitespace-nowrap">
                {t.key}
              </td>
              <td className="px-2 py-1 whitespace-nowrap">
                {labelOf(t.fromStageKey)} <span className="text-slate-400">→</span>{' '}
                {labelOf(t.toStageKey)}
              </td>
              <td className="px-2 py-1">
                {isAdmin ? (
                  <input
                    defaultValue={t.label}
                    onBlur={(e) => {
                      if (e.target.value.trim() && e.target.value !== t.label)
                        a.updateTransition.mutate({
                          id: t.id,
                          body: { label: e.target.value.trim() },
                        });
                    }}
                    className="border border-slate-200 rounded px-2 py-0.5 w-40"
                  />
                ) : (
                  t.label
                )}
              </td>
              <td className="px-2 py-1">
                {isAdmin ? (
                  <input
                    defaultValue={t.description ?? ''}
                    placeholder="add context…"
                    onBlur={(e) => {
                      if (e.target.value !== (t.description ?? ''))
                        a.updateTransition.mutate({
                          id: t.id,
                          body: { description: e.target.value },
                        });
                    }}
                    className="border border-slate-200 rounded px-2 py-0.5 w-44"
                  />
                ) : (
                  (t.description ?? '—')
                )}
              </td>
              <td className="px-2 py-1">
                {isAdmin ? (
                  <select
                    value={t.allowedRole}
                    onChange={(e) =>
                      a.updateTransition.mutate({ id: t.id, body: { allowedRole: e.target.value } })
                    }
                    className="border border-slate-200 rounded px-2 py-0.5"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                ) : (
                  t.allowedRole
                )}
              </td>
              <td className="px-2 py-1 text-center">
                <input
                  type="checkbox"
                  checked={t.requiresChecklistPass}
                  disabled={!isAdmin}
                  onChange={(e) =>
                    a.updateTransition.mutate({
                      id: t.id,
                      body: { requiresChecklistPass: e.target.checked },
                    })
                  }
                />
              </td>
              {isAdmin && (
                <td className="px-2 py-1 text-right">
                  <button
                    onClick={() => a.deleteTransition.mutate(t.id)}
                    className="text-rose-600 hover:underline text-xs"
                  >
                    Delete
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {isAdmin && (
        <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-slate-100">
          <select
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="border border-slate-300 rounded px-2 py-1 text-sm"
          >
            <option value="">From…</option>
            {wf.stages.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
          <span className="text-slate-400">→</span>
          <select
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border border-slate-300 rounded px-2 py-1 text-sm"
          >
            <option value="">To…</option>
            {wf.stages.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="border border-slate-300 rounded px-2 py-1 text-sm"
            title="Allowed role"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="border border-slate-300 rounded px-2 py-1 text-sm w-40"
            placeholder="Button label"
          />
          <input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="border border-slate-300 rounded px-2 py-1 text-sm w-44"
            placeholder="Context (optional)"
          />
          <label className="text-xs text-slate-600 flex items-center gap-1">
            <input
              type="checkbox"
              checked={requires}
              onChange={(e) => setRequires(e.target.checked)}
            />
            Needs checklist
          </label>
          <button
            onClick={add}
            disabled={!from || !to || !label.trim() || a.addTransition.isPending}
            className="bg-slate-800 text-white rounded px-3 py-1 text-sm disabled:opacity-50"
          >
            Add transition
          </button>
        </div>
      )}
    </Section>
  );
}
