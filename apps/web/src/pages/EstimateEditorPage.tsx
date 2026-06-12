import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { downloadCsv } from '../lib/api';
import {
  useCloudPrices,
  useEstimate,
  useEstimateMutations,
  useRateCards,
} from '../lib/queries';
import type { BillingPeriod, CloudPrice, EstimateDetail } from '../lib/types';

const PERIODS: BillingPeriod[] = ['ONE_TIME', 'MONTHLY', 'YEARLY'];

function Card({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? 'border-brand bg-teal-50' : 'border-slate-200 bg-white'}`}>
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function NumberSetting({
  label,
  value,
  onSave,
}: {
  label: string;
  value: number;
  onSave: (v: number) => void;
}) {
  const [v, setV] = useState(String(value));
  return (
    <label className="text-sm">
      <span className="text-slate-600">{label}</span>
      <input
        type="number"
        value={v}
        step="0.01"
        min="0"
        max="100"
        onChange={(e) => setV(e.target.value)}
        onBlur={() => {
          const n = Number.parseFloat(v);
          if (!Number.isNaN(n)) onSave(n);
        }}
        className="mt-1 block w-28 border border-slate-300 rounded px-2 py-1"
      />
    </label>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      <h2 className="font-semibold text-brand">{title}</h2>
      {children}
    </section>
  );
}

export default function EstimateEditorPage() {
  const { id } = useParams<{ id: string }>();
  const { data: est, isLoading, error } = useEstimate(id);
  const m = useEstimateMutations(id ?? '');
  const { data: rateCards } = useRateCards();
  const { data: cloudPrices } = useCloudPrices();

  if (isLoading) return <p className="text-slate-500">Loading…</p>;
  if (error) return <p className="text-rose-700">{(error as Error).message}</p>;
  if (!est) return null;

  const t = est.totals;
  const cur = est.currency;
  const roles = (rateCards ?? []).flatMap((rc) =>
    rc.roles.map((r) => ({ id: r.id, label: `${r.roleName} (${rc.name}) — ${r.rate}/${r.unit}` })),
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <Link to="/" className="text-sm text-slate-500 hover:underline">
            ← Estimates
          </Link>
          <h1 className="text-2xl font-semibold">{est.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={est.status}
            onChange={(e) => m.patch.mutate({ status: e.target.value })}
            className="border border-slate-300 rounded px-2 py-1 text-sm"
          >
            <option value="DRAFT">DRAFT</option>
            <option value="FINAL">FINAL</option>
          </select>
          <button
            onClick={() => void downloadCsv(est.id, est.name)}
            className="bg-brand text-white rounded px-3 py-1.5 text-sm font-medium"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card label="One-time" value={`${t.oneTimeTotal} ${cur}`} />
        <Card label="Monthly" value={`${t.monthlyTotal} ${cur}`} />
        <Card label="Yearly" value={`${t.yearlyTotal} ${cur}`} />
        <Card label="Grand total" value={`${t.grandTotal} ${cur}`} accent />
      </div>

      <Section title="Settings">
        <div className="flex flex-wrap gap-6 items-end">
          <NumberSetting
            label="Global upcharge %"
            value={est.globalUpchargePercent}
            onSave={(v) => m.patch.mutate({ globalUpchargePercent: v })}
          />
          <NumberSetting
            label="Contingency %"
            value={est.contingencyPercent}
            onSave={(v) => m.patch.mutate({ contingencyPercent: v })}
          />
          <div className="text-sm text-slate-500">
            Upcharge {t.upchargeAmount} · Contingency {t.contingencyAmount} {cur}
          </div>
        </div>
      </Section>

      <LaborSection est={est} roles={roles} m={m} />
      <NonLaborSection est={est} m={m} />
      <CloudSection est={est} prices={cloudPrices ?? []} m={m} />
      <AssumptionsSection est={est} m={m} />
    </div>
  );
}

type Mutations = ReturnType<typeof useEstimateMutations>;

function Th({ children, right }: { children: ReactNode; right?: boolean }) {
  return <th className={`px-3 py-2 font-medium ${right ? 'text-right' : 'text-left'}`}>{children}</th>;
}

function PeriodSelect({ value, onChange }: { value: BillingPeriod; onChange: (v: BillingPeriod) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as BillingPeriod)}
      className="border border-slate-300 rounded px-2 py-1 text-sm"
    >
      {PERIODS.map((p) => (
        <option key={p} value={p}>
          {p}
        </option>
      ))}
    </select>
  );
}

function LaborSection({
  est,
  roles,
  m,
}: {
  est: EstimateDetail;
  roles: { id: string; label: string }[];
  m: Mutations;
}) {
  const [roleId, setRoleId] = useState('');
  const [units, setUnits] = useState('1');
  const [quantity, setQuantity] = useState('1');
  const [period, setPeriod] = useState<BillingPeriod>('ONE_TIME');

  function add() {
    if (!roleId) return;
    m.addLabor.mutate({
      rateCardRoleId: roleId,
      units: Number.parseFloat(units) || 0,
      quantity: Number.parseFloat(quantity) || 1,
      billingPeriod: period,
    });
    setRoleId('');
  }

  return (
    <Section title="Labor">
      <table className="w-full text-sm">
        <thead className="text-slate-500">
          <tr>
            <Th>Role</Th>
            <Th right>Qty</Th>
            <Th right>Units</Th>
            <Th right>Rate</Th>
            <Th>Billing</Th>
            <Th right>Line total</Th>
            <Th>{''}</Th>
          </tr>
        </thead>
        <tbody>
          {est.laborItems.map((l) => (
            <tr key={l.id} className="border-t border-slate-100">
              <td className="px-3 py-2">{l.roleName ?? l.description ?? '—'}</td>
              <td className="px-3 py-2 text-right tabular-nums">{l.quantity}</td>
              <td className="px-3 py-2 text-right tabular-nums">{l.units}</td>
              <td className="px-3 py-2 text-right tabular-nums">{l.rateSnapshot}</td>
              <td className="px-3 py-2">{l.billingPeriod}</td>
              <td className="px-3 py-2 text-right tabular-nums">{l.lineTotal}</td>
              <td className="px-3 py-2 text-right">
                <button onClick={() => m.delLabor.mutate(l.id)} className="text-rose-600 hover:underline">
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-slate-100">
        <select value={roleId} onChange={(e) => setRoleId(e.target.value)} className="border border-slate-300 rounded px-2 py-1 text-sm min-w-64">
          <option value="">Select role…</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
        <input value={quantity} onChange={(e) => setQuantity(e.target.value)} type="number" className="border border-slate-300 rounded px-2 py-1 text-sm w-20" placeholder="qty" />
        <input value={units} onChange={(e) => setUnits(e.target.value)} type="number" className="border border-slate-300 rounded px-2 py-1 text-sm w-24" placeholder="units" />
        <PeriodSelect value={period} onChange={setPeriod} />
        <button onClick={add} disabled={!roleId} className="bg-slate-800 text-white rounded px-3 py-1 text-sm disabled:opacity-50">
          Add labor
        </button>
      </div>
    </Section>
  );
}

function NonLaborSection({ est, m }: { est: EstimateDetail; m: Mutations }) {
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<BillingPeriod>('ONE_TIME');

  function add() {
    if (!category.trim() || !amount) return;
    m.addNonLabor.mutate({
      category,
      amount,
      type: period === 'ONE_TIME' ? 'FIXED' : 'RECURRING',
      billingPeriod: period,
      periods: 1,
    });
    setCategory('');
    setAmount('');
  }

  return (
    <Section title="Non-labor">
      <table className="w-full text-sm">
        <thead className="text-slate-500">
          <tr>
            <Th>Category</Th>
            <Th right>Amount</Th>
            <Th>Billing</Th>
            <Th right>Line total</Th>
            <Th>{''}</Th>
          </tr>
        </thead>
        <tbody>
          {est.nonLaborItems.map((n) => (
            <tr key={n.id} className="border-t border-slate-100">
              <td className="px-3 py-2">{n.category}</td>
              <td className="px-3 py-2 text-right tabular-nums">{n.amount}</td>
              <td className="px-3 py-2">{n.billingPeriod}</td>
              <td className="px-3 py-2 text-right tabular-nums">{n.lineTotal}</td>
              <td className="px-3 py-2 text-right">
                <button onClick={() => m.delNonLabor.mutate(n.id)} className="text-rose-600 hover:underline">
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-slate-100">
        <input value={category} onChange={(e) => setCategory(e.target.value)} className="border border-slate-300 rounded px-2 py-1 text-sm" placeholder="Category (e.g. Licenses)" />
        <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" className="border border-slate-300 rounded px-2 py-1 text-sm w-32" placeholder="amount" />
        <PeriodSelect value={period} onChange={setPeriod} />
        <button onClick={add} disabled={!category.trim() || !amount} className="bg-slate-800 text-white rounded px-3 py-1 text-sm disabled:opacity-50">
          Add non-labor
        </button>
      </div>
    </Section>
  );
}

function CloudSection({ est, prices, m }: { est: EstimateDetail; prices: CloudPrice[]; m: Mutations }) {
  const [priceId, setPriceId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [hours, setHours] = useState('730');

  function add() {
    if (!priceId) return;
    m.addCloud.mutate({
      cloudPriceId: priceId,
      quantity: Number.parseFloat(quantity) || 1,
      usageHoursPerMonth: Number.parseFloat(hours) || 730,
      billingPeriod: 'MONTHLY',
    });
    setPriceId('');
  }

  return (
    <Section title="Cloud compute">
      <table className="w-full text-sm">
        <thead className="text-slate-500">
          <tr>
            <Th>Provider / Instance</Th>
            <Th right>Qty</Th>
            <Th right>Hrs/mo</Th>
            <Th right>Unit price</Th>
            <Th right>Line total</Th>
            <Th>{''}</Th>
          </tr>
        </thead>
        <tbody>
          {est.cloudItems.map((c) => (
            <tr key={c.id} className="border-t border-slate-100">
              <td className="px-3 py-2">
                {c.provider} · {c.skuOrInstance} <span className="text-slate-400">({c.region})</span>
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{c.quantity}</td>
              <td className="px-3 py-2 text-right tabular-nums">{c.usageHoursPerMonth}</td>
              <td className="px-3 py-2 text-right tabular-nums">{c.unitPriceSnapshot}</td>
              <td className="px-3 py-2 text-right tabular-nums">{c.lineTotal}</td>
              <td className="px-3 py-2 text-right">
                <button onClick={() => m.delCloud.mutate(c.id)} className="text-rose-600 hover:underline">
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-slate-100">
        <select value={priceId} onChange={(e) => setPriceId(e.target.value)} className="border border-slate-300 rounded px-2 py-1 text-sm min-w-72">
          <option value="">Select cloud instance…</option>
          {prices.map((p) => (
            <option key={p.id} value={p.id}>
              {p.provider} · {p.service} {p.skuOrInstance} ({p.region}) — {p.unitPrice}/{p.unit}
            </option>
          ))}
        </select>
        <input value={quantity} onChange={(e) => setQuantity(e.target.value)} type="number" className="border border-slate-300 rounded px-2 py-1 text-sm w-20" placeholder="qty" />
        <input value={hours} onChange={(e) => setHours(e.target.value)} type="number" className="border border-slate-300 rounded px-2 py-1 text-sm w-24" placeholder="hrs/mo" />
        <button onClick={add} disabled={!priceId} className="bg-slate-800 text-white rounded px-3 py-1 text-sm disabled:opacity-50">
          Add cloud
        </button>
      </div>
    </Section>
  );
}

function AssumptionsSection({ est, m }: { est: EstimateDetail; m: Mutations }) {
  const [text, setText] = useState('');
  function add() {
    if (!text.trim()) return;
    m.addAssumption.mutate({ text });
    setText('');
  }
  return (
    <Section title="Assumptions & notes">
      <ul className="space-y-1 text-sm">
        {est.assumptions.map((a) => (
          <li key={a.id} className="flex items-center justify-between border-b border-slate-100 py-1">
            <span>{a.text}</span>
            <button onClick={() => m.delAssumption.mutate(a.id)} className="text-rose-600 hover:underline text-xs">
              Delete
            </button>
          </li>
        ))}
        {est.assumptions.length === 0 && <li className="text-slate-400">None yet.</li>}
      </ul>
      <div className="flex gap-2 pt-2">
        <input value={text} onChange={(e) => setText(e.target.value)} className="border border-slate-300 rounded px-2 py-1 text-sm flex-1" placeholder="Add an assumption…" />
        <button onClick={add} disabled={!text.trim()} className="bg-slate-800 text-white rounded px-3 py-1 text-sm disabled:opacity-50">
          Add
        </button>
      </div>
    </Section>
  );
}
