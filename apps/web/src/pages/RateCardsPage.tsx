import { useState } from 'react';
import { useCreateRateCard, useRateCardMutations, useRateCards } from '../lib/queries';
import type { RateCard, RateCardRole } from '../lib/types';

type RateCardMutations = ReturnType<typeof useRateCardMutations>;
const UNITS = ['HOUR', 'DAY'];

function RoleRow({
  cardId,
  role,
  m,
}: {
  cardId: string;
  role: RateCardRole;
  m: RateCardMutations;
}) {
  const [roleName, setRoleName] = useState(role.roleName);
  const [rate, setRate] = useState(role.rate);
  const save = (body: Record<string, unknown>) =>
    m.updateRole.mutate({ id: cardId, roleId: role.id, body });
  return (
    <tr className="border-t border-slate-100">
      <td className="px-2 py-1">
        <input
          value={roleName}
          onChange={(e) => setRoleName(e.target.value)}
          onBlur={() => roleName !== role.roleName && roleName.trim() && save({ roleName })}
          className="border border-slate-200 rounded px-2 py-1 text-sm w-full"
        />
      </td>
      <td className="px-2 py-1">
        <select
          value={role.unit}
          onChange={(e) => save({ unit: e.target.value })}
          className="border border-slate-200 rounded px-2 py-1 text-sm"
        >
          {UNITS.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </td>
      <td className="px-2 py-1 text-right">
        <input
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          onBlur={() => rate !== role.rate && rate && save({ rate })}
          className="border border-slate-200 rounded px-2 py-1 text-sm w-28 text-right tabular-nums"
        />
      </td>
      <td className="px-2 py-1 text-right">
        <button
          onClick={() => m.deleteRole.mutate({ id: cardId, roleId: role.id })}
          className="text-rose-600 hover:underline text-sm"
        >
          Delete
        </button>
      </td>
    </tr>
  );
}

function AddRoleRow({ cardId, m }: { cardId: string; m: RateCardMutations }) {
  const [roleName, setRoleName] = useState('');
  const [unit, setUnit] = useState('HOUR');
  const [rate, setRate] = useState('');
  function add() {
    if (!roleName.trim() || !rate) return;
    m.addRole.mutate({ id: cardId, body: { roleName, unit, rate } });
    setRoleName('');
    setRate('');
  }
  return (
    <tr className="border-t border-slate-100 bg-slate-50">
      <td className="px-2 py-1">
        <input
          value={roleName}
          onChange={(e) => setRoleName(e.target.value)}
          placeholder="New role name"
          className="border border-slate-200 rounded px-2 py-1 text-sm w-full"
        />
      </td>
      <td className="px-2 py-1">
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          className="border border-slate-200 rounded px-2 py-1 text-sm"
        >
          {UNITS.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </td>
      <td className="px-2 py-1 text-right">
        <input
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          type="number"
          placeholder="rate"
          className="border border-slate-200 rounded px-2 py-1 text-sm w-28 text-right"
        />
      </td>
      <td className="px-2 py-1 text-right">
        <button
          onClick={add}
          disabled={!roleName.trim() || !rate}
          className="bg-slate-800 text-white rounded px-3 py-1 text-sm disabled:opacity-50"
        >
          Add role
        </button>
      </td>
    </tr>
  );
}

function RateCardPanel({ card, m }: { card: RateCard; m: RateCardMutations }) {
  return (
    <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-semibold text-brand">{card.name}</h2>
          <span className="text-xs text-slate-500">
            {card.currency} · {card.roles.length} role(s)
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={card.isActive}
              onChange={(e) =>
                m.update.mutate({ id: card.id, body: { isActive: e.target.checked } })
              }
            />
            Active
          </label>
          <button
            onClick={() => {
              if (window.confirm(`Delete rate card "${card.name}"?`)) m.remove.mutate(card.id);
            }}
            className="text-rose-600 hover:underline"
          >
            Delete card
          </button>
        </div>
      </div>
      <table className="w-full text-sm">
        <thead className="text-slate-500">
          <tr>
            <th className="px-2 py-1 text-left font-medium">Role</th>
            <th className="px-2 py-1 text-left font-medium">Unit</th>
            <th className="px-2 py-1 text-right font-medium">Rate</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {card.roles.map((r) => (
            <RoleRow key={r.id} cardId={card.id} role={r} m={m} />
          ))}
          <AddRoleRow cardId={card.id} m={m} />
        </tbody>
      </table>
    </section>
  );
}

export default function RateCardsPage() {
  const { data, isLoading, error } = useRateCards();
  const create = useCreateRateCard();
  const m = useRateCardMutations();
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('USD');

  async function onCreate() {
    if (!name.trim()) return;
    await create.mutateAsync({ name, currency, roles: [] });
    setName('');
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Rate cards</h1>
      <p className="text-sm text-slate-500 -mt-3">
        Define the roles and hourly/daily rates that drive labor cost on estimates.
      </p>

      <div className="bg-white border border-slate-200 rounded-xl p-4 flex gap-2 items-end flex-wrap">
        <label className="text-sm flex-1 min-w-48">
          <span className="text-slate-600">New rate card name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full border border-slate-300 rounded px-3 py-2"
            placeholder="Standard Rate Card 2027"
          />
        </label>
        <label className="text-sm">
          <span className="text-slate-600">Currency</span>
          <input
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            maxLength={3}
            className="mt-1 w-24 border border-slate-300 rounded px-3 py-2"
          />
        </label>
        <button
          onClick={onCreate}
          disabled={create.isPending || !name.trim()}
          className="bg-brand text-white rounded px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          Create
        </button>
      </div>

      {isLoading && <p className="text-slate-500">Loading…</p>}
      {error && <p className="text-rose-700">{(error as Error).message}</p>}
      {data?.map((c) => (
        <RateCardPanel key={c.id} card={c} m={m} />
      ))}
      {data && data.length === 0 && (
        <p className="text-slate-500">No rate cards yet — create one above.</p>
      )}
    </div>
  );
}
