import type { Role } from './types';

/**
 * What each role can and cannot do (FR-2, FR-26, NFR-16). This matrix mirrors the
 * server-side `@Roles` guards — authorization is enforced deny-by-default on the
 * API; this is the human-readable reference shown in the app.
 */
export interface RoleCapability {
  key: string;
  label: string;
  description: string;
  category: string;
  roles: Record<Role, boolean>;
}

export const ROLES: Role[] = ['ADMIN', 'GM', 'ESTIMATOR', 'VIEWER'];

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Admin',
  GM: 'General Manager',
  ESTIMATOR: 'Estimator',
  VIEWER: 'Viewer',
};

export const ROLE_SUMMARIES: Record<Role, string> = {
  ADMIN:
    'Full access, plus governs users, reference data, pricing, and the workflow/checklist engines.',
  GM: 'Reviews and approves estimates — can approve a submission or return it to draft, but cannot create or edit estimates.',
  ESTIMATOR: 'Builds and edits estimates and runs them through the approval workflow.',
  VIEWER: 'Read-only — can view authorized estimates and dashboards and export them.',
};

export const ROLE_CAPABILITY_CATEGORIES = [
  'Estimates',
  'Reference & pricing',
  'Governance configuration',
  'Administration',
  'Insights',
];

const T = { ADMIN: true, GM: true, ESTIMATOR: true, VIEWER: true };
const A_E = { ADMIN: true, GM: false, ESTIMATOR: true, VIEWER: false };
// Advance the workflow: estimators submit, GMs approve / return to draft.
const A_E_G = { ADMIN: true, GM: true, ESTIMATOR: true, VIEWER: false };
const A = { ADMIN: true, GM: false, ESTIMATOR: false, VIEWER: false };

export const ROLE_CAPABILITIES: RoleCapability[] = [
  // ── Estimates ──────────────────────────────────────────────────────────────
  {
    key: 'view_estimates',
    label: 'View estimates',
    description: 'Open and read estimates you are authorized to see.',
    category: 'Estimates',
    roles: T,
  },
  {
    key: 'author_estimates',
    label: 'Create & edit estimates',
    description:
      'Create, edit, clone, and delete estimates and their labor, non-labor, and cloud line items.',
    category: 'Estimates',
    roles: A_E,
  },
  {
    key: 'run_workflow',
    label: 'Advance the approval workflow',
    description:
      'Move an estimate between stages (Submit for review, Approve, …), subject to the checklist.',
    category: 'Estimates',
    roles: A_E_G,
  },
  {
    key: 'export_estimates',
    label: 'Export & print',
    description: 'Download CSV / Excel and open the printable summary.',
    category: 'Estimates',
    roles: T,
  },
  // ── Reference & pricing ─────────────────────────────────────────────────────
  {
    key: 'use_reference',
    label: 'Use rate cards & cloud catalog',
    description: 'Select governed rate cards and AWS/GCP/Azure prices while building estimates.',
    category: 'Reference & pricing',
    roles: T,
  },
  {
    key: 'manage_rate_cards',
    label: 'Manage rate cards',
    description: 'Create and edit rate cards, their roles, and rates.',
    category: 'Reference & pricing',
    roles: A,
  },
  {
    key: 'refresh_cloud_prices',
    label: 'Refresh cloud prices',
    description: 'Pull fresh AWS / GCP / Azure prices into the catalog.',
    category: 'Reference & pricing',
    roles: A,
  },
  {
    key: 'manage_fx',
    label: 'Manage FX rates',
    description: 'Edit exchange rates and trigger a live refresh (everyone can view them).',
    category: 'Reference & pricing',
    roles: A,
  },
  {
    key: 'manage_reference_data',
    label: 'Manage reference data',
    description:
      'Add, rename, reorder, or deactivate lookup values (phases, statuses, categories, …).',
    category: 'Reference & pricing',
    roles: A,
  },
  // ── Governance configuration ────────────────────────────────────────────────
  {
    key: 'configure_workflow',
    label: 'Configure the approval workflow',
    description: 'Author the workflow stages and the role-gated transitions between them.',
    category: 'Governance configuration',
    roles: A,
  },
  {
    key: 'configure_checklist',
    label: 'Configure checklist rules',
    description: 'Toggle and retune smart-checklist rules and add custom advisory rules.',
    category: 'Governance configuration',
    roles: A,
  },
  // ── Administration ──────────────────────────────────────────────────────────
  {
    key: 'manage_users',
    label: 'Manage users & roles',
    description: 'Create users, assign roles, and activate or deactivate accounts.',
    category: 'Administration',
    roles: A,
  },
  // ── Insights ────────────────────────────────────────────────────────────────
  {
    key: 'view_dashboard',
    label: 'View the dashboard',
    description: 'See portfolio counts, totals, by-stage breakdown, and recent activity.',
    category: 'Insights',
    roles: T,
  },
];
