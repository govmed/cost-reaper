import { z } from 'zod';
import { Role } from './common';

// ── Customizable workflow (FR-24) ────────────────────────────────────────────

export const WorkflowStageDto = z.object({
  id: z.string().uuid(),
  key: z.string(),
  label: z.string(),
  sortOrder: z.number().int(),
  isInitial: z.boolean(),
  isTerminal: z.boolean(),
});
export type WorkflowStageDto = z.infer<typeof WorkflowStageDto>;

export const WorkflowTransitionDto = z.object({
  id: z.string().uuid(),
  /** System-assigned stable key. */
  key: z.string(),
  description: z.string().nullable(),
  fromStageKey: z.string(),
  toStageKey: z.string(),
  allowedRole: Role,
  label: z.string(),
  requiresChecklistPass: z.boolean(),
});
export type WorkflowTransitionDto = z.infer<typeof WorkflowTransitionDto>;

export const WorkflowDefinitionDto = z.object({
  id: z.string().uuid(),
  /** System-assigned stable key (e.g. WF-A1B2C3). */
  key: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  isDefault: z.boolean(),
  isActive: z.boolean(),
  stages: z.array(WorkflowStageDto),
  transitions: z.array(WorkflowTransitionDto),
});
export type WorkflowDefinitionDto = z.infer<typeof WorkflowDefinitionDto>;

/** One entry in the workflow repo (list view). */
export const WorkflowSummaryDto = z.object({
  id: z.string().uuid(),
  key: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  isDefault: z.boolean(),
  isActive: z.boolean(),
  stageCount: z.number().int(),
  transitionCount: z.number().int(),
});
export type WorkflowSummaryDto = z.infer<typeof WorkflowSummaryDto>;

export const CreateWorkflowRequest = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(500).optional(),
});
export type CreateWorkflowRequest = z.infer<typeof CreateWorkflowRequest>;

export const UpdateWorkflowRequest = z.object({
  name: z.string().min(1).max(80).optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateWorkflowRequest = z.infer<typeof UpdateWorkflowRequest>;

export const TransitionRequest = z.object({
  toStageKey: z.string().min(1),
  note: z.string().max(2000).optional(),
});
export type TransitionRequest = z.infer<typeof TransitionRequest>;

// ── Workflow authoring (FR-24, admin) ────────────────────────────────────────

/** Stage key convention: UPPER_SNAKE_CASE (e.g. IN_REVIEW), matching the seed. */
const StageKey = z
  .string()
  .min(1)
  .max(40)
  .regex(/^[A-Z][A-Z0-9_]*$/, 'Key must be UPPER_SNAKE_CASE (A–Z, 0–9, _)');

export const CreateStageRequest = z.object({
  key: StageKey,
  label: z.string().min(1).max(80),
  sortOrder: z.number().int().min(0).optional(),
  isInitial: z.boolean().optional(),
  isTerminal: z.boolean().optional(),
});
export type CreateStageRequest = z.infer<typeof CreateStageRequest>;

export const UpdateStageRequest = z.object({
  label: z.string().min(1).max(80).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isInitial: z.boolean().optional(),
  isTerminal: z.boolean().optional(),
});
export type UpdateStageRequest = z.infer<typeof UpdateStageRequest>;

export const CreateTransitionRequest = z.object({
  fromStageKey: z.string().min(1),
  toStageKey: z.string().min(1),
  allowedRole: Role,
  label: z.string().min(1).max(80),
  description: z.string().max(500).optional(),
  requiresChecklistPass: z.boolean().optional(),
});
export type CreateTransitionRequest = z.infer<typeof CreateTransitionRequest>;

export const UpdateTransitionRequest = z.object({
  allowedRole: Role.optional(),
  label: z.string().min(1).max(80).optional(),
  description: z.string().max(500).optional(),
  requiresChecklistPass: z.boolean().optional(),
});
export type UpdateTransitionRequest = z.infer<typeof UpdateTransitionRequest>;

// ── Automated smart checklist (FR-25) ────────────────────────────────────────

export const ChecklistSeverity = z.enum(['BLOCKER', 'WARNING', 'INFO']);
export type ChecklistSeverity = z.infer<typeof ChecklistSeverity>;

export const ChecklistScope = z.enum(['ESTIMATE', 'LABOR', 'NONLABOR', 'CLOUD', 'RESOURCE']);
export type ChecklistScope = z.infer<typeof ChecklistScope>;

export const ChecklistItemResult = z.object({
  key: z.string(),
  description: z.string(),
  severity: ChecklistSeverity,
  scope: ChecklistScope,
  passed: z.boolean(),
  message: z.string(),
  /** IDs of the specific line items this rule flags, for deep-linking (empty for estimate-level rules). */
  entityIds: z.array(z.string()).default([]),
});
export type ChecklistItemResult = z.infer<typeof ChecklistItemResult>;

// ── Checklist-rule authoring (FR-25, admin) ──────────────────────────────────

export const ChecklistRuleDto = z.object({
  id: z.string().uuid(),
  key: z.string(),
  description: z.string(),
  severity: ChecklistSeverity,
  scope: ChecklistScope,
  isActive: z.boolean(),
  isBuiltin: z.boolean(),
  /** true when the rule key has built-in evaluation logic; false = advisory (always passes). */
  hasLogic: z.boolean(),
});
export type ChecklistRuleDto = z.infer<typeof ChecklistRuleDto>;

export const CreateChecklistRuleRequest = z.object({
  key: z
    .string()
    .min(1)
    .max(60)
    .regex(/^[a-z][a-z0-9_]*$/, 'Key must be lower_snake_case (a–z, 0–9, _)'),
  description: z.string().min(1).max(200),
  severity: ChecklistSeverity,
  scope: ChecklistScope,
});
export type CreateChecklistRuleRequest = z.infer<typeof CreateChecklistRuleRequest>;

export const UpdateChecklistRuleRequest = z.object({
  description: z.string().min(1).max(200).optional(),
  severity: ChecklistSeverity.optional(),
  isActive: z.boolean().optional(),
});
export type UpdateChecklistRuleRequest = z.infer<typeof UpdateChecklistRuleRequest>;

export const ChecklistResult = z.object({
  /** true when no BLOCKER-severity rule failed. */
  passed: z.boolean(),
  /** true when at least one BLOCKER failed (gates workflow transitions). */
  blocking: z.boolean(),
  /** Fraction of rules passed, 0..1. */
  completeness: z.number().min(0).max(1),
  items: z.array(ChecklistItemResult),
});
export type ChecklistResult = z.infer<typeof ChecklistResult>;

// ── Estimate workflow view (output) ──────────────────────────────────────────

export interface WorkflowTransitionEventDto {
  id: string;
  fromStageKey: string | null;
  toStageKey: string;
  actorId: string;
  note: string | null;
  occurredAt: string;
}

export interface AvailableTransitionDto {
  toStageKey: string;
  toStageLabel: string;
  label: string;
  allowedRole: Role;
  requiresChecklistPass: boolean;
  /** true if the current user's role may perform it. */
  allowedForUser: boolean;
  /** true if a required checklist is currently blocking. */
  blockedByChecklist: boolean;
}

export interface EstimateWorkflowDto {
  currentStageKey: string | null;
  currentStageLabel: string | null;
  availableTransitions: AvailableTransitionDto[];
  history: WorkflowTransitionEventDto[];
}
