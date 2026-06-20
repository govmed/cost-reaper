import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useSow, useSowMutations } from '../lib/queries';
import type { SowSlaTier, SowSupportTier } from '../lib/types';

type Form = {
  title: string;
  clientName: string;
  providerName: string;
  effectiveDate: string;
  executiveSummary: string;
  customerUnderstanding: string;
  overview: string;
  scope: string;
  outOfScope: string;
  solutionOverview: string;
  deliverables: string;
  timeline: string;
  paymentTerms: string;
  governanceModel: string;
  rolesResponsibilities: string;
  nonFunctionalRequirements: string;
  testingStrategy: string;
  maintenanceSupport: string;
  assumptions: string;
  risksMitigation: string;
  acceptanceCriteria: string;
  changeControl: string;
  termsAndConditions: string;
  // Implementation & Maintenance structured sections (BR-7)
  slaTiers: SowSlaTier[];
  supportTiers: SowSupportTier[];
  warrantyDays: number | null;
  securityCompliance: string;
};

// Only string keys of Form may be edited via the generic textarea/input setter.
type StringKey = {
  [K in keyof Form]: Form[K] extends string ? K : never;
}[keyof Form];

// Narrative sections in the SOW document's order (mirrors SOW_TEMPLATE.md).
const SECTIONS: { key: StringKey; label: string; rows: number }[] = [
  { key: 'executiveSummary', label: 'Executive Summary', rows: 4 },
  { key: 'customerUnderstanding', label: 'Customer Understanding', rows: 4 },
  { key: 'overview', label: 'Overview', rows: 3 },
  { key: 'scope', label: 'Scope of Services', rows: 4 },
  { key: 'outOfScope', label: 'Out of Scope', rows: 3 },
  { key: 'solutionOverview', label: 'Proposed Solution', rows: 4 },
  { key: 'deliverables', label: 'Deliverables', rows: 4 },
  { key: 'timeline', label: 'Timeline', rows: 3 },
  { key: 'paymentTerms', label: 'Payment Terms', rows: 3 },
  { key: 'governanceModel', label: 'Governance Model', rows: 4 },
  { key: 'rolesResponsibilities', label: 'Roles & Responsibilities', rows: 4 },
  { key: 'nonFunctionalRequirements', label: 'Non-Functional Requirements', rows: 5 },
  { key: 'testingStrategy', label: 'Testing Strategy', rows: 4 },
  { key: 'maintenanceSupport', label: 'Maintenance & Support', rows: 4 },
  { key: 'assumptions', label: 'Assumptions', rows: 4 },
  { key: 'risksMitigation', label: 'Risks & Mitigation', rows: 4 },
  { key: 'acceptanceCriteria', label: 'Acceptance Criteria', rows: 3 },
  { key: 'changeControl', label: 'Change Control', rows: 3 },
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
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!sow) return;
    setForm({
      title: sow.title,
      clientName: sow.clientName,
      providerName: sow.providerName,
      effectiveDate: sow.effectiveDate ?? '',
      executiveSummary: sow.executiveSummary,
      customerUnderstanding: sow.customerUnderstanding,
      overview: sow.overview,
      scope: sow.scope,
      outOfScope: sow.outOfScope,
      solutionOverview: sow.solutionOverview,
      deliverables: sow.deliverables,
      timeline: sow.timeline,
      paymentTerms: sow.paymentTerms,
      governanceModel: sow.governanceModel,
      rolesResponsibilities: sow.rolesResponsibilities,
      nonFunctionalRequirements: sow.nonFunctionalRequirements,
      testingStrategy: sow.testingStrategy,
      maintenanceSupport: sow.maintenanceSupport,
      assumptions: sow.assumptions,
      risksMitigation: sow.risksMitigation,
      acceptanceCriteria: sow.acceptanceCriteria,
      changeControl: sow.changeControl,
      termsAndConditions: sow.termsAndConditions,
      slaTiers: sow.slaTiers,
      supportTiers: sow.supportTiers,
      warrantyDays: sow.warrantyDays,
      securityCompliance: sow.securityCompliance,
    });
    setDirty(false);
  }, [sow?.id, sow?.updatedAt]);

  if (isLoading) return <p className="text-slate-500">Loading…</p>;
  if (error) return <p className="text-rose-700">{(error as Error).message}</p>;
  if (!sow || !form) return null;

  const issued = sow.status === 'ISSUED';
  const locked = issued || !canEdit;
  const set = (k: StringKey, v: string) => {
    setForm({ ...form, [k]: v });
    setDirty(true);
  };
  const patch = (p: Partial<Form>) => {
    setForm({ ...form, ...p });
    setDirty(true);
  };
  const updateSla = (i: number, field: keyof SowSlaTier, v: string) =>
    patch({ slaTiers: form.slaTiers.map((r, j) => (j === i ? { ...r, [field]: v } : r)) });
  const updateSupport = (i: number, field: keyof SowSupportTier, v: string) =>
    patch({ supportTiers: form.supportTiers.map((r, j) => (j === i ? { ...r, [field]: v } : r)) });
  // Maintenance editors appear for the maintenance flavor or any SOW already using them.
  const showMaint =
    sow.flavor === 'IMPL_MAINTENANCE' ||
    form.slaTiers.length > 0 ||
    form.supportTiers.length > 0 ||
    form.warrantyDays != null;
  const save = () => m.update.mutate(form, { onSuccess: () => setDirty(false) });
  const savedAt = new Date(sow.updatedAt).toLocaleString();
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
          {sow.currency} · last saved {savedAt}
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
            onClick={save}
            disabled={m.update.isPending || !dirty}
            className="bg-slate-800 text-white rounded px-3 py-1.5 text-sm disabled:opacity-50"
          >
            {m.update.isPending ? 'Saving…' : 'Save changes'}
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
        {canEdit && !issued && (
          <span className="text-sm" aria-live="polite">
            {m.update.isPending ? (
              <span className="text-slate-500">Saving…</span>
            ) : dirty ? (
              <span className="text-amber-600">● Unsaved changes</span>
            ) : m.update.isSuccess ? (
              <span className="text-emerald-700">✓ Saved</span>
            ) : null}
          </span>
        )}
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

      {showMaint && (
        <div className="space-y-4 bg-white border border-slate-200 rounded-xl p-4">
          <h2 className="font-semibold text-brand">Maintenance, SLAs &amp; warranty</h2>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs uppercase tracking-wide">
                Service levels (SLAs)
              </span>
              {!locked && (
                <button
                  onClick={() =>
                    patch({
                      slaTiers: [
                        ...form.slaTiers,
                        { priority: '', definition: '', response: '', resolution: '' },
                      ],
                    })
                  }
                  className="text-brand hover:underline text-xs"
                >
                  + Add SLA
                </button>
              )}
            </div>
            <table className="w-full text-sm mt-1">
              <thead>
                <tr className="text-slate-500 text-left">
                  <th className="py-1">Priority</th>
                  <th className="py-1">Definition</th>
                  <th className="py-1">Response</th>
                  <th className="py-1">Resolution</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {form.slaTiers.map((r, i) => (
                  <tr key={i}>
                    {(['priority', 'definition', 'response', 'resolution'] as const).map((f) => (
                      <td key={f} className="pr-1 py-0.5">
                        <input
                          value={r[f]}
                          onChange={(e) => updateSla(i, f, e.target.value)}
                          disabled={locked}
                          className="border border-slate-300 rounded px-2 py-1 text-sm w-full disabled:bg-slate-50"
                        />
                      </td>
                    ))}
                    <td className="text-right">
                      {!locked && (
                        <button
                          onClick={() =>
                            patch({ slaTiers: form.slaTiers.filter((_, j) => j !== i) })
                          }
                          className="text-rose-600 hover:underline text-xs"
                          aria-label="Remove SLA row"
                        >
                          ✕
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {form.slaTiers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-slate-400 py-2">
                      No SLA rows.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs uppercase tracking-wide">Support hours</span>
              {!locked && (
                <button
                  onClick={() =>
                    patch({
                      supportTiers: [...form.supportTiers, { tier: '', coverage: '', channel: '' }],
                    })
                  }
                  className="text-brand hover:underline text-xs"
                >
                  + Add tier
                </button>
              )}
            </div>
            <table className="w-full text-sm mt-1">
              <thead>
                <tr className="text-slate-500 text-left">
                  <th className="py-1">Tier</th>
                  <th className="py-1">Coverage</th>
                  <th className="py-1">Channel</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {form.supportTiers.map((r, i) => (
                  <tr key={i}>
                    {(['tier', 'coverage', 'channel'] as const).map((f) => (
                      <td key={f} className="pr-1 py-0.5">
                        <input
                          value={r[f]}
                          onChange={(e) => updateSupport(i, f, e.target.value)}
                          disabled={locked}
                          className="border border-slate-300 rounded px-2 py-1 text-sm w-full disabled:bg-slate-50"
                        />
                      </td>
                    ))}
                    <td className="text-right">
                      {!locked && (
                        <button
                          onClick={() =>
                            patch({ supportTiers: form.supportTiers.filter((_, j) => j !== i) })
                          }
                          className="text-rose-600 hover:underline text-xs"
                          aria-label="Remove support tier"
                        >
                          ✕
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {form.supportTiers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-slate-400 py-2">
                      No support tiers.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Field label="Warranty (days)">
            <input
              type="number"
              min={0}
              value={form.warrantyDays ?? ''}
              onChange={(e) =>
                patch({ warrantyDays: e.target.value === '' ? null : Number(e.target.value) })
              }
              disabled={locked}
              className="border border-slate-300 rounded px-2 py-1 text-sm w-32 disabled:bg-slate-50"
            />
          </Field>

          <Field label="Security, Data & Compliance">
            <textarea
              value={form.securityCompliance}
              onChange={(e) => set('securityCompliance', e.target.value)}
              disabled={locked}
              rows={4}
              className="border border-slate-300 rounded px-2 py-1 text-sm w-full disabled:bg-slate-50"
            />
          </Field>
        </div>
      )}
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
