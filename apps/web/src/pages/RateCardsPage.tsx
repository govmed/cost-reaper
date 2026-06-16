import { useMemo, useState } from 'react';
import { useCreateRateCard, useRateCardMutations, useRateCards } from '../lib/queries';
import { useRefLabeler } from '../lib/refLabels';
import type { RateCard, RateCardRole } from '../lib/types';

type RateCardMutations = ReturnType<typeof useRateCardMutations>;
// Fallback unit codes used until the DB reference labels load (FR-29).
const UNITS = ['HOUR', 'DAY'];

// The rate card's currency symbol shown beside each rate; USD → "$".
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  CAD: '$',
  AUD: '$',
  NZD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
  INR: '₹',
};
function currencySymbol(code: string): string {
  return CURRENCY_SYMBOLS[(code ?? '').toUpperCase()] ?? code ?? '$';
}
/** Format a rate as a 2-decimal money value ("85" → "85.00"); pass through if not numeric. */
function toMoney(v: string): string {
  const n = Number(v);
  return v.trim() !== '' && Number.isFinite(n) ? n.toFixed(2) : v;
}

function RoleRow({
  cardId,
  role,
  m,
  currency,
}: {
  cardId: string;
  role: RateCardRole;
  m: RateCardMutations;
  currency: string;
}) {
  const [roleName, setRoleName] = useState(role.roleName);
  const [rate, setRate] = useState(toMoney(role.rate));
  const sym = currencySymbol(currency);
  const unit = useRefLabeler('RATE_UNIT');
  const unitOptions = unit.ready ? unit.options : UNITS.map((c) => ({ code: c, label: c }));
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
          {unitOptions.map((o) => (
            <option key={o.code} value={o.code}>
              {o.label}
            </option>
          ))}
        </select>
      </td>
      <td className="px-2 py-1 text-right">
        <span className="inline-flex w-28 items-center gap-1 rounded border border-slate-200 px-2 py-1 text-sm focus-within:ring-1 focus-within:ring-brand">
          <span className="text-slate-400">{sym}</span>
          <input
            value={rate}
            inputMode="decimal"
            onChange={(e) => setRate(e.target.value)}
            onBlur={() => {
              const f = toMoney(rate);
              setRate(f);
              if (f && Number.isFinite(Number(f)) && Number(f) !== Number(role.rate))
                save({ rate: f });
            }}
            className="w-full border-0 bg-transparent p-0 text-right tabular-nums outline-none"
          />
        </span>
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

function AddRoleRow({
  cardId,
  m,
  currency,
}: {
  cardId: string;
  m: RateCardMutations;
  currency: string;
}) {
  const [roleName, setRoleName] = useState('');
  const [unit, setUnit] = useState('HOUR');
  const [rate, setRate] = useState('');
  const sym = currencySymbol(currency);
  const unitLabeler = useRefLabeler('RATE_UNIT');
  const unitOptions = unitLabeler.ready
    ? unitLabeler.options
    : UNITS.map((c) => ({ code: c, label: c }));
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
          {unitOptions.map((o) => (
            <option key={o.code} value={o.code}>
              {o.label}
            </option>
          ))}
        </select>
      </td>
      <td className="px-2 py-1 text-right">
        <span className="inline-flex w-28 items-center gap-1 rounded border border-slate-200 px-2 py-1 text-sm focus-within:ring-1 focus-within:ring-brand">
          <span className="text-slate-400">{sym}</span>
          <input
            value={rate}
            inputMode="decimal"
            onChange={(e) => setRate(e.target.value)}
            onBlur={() => setRate(toMoney(rate))}
            placeholder="0.00"
            className="w-full border-0 bg-transparent p-0 text-right tabular-nums outline-none placeholder:text-slate-300"
          />
        </span>
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

type SortKey = 'roleName' | 'rate';

function RateCardPanel({ card, m }: { card: RateCard; m: RateCardMutations }) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' } | null>(null);
  const sortedRoles = useMemo(() => {
    if (!sort) return card.roles;
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...card.roles].sort((a, b) => {
      if (sort.key === 'rate') return (Number(a.rate) - Number(b.rate)) * dir;
      return a.roleName.localeCompare(b.roleName) * dir;
    });
  }, [card.roles, sort]);
  function toggleSort(key: SortKey) {
    setSort((s) => {
      if (s?.key !== key) return { key, dir: 'asc' };
      return { key, dir: s.dir === 'asc' ? 'desc' : 'asc' };
    });
  }
  function arrow(key: SortKey): string {
    if (sort?.key !== key) return '';
    return sort.dir === 'asc' ? ' ▲' : ' ▼';
  }
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
            <th className="px-2 py-1 text-left font-medium">
              <button onClick={() => toggleSort('roleName')} className="hover:text-brand">
                Role{arrow('roleName')}
              </button>
            </th>
            <th className="px-2 py-1 text-left font-medium">Unit</th>
            <th className="px-2 py-1 text-right font-medium">
              <button onClick={() => toggleSort('rate')} className="hover:text-brand">
                Rate{arrow('rate')}
              </button>
            </th>
            <th />
          </tr>
        </thead>
        <tbody>
          {sortedRoles.map((r) => (
            <RoleRow key={r.id} cardId={card.id} role={r} m={m} currency={card.currency} />
          ))}
          <AddRoleRow cardId={card.id} m={m} currency={card.currency} />
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
