import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useSow, useSowMutations } from '../lib/queries';

type Form = {
  title: string;
  clientName: string;
  providerName: string;
  effectiveDate: string;
  overview: string;
  scope: string;
  deliverables: string;
  timeline: string;
  paymentTerms: string;
  assumptions: string;
  termsAndConditions: string;
};

const SECTIONS: { key: keyof Form; label: string; rows: number }[] = [
  { key: 'overview', label: 'Overview', rows: 3 },
  { key: 'scope', label: 'Scope of Services', rows: 4 },
  { key: 'deliverables', label: 'Deliverables', rows: 4 },
  { key: 'timeline', label: 'Timeline', rows: 3 },
  { key: 'paymentTerms', label: 'Payment Terms', rows: 3 },
  { key: 'assumptions', label: 'Assumptions', rows: 4 },
  { key: 'termsAndConditions', label: 'Terms & Conditions', rows: 8 },
];

/** Edit a Statement of Work before generating its official PDF (BR-7). */
export default function SowEditorPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'ESTIMATOR';
  const { data: sow, isLoading, error } = useSow(id);
  const m = useSowMutations(id ?? '');
  const [form, setForm] = useState<Form | null>(null);

  useEffect(() => {
    if (!sow) return;
    setForm({
      title: sow.title,
      clientName: sow.clientName,
      providerName: sow.providerName,
      effectiveDate: sow.effectiveDate ?? '',
      overview: sow.overview,
      scope: sow.scope,
      deliverables: sow.deliverables,
      timeline: sow.timeline,
      paymentTerms: sow.paymentTerms,
      assumptions: sow.assumptions,
      termsAndConditions: sow.termsAndConditions,
    });
  }, [sow?.id, sow?.updatedAt]);

  if (isLoading) return <p className="text-slate-500">Loading…</p>;
  if (error) return <p className="text-rose-700">{(error as Error).message}</p>;
  if (!sow || !form) return null;

  const issued = sow.status === 'ISSUED';
  const locked = issued || !canEdit;
  const set = (k: keyof Form, v: string) => setForm({ ...form, [k]: v });
  const mutationError = (m.update.error || m.issue.error || m.revert.error) ?? null;

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <Link to="/sow" className="text-brand hover:underline text-sm">
          ← Statements of Work
        </Link>
        <div className="flex items-center gap-3 mt-1">
          <h1 className="text-2xl font-semibold">{sow.title}</h1>
          <span
            className={`rounded px-2 py-0.5 text-xs ${
              issued ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {issued ? 'Issued' : 'Draft'}
          </span>
        </div>
        <p className="text-sm text-slate-500">
          <span className="font-mono">{sow.number}</span> · from estimate “{sow.estimateName}” ·{' '}
          {sow.currency}
        </p>
      </div>

      {mutationError && (
        <p
          className="text-rose-700 text-sm bg-rose-50 border border-rose-200 rounded px-3 py-2"
          role="alert"
        >
          {(mutationError as Error).message}
        </p>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        {canEdit && !issued && (
          <button
            onClick={() => m.update.mutate(form)}
            disabled={m.update.isPending}
            className="bg-slate-800 text-white rounded px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Save changes
          </button>
        )}
        {canEdit && !issued && (
          <button
            onClick={() => {
              if (confirm('Issue this SOW? It will be locked and its pricing snapshotted.'))
                m.issue.mutate();
            }}
            disabled={m.issue.isPending}
            className="border border-emerald-600 text-emerald-700 rounded px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Issue (lock)
          </button>
        )}
        {canEdit && issued && (
          <button
            onClick={() => m.revert.mutate()}
            disabled={m.revert.isPending}
            className="border border-slate-300 text-slate-700 rounded px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Revert to draft
          </button>
        )}
        <Link
          to={`/sow/${sow.id}/print`}
          className="bg-brand text-white rounded px-3 py-1.5 text-sm font-medium"
        >
          Open PDF view
        </Link>
      </div>

      {issued && (
        <p className="text-xs text-slate-500">
          This SOW is issued and locked. Revert it to draft to make changes.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white border border-slate-200 rounded-xl p-4">
        <Field label="Title">
          <input
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            disabled={locked}
            className="border border-slate-300 rounded px-2 py-1 text-sm w-full disabled:bg-slate-50"
          />
        </Field>
        <Field label="Effective date">
          <input
            type="date"
            value={form.effectiveDate}
            onChange={(e) => set('effectiveDate', e.target.value)}
            disabled={locked}
            className="border border-slate-300 rounded px-2 py-1 text-sm w-full disabled:bg-slate-50"
          />
        </Field>
        <Field label="Client">
          <input
            value={form.clientName}
            onChange={(e) => set('clientName', e.target.value)}
            disabled={locked}
            placeholder="Client legal name"
            className="border border-slate-300 rounded px-2 py-1 text-sm w-full disabled:bg-slate-50"
          />
        </Field>
        <Field label="Provider">
          <input
            value={form.providerName}
            onChange={(e) => set('providerName', e.target.value)}
            disabled={locked}
            placeholder="Provider legal name"
            className="border border-slate-300 rounded px-2 py-1 text-sm w-full disabled:bg-slate-50"
          />
        </Field>
      </div>

      <div className="space-y-3 bg-white border border-slate-200 rounded-xl p-4">
        {SECTIONS.map((s) => (
          <Field key={s.key} label={s.label}>
            <textarea
              value={form[s.key]}
              onChange={(e) => set(s.key, e.target.value)}
              disabled={locked}
              rows={s.rows}
              className="border border-slate-300 rounded px-2 py-1 text-sm w-full disabled:bg-slate-50"
            />
          </Field>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="text-slate-500 text-xs uppercase tracking-wide">{label}</span>
      <div className="mt-0.5">{children}</div>
    </label>
  );
}
