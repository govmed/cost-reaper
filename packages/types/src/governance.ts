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
  fromStageKey: z.string(),
  toStageKey: z.string(),
  allowedRole: Role,
  label: z.string(),
  requiresChecklistPass: z.boolean(),
});
export type WorkflowTransitionDto = z.infer<typeof WorkflowTransitionDto>;

export const WorkflowDefinitionDto = z.object({
  id: z.string().uuid(),
  name: z.string(),
  isDefault: z.boolean(),
  isActive: z.boolean(),
  stages: z.array(WorkflowStageDto),
  transitions: z.array(WorkflowTransitionDto),
});
export type WorkflowDefinitionDto = z.infer<typeof WorkflowDefinitionDto>;

export const TransitionRequest = z.object({
  toStageKey: z.string().min(1),
  note: z.string().max(2000).optional(),
});
export type TransitionRequest = z.infer<typeof TransitionRequest>;

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
});
export type ChecklistItemResult = z.infer<typeof ChecklistItemResult>;

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
