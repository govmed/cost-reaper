import { useMemo, useState } from 'react';
import { useReferenceMutations, useReferenceTypes, useReferenceValues } from '../lib/queries';
import type { ReferenceValue } from '../lib/types';

export default function ReferenceDataPage() {
  const { data: types, isLoading, error } = useReferenceTypes();
  const [selected, setSelected] = useState<string>('');
  const activeType = selected || types?.[0]?.code || '';

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Reference data</h1>
        <p className="text-sm text-slate-500">
          Database-driven lookup values (FR-29). Edit labels, order, and active state without a code
          change. Built-in values can be deactivated but not deleted.
        </p>
      </div>

      {isLoading && <p className="text-slate-500">Loading…</p>}
      {error && <p className="text-rose-700">{(error as Error).message}</p>}

      {types && (
        <div className="grid grid-cols-1 md:grid-cols-[16rem_1fr] gap-4">
          <ul className="bg-white border border-slate-200 rounded-xl overflow-hidden h-fit">
            {types.map((t) => (
              <li key={t.code}>
                <button
                  onClick={() => setSelected(t.code)}
                  className={`w-full text-left px-4 py-2 text-sm border-b border-slate-100 hover:bg-slate-50 ${
                    t.code === activeType ? 'bg-teal-50 font-medium text-brand' : ''
                  }`}
                >
                  {t.displayName}
                  <span className="text-slate-400"> · {t.valueCount}</span>
                  {!t.isActive && <span className="text-amber-600"> (inactive)</span>}
                </button>
              </li>
            ))}
          </ul>
          {activeType && <ValueEditor typeCode={activeType} />}
        </div>
      )}
    </div>
  );
}

function ValueEditor({ typeCode }: { typeCode: string }) {
  const { data: values } = useReferenceValues(typeCode, true);
  const m = useReferenceMutations(typeCode);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');

  const roots = values ?? [];
  const flat = useMemo(() => flatten(roots), [roots]);

  function add() {
    if (!code.trim() || !name.trim()) return;
    m.createValue.mutate(
      {
        code: code.trim().toUpperCase(),
        displayName: name.trim(),
        displayOrder: flat.length + 1,
        parentId: parentId || undefined,
      },
      {
        onSuccess: () => {
          setCode('');
          setName('');
          setParentId('');
        },
      },
    );
  }

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      <h2 className="font-semibold text-brand">{typeCode}</h2>
      <table className="w-full text-sm">
        <thead className="text-slate-500 text-left">
          <tr>
            <th className="px-2 py-1">Code</th>
            <th className="px-2 py-1">Display name</th>
            <th className="px-2 py-1 text-right">Order</th>
            <th className="px-2 py-1">Active</th>
            <th className="px-2 py-1"></th>
          </tr>
        </thead>
        <tbody>
          {flat.map(({ v, depth }) => (
            <tr key={v.id} className="border-t border-slate-100">
              <td className="px-2 py-1 font-mono text-xs" style={{ paddingLeft: 8 + depth * 16 }}>
                {depth > 0 && <span className="text-slate-300">└ </span>}
                {v.code}
                {v.isBuiltin && (
                  <span className="text-slate-300" title="built-in">
                    {' '}
                    ●
                  </span>
                )}
              </td>
              <td className="px-2 py-1">{v.displayName}</td>
              <td className="px-2 py-1 text-right">
                <input
                  type="number"
                  defaultValue={v.displayOrder}
                  onBlur={(e) => {
                    const n = Number.parseInt(e.target.value, 10);
                    if (!Number.isNaN(n) && n !== v.displayOrder)
                      m.updateValue.mutate({ id: v.id, body: { displayOrder: n } });
                  }}
                  className="w-16 border border-slate-200 rounded px-1 py-0.5 text-right"
                />
              </td>
              <td className="px-2 py-1">
                <button
                  onClick={() =>
                    m.updateValue.mutate({ id: v.id, body: { isActive: !v.isActive } })
                  }
                  className={v.isActive ? 'text-emerald-700' : 'text-slate-400'}
                >
                  {v.isActive ? 'Active' : 'Inactive'}
                </button>
              </td>
              <td className="px-2 py-1 text-right whitespace-nowrap">
                <button
                  onClick={() => {
                    const next = window.prompt('Rename to', v.displayName);
                    if (next && next.trim())
                      m.updateValue.mutate({ id: v.id, body: { displayName: next.trim() } });
                  }}
                  className="text-slate-600 hover:underline"
                >
                  Rename
                </button>
                {!v.isBuiltin && (
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete ${v.code}?`)) m.deleteValue.mutate(v.id);
                    }}
                    className="text-rose-600 hover:underline ml-3"
                  >
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-slate-100">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="border border-slate-300 rounded px-2 py-1 text-sm w-40 font-mono"
          placeholder="NEW_CODE"
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border border-slate-300 rounded px-2 py-1 text-sm"
          placeholder="Display name"
        />
        <select
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
          className="border border-slate-300 rounded px-2 py-1 text-sm"
          title="Parent (optional)"
        >
          <option value="">(top level)</option>
          {roots.map((r) => (
            <option key={r.id} value={r.id}>
              under {r.code}
            </option>
          ))}
        </select>
        <button
          onClick={add}
          disabled={!code.trim() || !name.trim()}
          className="bg-slate-800 text-white rounded px-3 py-1 text-sm disabled:opacity-50"
        >
          Add value
        </button>
      </div>
      {m.createValue.isError && (
        <p className="text-rose-700 text-sm">{(m.createValue.error as Error).message}</p>
      )}
    </section>
  );
}

function flatten(roots: ReferenceValue[], depth = 0): { v: ReferenceValue; depth: number }[] {
  const out: { v: ReferenceValue; depth: number }[] = [];
  for (const v of roots) {
    out.push({ v, depth });
    if (v.children?.length) out.push(...flatten(v.children, depth + 1));
  }
  return out;
}
