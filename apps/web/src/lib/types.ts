/** FR-30: role codes are data-driven (admins add custom roles); validated server-side. */
export type Role = string;

export interface RoleDto {
  id: string;
  code: string;
  displayName: string;
  description: string | null;
  isActive: boolean;
  isBuiltin: boolean;
  permissions: string[];
  userCount: number;
  createdAt: string;
  updatedAt: string;
}
export interface PermissionMeta {
  key: string;
  label: string;
  description: string;
  group: string;
}
export type BillingPeriod = 'ONE_TIME' | 'MONTHLY' | 'YEARLY';
/**
 * SDLC phase is data-driven (FR-29) — the dropdown loads active values from the
 * `SDLC_PHASE` reference type. These are only a **fallback** shown before that
 * request resolves; the stored value is a plain code string.
 */
export const SDLC_PHASES: string[] = [
  'PLANNING',
  'DESIGN',
  'DEVELOPMENT',
  'TESTING',
  'DEPLOYMENT',
  'MAINTENANCE',
];

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  displayName: string | null;
  /** Permission keys the user's role grants (FR-30); `*` = wildcard (Admin). */
  permissions?: string[];
}

export interface UserDto {
  id: string;
  email: string;
  role: Role;
  displayName: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface EngineResult {
  oneTimeSubtotal: string;
  monthlySubtotal: string;
  yearlySubtotal: string;
  upchargeAmount: string;
  contingencyAmount: string;
  oneTimeTotal: string;
  monthlyTotal: string;
  yearlyTotal: string;
  grandTotal: string;
  marginAmount: string;
  sellPrice: string;
  taxAmount: string;
  clientPrice: string;
  categories: { category: string; oneTime: string; monthly: string; yearly: string }[];
  phases: { phase: string; oneTime: string; monthly: string; yearly: string }[];
}

export interface CapacityViolation {
  resourceName: string;
  date: string;
  totalPercent: number;
}

export interface LaborLine {
  id: string;
  roleName: string | null;
  description: string | null;
  quantity: string;
  units: string;
  unitsOptimistic: string | null;
  unitsMostLikely: string | null;
  unitsPessimistic: string | null;
  rateSnapshot: string;
  upchargePercentOverride: number | null;
  billingPeriod: BillingPeriod;
  sdlcPhase: string | null;
  resourceName: string | null;
  allocationPercent: number;
  startDate: string | null;
  endDate: string | null;
  lineTotal: string;
}
export interface NonLaborLine {
  id: string;
  category: string;
  description: string | null;
  type: string;
  amount: string;
  upchargePercentOverride: number | null;
  billingPeriod: BillingPeriod;
  sdlcPhase: string | null;
  periods: number;
  lineTotal: string;
}
export interface CloudLine {
  id: string;
  provider: string;
  region: string;
  service: string;
  skuOrInstance: string;
  quantity: string;
  usageHoursPerMonth: string;
  unitPriceSnapshot: string;
  upchargePercentOverride: number | null;
  billingPeriod: BillingPeriod;
  sdlcPhase: string | null;
  lineTotal: string;
}
export interface Assumption {
  id: string;
  text: string;
  createdAt: string;
}
export interface Comment {
  id: string;
  authorId: string;
  authorEmail: string;
  text: string;
  createdAt: string;
}

export interface EstimateDetail {
  id: string;
  name: string;
  description: string | null;
  status: string;
  currency: string;
  rateCardId: string | null;
  ownerId: string;
  globalUpchargePercent: number;
  contingencyPercent: number;
  marginPercent: number;
  taxPercent: number;
  laborItems: LaborLine[];
  nonLaborItems: NonLaborLine[];
  cloudItems: CloudLine[];
  assumptions: Assumption[];
  comments: Comment[];
  totals: EngineResult;
  capacityViolations: CapacityViolation[];
  /** Content is editable only in the workflow's initial (Draft) stage (FR-24). */
  editable: boolean;
}

export interface Baseline {
  id: string;
  label: string;
  grandTotal: string;
  clientPrice: string;
  oneTimeTotal: string;
  monthlyTotal: string;
  yearlyTotal: string;
  createdByEmail: string;
  createdAt: string;
}

export interface Scenario {
  id: string;
  name: string;
  status: string;
  currency: string;
  grandTotal: string;
  clientPrice: string;
  isCurrent: boolean;
  isRoot: boolean;
  updatedAt: string;
}

export interface EstimateSummary {
  id: string;
  name: string;
  status: string;
  currency: string;
  ownerId: string;
  grandTotal: string;
  updatedAt: string;
}
export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** A supporting document catalogued against an estimate (FR-29). */
export interface EstimateDocument {
  id: string;
  fileName: string;
  documentType: string;
  description: string | null;
  contentType: string;
  sizeBytes: number;
  uploadedByEmail: string | null;
  uploadedAt: string;
}

/** An immutable audit-trail event (FR-11). */
export interface AuditEvent {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actorId: string | null;
  actorEmail: string | null;
  occurredAt: string;
}

export interface RateCardRole {
  id: string;
  roleName: string;
  unit: string;
  rate: string;
}
export interface RateCard {
  id: string;
  name: string;
  currency: string;
  isActive: boolean;
  roles: RateCardRole[];
}
export interface CloudPrice {
  id: string;
  provider: string;
  category: string;
  region: string;
  service: string;
  skuOrInstance: string;
  unit: string;
  unitPrice: string;
  currency: string;
}
export interface ProviderLastPulled {
  provider: string;
  lastPulled: string | null;
  priceCount: number;
}

export interface FxRate {
  currency: string;
  rateToBase: string;
  updatedByEmail: string | null;
  updatedAt: string;
}

export interface DashboardSummary {
  totalEstimates: number;
  byStatus: { status: string; count: number }[];
  byStage: { stageKey: string; stageLabel: string; count: number }[];
  totalsByCurrency: { currency: string; grandTotal: string }[];
  baseCurrency: string;
  baseCurrencyTotal: string;
  recent: {
    id: string;
    name: string;
    status: string;
    currency: string;
    currentStageKey: string | null;
    grandTotal: string;
    updatedAt: string;
  }[];
}

export interface DashboardStageEstimate {
  id: string;
  name: string;
  status: string;
  currency: string;
  grandTotal: string;
  updatedAt: string;
}

export interface ReferenceType {
  id: string;
  code: string;
  displayName: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  valueCount: number;
}
export interface ReferenceValue {
  id: string;
  referenceTypeId: string;
  parentId: string | null;
  code: string;
  displayName: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  isBuiltin: boolean;
  metadata: Record<string, unknown> | null;
  children: ReferenceValue[];
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistItem {
  key: string;
  description: string;
  severity: string;
  scope: string;
  passed: boolean;
  message: string;
  /** IDs of the specific line items this rule flags, for deep-linking. */
  entityIds: string[];
  /** false when there's nothing for this rule to check yet — rendered as a "To do" (not started), not a pass. */
  applicable: boolean;
}
export interface ChecklistResult {
  passed: boolean;
  blocking: boolean;
  completeness: number;
  items: ChecklistItem[];
}

// ── Checklist rule sets (FR-25, admin) — a repo of named rule collections ─────
export interface ChecklistRuleSet {
  id: string;
  key: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  isActive: boolean;
  ruleCount: number;
}

// ── Checklist-rule authoring (FR-25, admin) ──────────────────────────────────

export interface ChecklistRuleCatalogEntry {
  key: string;
  description: string;
  severity: string;
  scope: string;
}
/**
 * The built-in checklist rules the engine knows how to evaluate (FR-25). The
 * Rules editor offers these **by description** so an admin picks a real check
 * instead of typing an unknown rule key. Mirrors the seeded built-ins; a rule
 * key not in this catalog is an "advisory" rule (no built-in check).
 */
export const CHECKLIST_RULE_CATALOG: ChecklistRuleCatalogEntry[] = [
  {
    key: 'rate_card_selected',
    description: 'A rate card is selected for the estimate',
    severity: 'BLOCKER',
    scope: 'ESTIMATE',
  },
  {
    key: 'labor_role_assigned',
    description: 'Every labor line has a role/resource assigned with quantity and units',
    severity: 'BLOCKER',
    scope: 'LABOR',
  },
  {
    key: 'cloud_line_complete',
    description:
      'Every cloud line has provider, region, instance, usage and a snapshotted unit price',
    severity: 'BLOCKER',
    scope: 'CLOUD',
  },
  {
    key: 'nonlabor_amount_period',
    description: 'Every non-labor line has an amount and a billing period',
    severity: 'BLOCKER',
    scope: 'NONLABOR',
  },
  {
    key: 'billing_period_set',
    description: 'No recurring line is missing a billing period',
    severity: 'BLOCKER',
    scope: 'ESTIMATE',
  },
  {
    key: 'resource_capacity',
    description: 'No resource is allocated over 100% on any date',
    severity: 'BLOCKER',
    scope: 'RESOURCE',
  },
  {
    key: 'upcharge_set',
    description: 'An upcharge percentage is set (or explicitly zero)',
    severity: 'WARNING',
    scope: 'ESTIMATE',
  },
  {
    key: 'contingency_set',
    description: 'A contingency percentage is set (or explicitly zero)',
    severity: 'WARNING',
    scope: 'ESTIMATE',
  },
  {
    key: 'totals_reconcile',
    description: 'One-time, monthly and yearly totals reconcile',
    severity: 'INFO',
    scope: 'ESTIMATE',
  },
];

export interface ChecklistRuleAdmin {
  id: string;
  key: string;
  description: string;
  severity: string;
  scope: string;
  isActive: boolean;
  isBuiltin: boolean;
  ruleSetId: string;
  hasLogic: boolean;
}

export interface AvailableTransition {
  toStageKey: string;
  toStageLabel: string;
  label: string;
  allowedRole: string;
  requiresChecklistPass: boolean;
  allowedForUser: boolean;
  blockedByChecklist: boolean;
}
export interface WorkflowEvent {
  id: string;
  fromStageKey: string | null;
  toStageKey: string;
  actorId: string;
  note: string | null;
  occurredAt: string;
}
export interface EstimateWorkflow {
  currentStageKey: string | null;
  currentStageLabel: string | null;
  availableTransitions: AvailableTransition[];
  history: WorkflowEvent[];
}

// ── Workflow authoring (FR-24, admin) ────────────────────────────────────────
export interface WorkflowStageDef {
  id: string;
  key: string;
  label: string;
  sortOrder: number;
  isInitial: boolean;
  isTerminal: boolean;
}
export interface WorkflowTransitionDef {
  id: string;
  key: string;
  description: string | null;
  fromStageKey: string;
  toStageKey: string;
  allowedRole: Role;
  label: string;
  requiresChecklistPass: boolean;
}
export interface WorkflowDefinition {
  id: string;
  key: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  isActive: boolean;
  stages: WorkflowStageDef[];
  transitions: WorkflowTransitionDef[];
}
export interface WorkflowSummary {
  id: string;
  key: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  isActive: boolean;
  stageCount: number;
  transitionCount: number;
}

// ── Statement of Work (BR-7) ─────────────────────────────────────────────────
export interface SowEligibleEstimate {
  id: string;
  name: string;
  stageKey: string;
  stageLabel: string;
}
export interface SowSummary {
  id: string;
  number: string;
  estimateId: string;
  estimateName: string;
  title: string;
  status: string;
  clientName: string;
  updatedAt: string;
  estimateUpdatedAt: string;
}
export interface StatementOfWork {
  id: string;
  number: string;
  estimateId: string;
  estimateName: string;
  title: string;
  status: string;
  clientName: string;
  providerName: string;
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
  effectiveDate: string | null;
  issuedAt: string | null;
  preparedByEmail: string | null;
  currency: string;
  pricing: EngineResult;
  createdAt: string;
  updatedAt: string;
}
