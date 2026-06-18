import { z } from 'zod';
import { RoleCode } from './common';

/**
 * Permission catalog (FR-30, NFR-16). Code-defined capability keys that gate the
 * write/admin endpoints; a role is a DB-stored bundle of these that admins edit.
 * Reads are open to any authenticated user, so only write/admin actions appear
 * here. The built-in ADMIN role holds the wildcard `*` (allow-all), so new
 * permissions added in code never lock an administrator out.
 */
export const PERMISSION_KEYS = [
  'estimate.author',
  'workflow.advance',
  'sow.author',
  'ratecard.manage',
  'cloudprice.manage',
  'fx.manage',
  'reference.manage',
  'workflow.configure',
  'checklist.configure',
  'roles.manage',
  'users.manage',
  'audit.view',
] as const;

export const PermissionKey = z.enum(PERMISSION_KEYS);
export type PermissionKey = z.infer<typeof PermissionKey>;

/** Wildcard permission held by the built-in ADMIN role — grants everything. */
export const WILDCARD_PERMISSION = '*';

export interface PermissionMeta {
  key: PermissionKey;
  label: string;
  description: string;
  group: string;
}

/** Human-readable catalog for the admin Roles editor (grouped + ordered). */
export const PERMISSIONS: PermissionMeta[] = [
  {
    key: 'estimate.author',
    label: 'Author estimates',
    description: 'Create, edit, clone, and delete estimates and their line items.',
    group: 'Estimates',
  },
  {
    key: 'workflow.advance',
    label: 'Advance the approval workflow',
    description: 'Move an estimate between stages (submit, approve, return to draft).',
    group: 'Estimates',
  },
  {
    key: 'sow.author',
    label: 'Author Statements of Work',
    description: 'Create, edit, issue, and revert Statements of Work.',
    group: 'Estimates',
  },
  {
    key: 'ratecard.manage',
    label: 'Manage rate cards',
    description: 'Create and edit rate cards, their roles, and rates.',
    group: 'Reference & pricing',
  },
  {
    key: 'cloudprice.manage',
    label: 'Refresh cloud prices',
    description: 'Pull fresh AWS / GCP / Azure prices into the catalog.',
    group: 'Reference & pricing',
  },
  {
    key: 'fx.manage',
    label: 'Manage FX rates',
    description: 'Edit exchange rates and trigger a live refresh.',
    group: 'Reference & pricing',
  },
  {
    key: 'reference.manage',
    label: 'Manage reference data',
    description: 'Add, rename, reorder, or deactivate lookup values.',
    group: 'Reference & pricing',
  },
  {
    key: 'workflow.configure',
    label: 'Configure the workflow',
    description: 'Author workflow stages and the role-gated transitions between them.',
    group: 'Governance',
  },
  {
    key: 'checklist.configure',
    label: 'Configure checklist rules',
    description: 'Toggle and retune smart-checklist rules and rule sets.',
    group: 'Governance',
  },
  {
    key: 'roles.manage',
    label: 'Manage roles & permissions',
    description: 'Create and edit roles and the permissions granted to each.',
    group: 'Administration',
  },
  {
    key: 'users.manage',
    label: 'Manage users',
    description: 'Create users, assign roles, and activate or deactivate accounts.',
    group: 'Administration',
  },
  {
    key: 'audit.view',
    label: 'View the audit log',
    description: 'Read the immutable audit trail of who changed what, and when.',
    group: 'Administration',
  },
];

// ── Roles (FR-30) — DB-stored, admin-managed ────────────────────────────────

export const RoleDto = z.object({
  id: z.string().uuid(),
  code: z.string(),
  displayName: z.string(),
  description: z.string().nullable(),
  isActive: z.boolean(),
  /** Built-in roles (Admin/GM/Estimator/Viewer) cannot be deleted or recoded. */
  isBuiltin: z.boolean(),
  /** Granted permission keys; the ADMIN role holds `['*']`. */
  permissions: z.array(z.string()),
  /** Number of users currently assigned this role. */
  userCount: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type RoleDto = z.infer<typeof RoleDto>;

export const CreateRoleRequest = z.object({
  code: RoleCode,
  displayName: z.string().min(1).max(80),
  description: z.string().max(500).optional(),
  permissions: z.array(PermissionKey).default([]),
});
export type CreateRoleRequest = z.infer<typeof CreateRoleRequest>;

export const UpdateRoleRequest = z.object({
  displayName: z.string().min(1).max(80).optional(),
  description: z.string().max(500).nullable().optional(),
  isActive: z.boolean().optional(),
  permissions: z.array(PermissionKey).optional(),
});
export type UpdateRoleRequest = z.infer<typeof UpdateRoleRequest>;
