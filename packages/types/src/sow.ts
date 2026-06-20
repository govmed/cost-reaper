import { z } from 'zod';
import { EngineResult } from './estimate';

// ── Statement of Work (BR-7) — an editable, official document from an estimate ──

export const SowStatus = z.enum(['DRAFT', 'ISSUED']);
export type SowStatus = z.infer<typeof SowStatus>;

/** SOW template flavor (BR-7) — selects the boilerplate style at creation. */
export const SowFlavor = z.enum([
  'ENTERPRISE',
  'CONCISE',
  'PROPOSAL',
  'TIME_MATERIALS',
  'IMPL_MAINTENANCE',
  'IMPL_MAINT_SPLIT',
]);
export type SowFlavor = z.infer<typeof SowFlavor>;

/** One row of the Service Level (SLA) table (BR-7). */
export const SowSlaTier = z.object({
  priority: z.string(),
  definition: z.string(),
  response: z.string(),
  resolution: z.string(),
});
export type SowSlaTier = z.infer<typeof SowSlaTier>;

/** One row of the support-hours / tier table (BR-7). */
export const SowSupportTier = z.object({
  tier: z.string(),
  coverage: z.string(),
  channel: z.string(),
});
export type SowSupportTier = z.infer<typeof SowSupportTier>;

/** Flavor catalog for the create picker (label + when to use). */
export const SOW_FLAVORS: { key: SowFlavor; label: string; description: string }[] = [
  {
    key: 'ENTERPRISE',
    label: 'Enterprise (Fixed-Price)',
    description: 'Comprehensive, milestone-billed, full terms — large clients / procurement.',
  },
  {
    key: 'CONCISE',
    label: 'Concise (SMB)',
    description: 'Lean, fast sign-off — small or short engagements.',
  },
  {
    key: 'PROPOSAL',
    label: 'Proposal — Pricing & Implementation',
    description: 'Subscription / implementation overview — SaaS deals & RFP responses.',
  },
  {
    key: 'TIME_MATERIALS',
    label: 'Time & Materials (Agile)',
    description: 'Rate-card team, sprints, not-to-exceed — evolving scope.',
  },
  {
    key: 'IMPL_MAINTENANCE',
    label: 'Implementation & Maintenance',
    description: 'Implementation + ongoing support with SLAs, support tiers, and warranty.',
  },
  {
    key: 'IMPL_MAINT_SPLIT',
    label: 'Implementation & Maintenance (Split Pricing)',
    description:
      'Same as Implementation & Maintenance, with separate one-time vs annual cost tables.',
  },
];

/** One row of the estimate's cost detail, flattened for the SOW table (BR-7). */
export const SowLineItemDto = z.object({
  kind: z.enum(['LABOR', 'NONLABOR', 'CLOUD']),
  category: z.string(),
  item: z.string(),
  quantity: z.string(),
  unitPrice: z.string(),
  billingPeriod: z.string(),
  lineTotal: z.string(),
});
export type SowLineItemDto = z.infer<typeof SowLineItemDto>;

/** Full SOW, including the pricing (live for a draft, snapshotted once issued). */
export const StatementOfWorkDto = z.object({
  id: z.string().uuid(),
  /** System-assigned document number (e.g. SOW-A1B2C3). */
  number: z.string(),
  estimateId: z.string().uuid(),
  estimateName: z.string(),
  title: z.string(),
  status: SowStatus,
  flavor: SowFlavor,
  clientName: z.string(),
  providerName: z.string(),
  executiveSummary: z.string(),
  customerUnderstanding: z.string(),
  overview: z.string(),
  scope: z.string(),
  outOfScope: z.string(),
  solutionOverview: z.string(),
  deliverables: z.string(),
  timeline: z.string(),
  paymentTerms: z.string(),
  governanceModel: z.string(),
  rolesResponsibilities: z.string(),
  nonFunctionalRequirements: z.string(),
  testingStrategy: z.string(),
  maintenanceSupport: z.string(),
  assumptions: z.string(),
  risksMitigation: z.string(),
  acceptanceCriteria: z.string(),
  changeControl: z.string(),
  termsAndConditions: z.string(),
  effectiveDate: z.string().nullable(),
  issuedAt: z.string().nullable(),
  preparedByEmail: z.string().nullable(),
  currency: z.string(),
  pricing: EngineResult,
  /** The estimate's line items (live for a draft, snapshotted once issued). */
  lineItems: z.array(SowLineItemDto),
  // ── Implementation & Maintenance structured sections (BR-7) ─────────────────
  /** Service Level (SLA) tiers; empty unless the SOW uses a maintenance flavor. */
  slaTiers: z.array(SowSlaTier),
  /** Support hours / tiers. */
  supportTiers: z.array(SowSupportTier),
  /** Warranty period in days, or null if not applicable. */
  warrantyDays: z.number().int().nullable(),
  /** Security, data & compliance narrative. */
  securityCompliance: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type StatementOfWorkDto = z.infer<typeof StatementOfWorkDto>;

/** One row in the SOW list. */
export const SowSummaryDto = z.object({
  id: z.string().uuid(),
  number: z.string(),
  estimateId: z.string().uuid(),
  estimateName: z.string(),
  title: z.string(),
  status: SowStatus,
  clientName: z.string(),
  updatedAt: z.string(),
  /** When the source estimate was last updated (so users can spot drift since the SOW). */
  estimateUpdatedAt: z.string(),
});
export type SowSummaryDto = z.infer<typeof SowSummaryDto>;

export const CreateSowRequest = z.object({
  estimateId: z.string().uuid(),
  title: z.string().min(1).max(200).optional(),
  clientName: z.string().max(200).optional(),
  providerName: z.string().max(200).optional(),
  /** Template style; defaults to ENTERPRISE when omitted. */
  flavor: SowFlavor.optional(),
});
export type CreateSowRequest = z.infer<typeof CreateSowRequest>;

/** An estimate eligible to be a SOW source — i.e. at an approved/final workflow stage. */
export const SowEligibleEstimateDto = z.object({
  id: z.string().uuid(),
  name: z.string(),
  stageKey: z.string(),
  stageLabel: z.string(),
});
export type SowEligibleEstimateDto = z.infer<typeof SowEligibleEstimateDto>;

const longText = z.string().max(20000);

export const UpdateSowRequest = z.object({
  title: z.string().min(1).max(200).optional(),
  clientName: z.string().max(200).optional(),
  providerName: z.string().max(200).optional(),
  executiveSummary: longText.optional(),
  customerUnderstanding: longText.optional(),
  overview: longText.optional(),
  scope: longText.optional(),
  outOfScope: longText.optional(),
  solutionOverview: longText.optional(),
  deliverables: longText.optional(),
  timeline: longText.optional(),
  paymentTerms: longText.optional(),
  governanceModel: longText.optional(),
  rolesResponsibilities: longText.optional(),
  nonFunctionalRequirements: longText.optional(),
  testingStrategy: longText.optional(),
  maintenanceSupport: longText.optional(),
  assumptions: longText.optional(),
  risksMitigation: longText.optional(),
  acceptanceCriteria: longText.optional(),
  changeControl: longText.optional(),
  termsAndConditions: longText.optional(),
  slaTiers: z.array(SowSlaTier).max(20).optional(),
  supportTiers: z.array(SowSupportTier).max(20).optional(),
  warrantyDays: z.number().int().min(0).max(3650).nullable().optional(),
  securityCompliance: longText.optional(),
  /** ISO date (YYYY-MM-DD) or empty string to clear. */
  effectiveDate: z.string().max(40).optional(),
});
export type UpdateSowRequest = z.infer<typeof UpdateSowRequest>;
