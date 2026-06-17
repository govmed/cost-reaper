import { z } from 'zod';
import { EngineResult } from './estimate';

// ── Statement of Work (BR-7) — an editable, official document from an estimate ──

export const SowStatus = z.enum(['DRAFT', 'ISSUED']);
export type SowStatus = z.infer<typeof SowStatus>;

/** Full SOW, including the pricing (live for a draft, snapshotted once issued). */
export const StatementOfWorkDto = z.object({
  id: z.string().uuid(),
  /** System-assigned document number (e.g. SOW-A1B2C3). */
  number: z.string(),
  estimateId: z.string().uuid(),
  estimateName: z.string(),
  title: z.string(),
  status: SowStatus,
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
});
export type SowSummaryDto = z.infer<typeof SowSummaryDto>;

export const CreateSowRequest = z.object({
  estimateId: z.string().uuid(),
  title: z.string().min(1).max(200).optional(),
  clientName: z.string().max(200).optional(),
  providerName: z.string().max(200).optional(),
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
  /** ISO date (YYYY-MM-DD) or empty string to clear. */
  effectiveDate: z.string().max(40).optional(),
});
export type UpdateSowRequest = z.infer<typeof UpdateSowRequest>;
