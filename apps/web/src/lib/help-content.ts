/**
 * Help guide — a catalog of step-by-step use cases for Kerdos.
 *
 * Each use case is **meta-tagged** (feature IDs, the route it happens on, the
 * smart-checklist rule keys it resolves, and free-text keywords) so the app can
 * **deep-link straight into the relevant use case** when a user gets stuck —
 * e.g. a blocked checklist item links to `/help#uc-<id>` via `checklistKeys`,
 * and any screen can link to `/help#uc-<id>` by id.
 *
 * The `id` is the stable deep-link anchor: the Help page renders each use case
 * as `<section id="uc-<id>">`, and navigating to `/help#uc-<id>` scrolls to and
 * highlights it.
 */

export type HelpCategory =
  | 'Getting started'
  | 'Building an estimate'
  | 'Pricing & markup'
  | 'Governance & review'
  | 'Outputs'
  | 'Administration';

/** Ordered list of categories for the sidebar / table of contents. */
export const HELP_CATEGORIES: HelpCategory[] = [
  'Getting started',
  'Building an estimate',
  'Pricing & markup',
  'Governance & review',
  'Outputs',
  'Administration',
];

export interface HelpStep {
  /** The action the user takes. */
  text: string;
  /** Optional extra detail / why it matters. */
  detail?: string;
}

export interface UseCase {
  /** Stable slug — the deep-link anchor (`/help#uc-<id>`). */
  id: string;
  title: string;
  category: HelpCategory;
  /** Who performs this (end-user persona). */
  persona: string;
  /** One-line summary of the outcome. */
  goal: string;
  // ── META TAGS — used to deep-link INTO this use case ───────────────────────
  /** Requirement / feature IDs this use case covers. */
  featureIds: string[];
  /** Where in the app this happens (a link target; dynamic routes use a hint). */
  route?: string;
  /** Smart-checklist rule keys this use case explains how to resolve (FR-25). */
  checklistKeys?: string[];
  /** Free-text terms for search/matching. */
  keywords?: string[];
  // ──────────────────────────────────────────────────────────────────────────
  steps: HelpStep[];
  /** Other use-case ids worth reading next. */
  related?: string[];
}

export const HELP_USE_CASES: UseCase[] = [
  // ── Getting started ────────────────────────────────────────────────────────
  {
    id: 'sign-in',
    title: 'Sign in to Kerdos',
    category: 'Getting started',
    persona: 'Everyone',
    goal: 'Authenticate and land on your estimates.',
    featureIds: ['FR-1'],
    route: '/login',
    keywords: ['login', 'log in', 'password', 'sign in', 'authenticate', 'token'],
    steps: [
      { text: 'Open the app — you’ll be taken to the sign-in screen if you’re not logged in.' },
      { text: 'Enter the email and password for your account.' },
      {
        text: 'Click “Sign in”.',
        detail:
          'On success you receive a short-lived access token (refreshed automatically) and land on the Estimates list. A wrong email or password returns a clear error and no token.',
      },
    ],
    related: ['find-estimates', 'create-estimate'],
  },
  {
    id: 'find-estimates',
    title: 'Find an estimate (search, sort & paginate)',
    category: 'Getting started',
    persona: 'Estimator / Viewer',
    goal: 'Locate an existing estimate by name, then sort and page through the list.',
    featureIds: ['FR-9', 'FE-26'],
    route: '/',
    keywords: ['search', 'sort', 'list', 'find', 'paginate', 'rows per page', 'stage'],
    steps: [
      { text: 'Go to “Estimates” in the top navigation.' },
      { text: 'Type part of a name in the search box to filter the list as you type.' },
      {
        text: 'Click any column header (Name, Stage, Currency, Grand total, Updated) to sort; click again to reverse.',
        detail:
          'Use the “Rows per page” dropdown (10/20/25/40/50) and Prev/Next at the bottom to page through. The Stage column shows each estimate’s current workflow stage.',
      },
      {
        text: 'Click an estimate’s name to open it in the editor.',
        detail:
          'Viewers see only estimates they are authorized to view; a GM sees only estimates In Review or Approved (their review queue).',
      },
    ],
    related: ['create-estimate', 'dashboard-overview'],
  },
  {
    id: 'dashboard-overview',
    title: 'Read the dashboard',
    category: 'Getting started',
    persona: 'All users',
    goal: 'See counts, totals, by-stage breakdown, and recent activity at a glance.',
    featureIds: ['FR-18', 'FE-27'],
    route: '/dashboard',
    keywords: ['dashboard', 'summary', 'totals', 'recent', 'stage', 'overview'],
    steps: [
      { text: 'Click “Dashboard” in the top navigation.' },
      {
        text: 'Review the summary cards: total estimates, total value, and the base-currency total.',
        detail:
          'Per-currency totals are converted to the base currency (USD) using the FX rates so a single figure is comparable.',
      },
      {
        text: 'Scan “By workflow stage” to see how many estimates sit in each stage; click a stage to drill into its estimates.',
        detail:
          'The workflow stage is the single source of truth for an estimate’s lifecycle (there is no separate “status”).',
      },
      {
        text: 'Use “Recent activity” to jump back into estimates you touched lately.',
        detail:
          'A GM’s dashboard is scoped to their queue: the stage breakdown and totals cover only In Review / Approved, and Recent activity shows estimates the GM personally acted on.',
      },
    ],
    related: ['find-estimates', 'manage-fx-rates'],
  },

  // ── Building an estimate ─────────────────────────────────────────────────────
  {
    id: 'create-estimate',
    title: 'Create a new estimate',
    category: 'Building an estimate',
    persona: 'Estimator',
    goal: 'Start a fresh estimate tied to a currency.',
    featureIds: ['FR-4', 'FE-13'],
    route: '/',
    keywords: ['create', 'new', 'estimate', 'start'],
    steps: [
      { text: 'On the Estimates list, type a name in the “Q3 Platform build” box.' },
      {
        text: 'Click “Create”.',
        detail:
          'The estimate opens in the editor with live totals showing zero until you add lines.',
      },
      { text: 'Next, choose a rate card so labor lines use governed rates.' },
    ],
    related: ['choose-rate-card', 'add-labor-line', 'clone-estimate'],
  },
  {
    id: 'choose-rate-card',
    title: 'Choose a rate card for an estimate',
    category: 'Building an estimate',
    persona: 'Estimator',
    goal: 'Attach a governed rate card so labor roles and rates are available.',
    featureIds: ['FR-3', 'FR-4'],
    route: '/',
    checklistKeys: ['rate_card_selected'],
    keywords: ['rate card', 'rates', 'roles', 'select', 'settings', 'blocked'],
    steps: [
      { text: 'Open the estimate and find the “Settings” section.' },
      {
        text: 'Pick a rate card from the “Rate card” dropdown.',
        detail:
          'Until a rate card is selected, the smart checklist shows a blocking “Select a rate card” item and labor lines have no roles to choose from.',
      },
      { text: 'The selection saves immediately and the checklist item turns green.' },
    ],
    related: ['add-labor-line', 'manage-rate-card', 'smart-checklist'],
  },
  {
    id: 'add-labor-line',
    title: 'Add a labor line item',
    category: 'Building an estimate',
    persona: 'Estimator',
    goal: 'Price effort by role × quantity × units at a snapshotted rate.',
    featureIds: ['FR-5', 'FE-14'],
    route: '/',
    checklistKeys: ['labor_role_assigned'],
    keywords: ['labor', 'role', 'hours', 'days', 'effort', 'rate', 'line item'],
    steps: [
      { text: 'In the “Labor” section, pick a role from the “Select role…” dropdown.' },
      {
        text: 'Enter the quantity (e.g. number of people) and units (hours or days).',
        detail:
          'The role’s current rate is snapshotted onto the line, so later rate-card changes never alter this saved estimate.',
      },
      { text: 'Optionally set a billing period and an SDLC phase, then click “Add labor”.' },
      {
        text: 'The line total appears and rolls into the category, phase, and grand totals.',
        detail:
          'A line with no role/rate, a zero quantity, or zero units is flagged by the checklist — click that item to jump straight to the offending row.',
      },
    ],
    related: ['assign-resource-capacity', 'pert-estimate', 'apply-upcharge'],
  },
  {
    id: 'assign-resource-capacity',
    title: 'Assign a person and avoid over-allocation',
    category: 'Building an estimate',
    persona: 'Estimator / Delivery Manager',
    goal: 'Split a resource across assignments without exceeding 100% on any day.',
    featureIds: ['FR-27', 'FE-48'],
    route: '/',
    checklistKeys: ['resource_capacity'],
    keywords: [
      'resource',
      'capacity',
      'allocation',
      'over-allocated',
      '100%',
      'date range',
      'split',
    ],
    steps: [
      { text: 'On a labor line, type the person’s name in “resource (optional)”.' },
      {
        text: 'Set the allocation % (a resource has 100% capacity per day) and a start/end date window.',
        detail:
          'You can split a person across lines — e.g. 50% + 50% — as long as the daily sum stays ≤ 100%.',
      },
      { text: 'Click “Add labor”. The window shows as e.g. 7/01–7/31 on the row.' },
      {
        text: 'If a new booking would push that person over 100% on any overlapping date, the save is rejected with an “over-allocated” message.',
        detail:
          'The smart checklist also raises a BLOCKER; click it to highlight every line involved in the clash.',
      },
    ],
    related: ['add-labor-line', 'smart-checklist'],
  },
  {
    id: 'add-nonlabor-line',
    title: 'Add a non-labor cost',
    category: 'Building an estimate',
    persona: 'Estimator',
    goal: 'Capture fixed or recurring costs like licenses, infrastructure, or services.',
    featureIds: ['FR-6', 'FE-15'],
    route: '/',
    checklistKeys: ['nonlabor_amount_period'],
    keywords: ['non-labor', 'license', 'infrastructure', 'fixed', 'recurring', 'cost', 'category'],
    steps: [
      { text: 'In the “Non-labor” section, choose a cost category.' },
      { text: 'Enter the amount and choose a billing period (one-time, monthly, or yearly).' },
      {
        text: 'Optionally tag an SDLC phase, then click “Add non-labor”.',
        detail:
          'A non-labor line missing an amount or billing period is flagged by the checklist — click the item to jump to the row.',
      },
    ],
    related: ['set-billing-period', 'tag-sdlc-phase'],
  },
  {
    id: 'add-cloud-line',
    title: 'Add a cloud compute line (AWS / GCP / Azure)',
    category: 'Building an estimate',
    persona: 'Estimator / Engineering Lead',
    goal: 'Price compute from the provider catalog with a snapshotted unit price.',
    featureIds: ['FR-21', 'FE-39', 'NFR-14'],
    route: '/',
    checklistKeys: ['cloud_line_complete'],
    keywords: ['cloud', 'aws', 'gcp', 'azure', 'compute', 'instance', 'region', 'usage', 'hours'],
    steps: [
      {
        text: 'In the “Cloud compute” section, pick an instance from the catalog — each entry shows provider, service, instance, region, and unit price.',
      },
      {
        text: 'Set the quantity and usage hours per month (defaults to 730 = a full month).',
        detail:
          'The unit price is snapshotted onto the line, so a later catalog refresh never changes this estimate.',
      },
      { text: 'Optionally tag an SDLC phase, then click “Add cloud”.' },
      {
        text: 'A cloud line missing a provider/region/instance/usage or price is flagged by the checklist — click it to jump to the row.',
      },
    ],
    related: ['set-billing-period', 'cloud-prices-refresh', 'apply-upcharge'],
  },
  {
    id: 'set-billing-period',
    title: 'Set one-time vs monthly vs yearly',
    category: 'Building an estimate',
    persona: 'Estimator',
    goal: 'Control how each line rolls into one-time, monthly, and annualized totals.',
    featureIds: ['FR-23', 'FE-42'],
    route: '/',
    checklistKeys: ['billing_period_set'],
    keywords: ['billing period', 'monthly', 'yearly', 'one-time', 'recurring', 'annualized'],
    steps: [
      { text: 'On any line (labor, non-labor, or cloud), choose its billing period.' },
      {
        text: 'One-time costs show separately; monthly costs roll up to the monthly total and ×12 to the yearly total; yearly costs roll up to the yearly total and ÷12 to monthly.',
      },
      {
        text: 'Read the result in the totals cards at the top: One-time, Monthly, Yearly, and Grand total.',
        detail: 'Every line must have a billing period or the checklist flags it.',
      },
    ],
    related: ['read-totals', 'add-nonlabor-line', 'add-cloud-line'],
  },
  {
    id: 'tag-sdlc-phase',
    title: 'Tag SDLC phases and read the phase breakdown',
    category: 'Building an estimate',
    persona: 'Estimator / Delivery Manager',
    goal: 'See cost split across Planning, Design, Development, Testing, Deployment, Maintenance.',
    featureIds: ['FR-28', 'FE-49'],
    route: '/',
    keywords: [
      'sdlc',
      'phase',
      'planning',
      'design',
      'development',
      'testing',
      'deployment',
      'breakdown',
    ],
    steps: [
      {
        text: 'On any line, pick a phase from the “Phase…” dropdown (values come from reference data).',
      },
      {
        text: 'Add or save the line. The “Cost by SDLC phase” table appears on the estimate.',
        detail:
          'Each phase shows one-time / monthly / yearly subtotals (post-upcharge). Lines with no phase roll up under “Unassigned”.',
      },
    ],
    related: ['read-totals', 'manage-reference-data'],
  },
  {
    id: 'pert-estimate',
    title: 'Use three-point (PERT) estimation',
    category: 'Building an estimate',
    persona: 'Engineering Lead',
    goal: 'Derive effort from optimistic / most-likely / pessimistic units.',
    featureIds: ['FR-13', 'FE-19'],
    route: '/',
    keywords: ['pert', 'three-point', 'optimistic', 'pessimistic', 'most likely', 'estimation'],
    steps: [
      {
        text: 'On a labor line, fill the PERT inputs: opt (optimistic), likely, and pess (pessimistic) units.',
      },
      {
        text: 'When all three are present, the effective units become the PERT weighted average (o + 4·m + p) / 6.',
        detail:
          'Values must be ordered optimistic ≤ most-likely ≤ pessimistic, otherwise the save is rejected.',
      },
      { text: 'Click “Add labor” — the computed units drive the line total.' },
    ],
    related: ['add-labor-line'],
  },
  {
    id: 'record-assumptions',
    title: 'Record assumptions & notes',
    category: 'Building an estimate',
    persona: 'Estimator',
    goal: 'Capture the assumptions behind the numbers so the estimate is auditable.',
    featureIds: ['FR-8', 'FE-16'],
    route: '/',
    keywords: ['assumption', 'notes', 'audit', 'rationale'],
    steps: [
      { text: 'Open the “Assumptions & notes” section on the estimate.' },
      { text: 'Type an assumption and press Add — it’s timestamped and listed.' },
      { text: 'Repeat for each assumption; delete any that no longer apply.' },
    ],
    related: ['comments-collab', 'baselines-versions', 'upload-documents'],
  },
  {
    id: 'upload-documents',
    title: 'Attach supporting documents',
    category: 'Building an estimate',
    persona: 'Estimator',
    goal: 'Upload and catalog supporting files (proposals, contracts, diagrams) on an estimate.',
    featureIds: ['FR-29'],
    route: '/',
    keywords: ['document', 'upload', 'attachment', 'file', 'proposal', 'contract', 'supporting'],
    steps: [
      { text: 'Open the estimate and find the “Supporting documents” card.' },
      {
        text: 'Choose a file (≤ 10 MB), pick a Document type, add an optional description, then click “Upload”.',
        detail:
          'Document types come from reference data (Requirements/RFP, Contract/MSA, Statement of Work, …); an admin can add more under Reference Data.',
      },
      {
        text: 'Each document is listed with its type, size, and who uploaded it — use “Download” to retrieve it or “Delete” to remove it.',
        detail:
          'Uploading/deleting requires the estimate.author permission, so a GM or Viewer can download documents but not add or remove them. Every upload and delete is recorded in the Audit Log.',
      },
    ],
    related: ['record-assumptions', 'audit-log'],
  },
  {
    id: 'clone-estimate',
    title: 'Clone an existing estimate',
    category: 'Building an estimate',
    persona: 'Estimator',
    goal: 'Start from a copy of an existing estimate instead of a blank one.',
    featureIds: ['FR-4', 'FE-13'],
    route: '/',
    keywords: ['clone', 'copy', 'duplicate', 'reuse'],
    steps: [
      { text: 'Open the estimate you want to copy.' },
      {
        text: 'Use the clone action to create a duplicate with all its line items and settings.',
        detail:
          'Snapshots (rates, cloud unit prices) are copied as-is so the clone is a faithful starting point.',
      },
      { text: 'Rename the clone and adjust lines for the new scenario.' },
    ],
    related: ['scenarios-compare', 'create-estimate'],
  },

  // ── Pricing & markup ────────────────────────────────────────────────────────
  {
    id: 'apply-upcharge',
    title: 'Apply an upcharge (global + per-line)',
    category: 'Pricing & markup',
    persona: 'Estimator',
    goal: 'Mark every line up by a default percentage, overriding it on individual lines.',
    featureIds: ['FR-22', 'FE-41'],
    route: '/',
    checklistKeys: ['upcharge_set'],
    keywords: ['upcharge', 'markup', 'percentage', 'global', 'override'],
    steps: [
      { text: 'In “Settings”, set the “Global upcharge %” to apply across the whole estimate.' },
      {
        text: 'To override a single line, set that line’s per-line upcharge — the per-line value wins where set.',
        detail:
          'Upcharge is applied to each line’s base value first; contingency is then applied to the upcharged subtotal.',
      },
      { text: 'Watch the “Upcharge” figure under Settings update the totals.' },
    ],
    related: ['apply-contingency', 'margin-tax-client-price', 'read-totals'],
  },
  {
    id: 'apply-contingency',
    title: 'Apply a contingency %',
    category: 'Pricing & markup',
    persona: 'Estimator',
    goal: 'Add a risk buffer on top of the upcharged subtotal.',
    featureIds: ['FR-7', 'FE-18'],
    route: '/',
    checklistKeys: ['contingency_set'],
    keywords: ['contingency', 'buffer', 'risk', 'percentage'],
    steps: [
      { text: 'In “Settings”, set the “Contingency %”.' },
      {
        text: 'Contingency is applied after upcharge, on the upcharged subtotal — a single, well-tested order.',
      },
      { text: 'The “Contingency” figure and the grand total update immediately.' },
    ],
    related: ['apply-upcharge', 'read-totals'],
  },
  {
    id: 'margin-tax-client-price',
    title: 'Add margin & tax to get a client price',
    category: 'Pricing & markup',
    persona: 'Estimator / Finance',
    goal: 'Turn internal cost into a client-facing sell price.',
    featureIds: ['FR-16', 'FE-20'],
    route: '/',
    keywords: ['margin', 'markup', 'tax', 'sell price', 'client price', 'pricing'],
    steps: [
      { text: 'In “Settings”, set “Margin %” and/or “Tax %”.' },
      {
        text: 'A second row of cards appears: Margin, Sell price, Tax, and Client price.',
        detail: 'Grand total is the internal cost; client price is what you’d quote.',
      },
    ],
    related: ['apply-upcharge', 'apply-contingency', 'export-csv'],
  },
  {
    id: 'read-totals',
    title: 'Read the totals (one-time / monthly / yearly / grand)',
    category: 'Pricing & markup',
    persona: 'All users',
    goal: 'Understand what each total card represents.',
    featureIds: ['FR-7', 'FR-23'],
    route: '/',
    checklistKeys: ['totals_reconcile'],
    keywords: ['totals', 'grand total', 'monthly', 'yearly', 'one-time', 'subtotal'],
    steps: [
      {
        text: 'The cards at the top of an estimate show One-time, Monthly, Yearly, and Grand total (cost).',
      },
      {
        text: 'One-time captures non-recurring spend; monthly and yearly are the recurring roll-ups (yearly = monthly ×12).',
      },
      {
        text: 'If an estimate has no line items, the checklist reminds you to add at least one before it reconciles.',
      },
    ],
    related: ['set-billing-period', 'tag-sdlc-phase', 'apply-upcharge'],
  },

  // ── Governance & review ──────────────────────────────────────────────────────
  {
    id: 'smart-checklist',
    title: 'Use the smart checklist to complete an estimate',
    category: 'Governance & review',
    persona: 'Estimator',
    goal: 'Resolve every blocking item so the estimate can advance.',
    featureIds: ['FR-25', 'FE-44'],
    route: '/',
    keywords: ['checklist', 'validation', 'blocker', 'complete', 'gate', 'deep link'],
    steps: [
      { text: 'Open the “Smart checklist” panel on the estimate.' },
      {
        text: 'Each item shows one of three states with a message: ✓ done, ✕ needs fixing (red items are blocking), or ○ “To do” — something that applies but you haven’t started yet (e.g. no labor lines added). A brand-new estimate is all ✕/○ and 0% complete — nothing is green until it’s verified.',
      },
      {
        text: 'Click any item to jump to exactly where it’s fixed or started — the specific offending line is scrolled into view and highlighted (or the relevant section for estimate-level and to-do items). Use the “How?” link for a step-by-step guide.',
      },
      {
        text: 'Resolve every blocking item; the completeness percentage rises and workflow transitions unlock.',
      },
    ],
    related: ['approval-workflow', 'choose-rate-card', 'assign-resource-capacity'],
  },
  {
    id: 'approval-workflow',
    title: 'Move an estimate through the approval workflow',
    category: 'Governance & review',
    persona: 'Estimator / GM / Admin',
    goal: 'Transition an estimate between stages, gated by role and the checklist.',
    featureIds: ['FR-24', 'FE-43'],
    route: '/',
    keywords: [
      'workflow',
      'approval',
      'review',
      'stage',
      'transition',
      'submit',
      'final',
      'return to draft',
      'gm',
    ],
    steps: [
      {
        text: 'Open the “Approval workflow” panel — it shows the current stage (the estimate’s single lifecycle indicator; there is no separate status).',
        detail:
          'An estimate is only editable in the Draft stage; once it moves to In Review / Approved / Final it is locked until returned to Draft.',
      },
      {
        text: 'Click an available transition (e.g. “Submit for review”), add an optional note, then Confirm.',
        detail:
          'A transition is disabled if your role isn’t permitted, or if a required smart-checklist BLOCKER is still failing. Default gating: an Estimator submits Draft→In Review; a GM (or Admin) Approves or Returns to Draft.',
      },
      {
        text: 'When a GM clicks “Return to draft”, they are prompted for a reason — that note appears in the history so the estimator knows what to fix.',
        detail: 'Every transition is recorded with who, when, from→to, and the note.',
      },
    ],
    related: ['smart-checklist', 'roles-permissions', 'manage-workflow'],
  },
  {
    id: 'baselines-versions',
    title: 'Capture a baseline / version',
    category: 'Governance & review',
    persona: 'Delivery / Project Manager',
    goal: 'Freeze a snapshot of the totals to compare against later.',
    featureIds: ['FR-15', 'FE-25'],
    route: '/',
    keywords: ['baseline', 'version', 'snapshot', 'diff', 're-baseline', 'history'],
    steps: [
      { text: 'Open the “Baselines & versions” section.' },
      { text: 'Type a label (e.g. “v1 approved”) and click “Capture baseline”.' },
      {
        text: 'Each baseline stores the totals at that moment; the table shows the delta versus the current estimate.',
      },
    ],
    related: ['scenarios-compare', 'record-assumptions'],
  },
  {
    id: 'scenarios-compare',
    title: 'Create & compare scenarios',
    category: 'Governance & review',
    persona: 'Pre-Sales Consultant',
    goal: 'Build variants of an estimate and compare their totals side by side.',
    featureIds: ['FR-14', 'FE-24'],
    route: '/',
    keywords: ['scenario', 'compare', 'variant', 'option', 'what-if'],
    steps: [
      { text: 'Open the “Scenarios” section and click “Create scenario”.' },
      {
        text: 'A linked variant is created; edit its lines independently of the base.',
      },
      {
        text: 'The comparison table lists every scenario in the group with grand total and client price.',
      },
    ],
    related: ['clone-estimate', 'baselines-versions'],
  },
  {
    id: 'comments-collab',
    title: 'Collaborate with comments',
    category: 'Governance & review',
    persona: 'All users',
    goal: 'Discuss an estimate inline with teammates.',
    featureIds: ['FR-19', 'FE-28'],
    route: '/',
    keywords: ['comment', 'collaborate', 'discuss', 'share', 'note'],
    steps: [
      { text: 'Open the “Comments” section on the estimate.' },
      { text: 'Type a comment and press Enter or click “Comment”.' },
      { text: 'Comments are attributed to you and timestamped; delete your own as needed.' },
    ],
    related: ['record-assumptions'],
  },

  // ── Outputs ──────────────────────────────────────────────────────────────────
  {
    id: 'export-csv',
    title: 'Export an estimate to CSV',
    category: 'Outputs',
    persona: 'All users',
    goal: 'Download a spreadsheet-friendly file of line items and totals.',
    featureIds: ['FR-10', 'FE-21'],
    route: '/',
    keywords: ['export', 'csv', 'download', 'spreadsheet'],
    steps: [
      { text: 'Open the estimate and click “Export CSV” in the top-right actions.' },
      {
        text: 'The file includes line items, subtotals, contingency, phase summary, and the grand total.',
      },
    ],
    related: ['export-excel', 'printable-summary'],
  },
  {
    id: 'export-excel',
    title: 'Export an estimate to Excel',
    category: 'Outputs',
    persona: 'All users',
    goal: 'Download an Excel-openable workbook of the estimate.',
    featureIds: ['FR-20', 'FE-22'],
    route: '/',
    keywords: ['export', 'excel', 'xls', 'workbook', 'download'],
    steps: [
      { text: 'Open the estimate and click “Export Excel”.' },
      { text: 'Open the downloaded file in Excel (or any spreadsheet) to review and reformat.' },
    ],
    related: ['export-csv', 'printable-summary'],
  },
  {
    id: 'printable-summary',
    title: 'Print or PDF via the printable summary',
    category: 'Outputs',
    persona: 'All users',
    goal: 'Produce a clean, shareable one-page summary.',
    featureIds: ['FR-20', 'FE-23'],
    route: '/',
    keywords: ['print', 'pdf', 'summary', 'share', 'report'],
    steps: [
      { text: 'On the estimate, click “Printable summary”.' },
      {
        text: 'A print-ready page renders the estimate, totals, and phase breakdown.',
      },
      {
        text: 'Click “Print” and choose “Save as PDF” in your browser to share a PDF.',
      },
    ],
    related: ['export-csv', 'export-excel'],
  },
  {
    id: 'statement-of-work',
    title: 'Create an official Statement of Work (SOW) PDF',
    category: 'Outputs',
    persona: 'Estimator',
    goal: 'Compose, edit, and issue a legal SOW from an estimate, then print it to PDF.',
    featureIds: ['BR-7'],
    route: '/sow',
    keywords: ['sow', 'statement of work', 'contract', 'legal', 'pdf', 'official', 'issue'],
    steps: [
      { text: 'Open “SOW” from the top navigation.' },
      {
        text: 'Pick an approved source estimate and click “New SOW from estimate”.',
        detail:
          'Only estimates that have reached the Approved/Final stage of their workflow appear in the picker (so the SOW is built on complete, checklist-passed numbers). A system document number (e.g. SOW-A1B2C3) is assigned, and Title, overview, assumptions, and pricing are pre-filled from the estimate.',
      },
      {
        text: 'Edit the sections — parties, scope, deliverables, timeline, payment terms, assumptions, and terms & conditions — then “Save changes”.',
      },
      {
        text: 'Click “Issue (lock)” to finalize: the SOW is locked and its pricing is snapshotted so it never changes if the estimate is later edited.',
        detail: 'Use “Revert to draft” to reopen an issued SOW for further edits.',
      },
      {
        text: 'Open the PDF view and choose “Print / Save as PDF” to produce the official document, including signature blocks.',
      },
    ],
    related: ['printable-summary', 'export-csv'],
  },

  // ── Administration ───────────────────────────────────────────────────────────
  {
    id: 'roles-permissions',
    title: 'Understand & create roles and permissions',
    category: 'Administration',
    persona: 'Administrator',
    goal: 'See what each role can do, and create custom roles with tailored permissions.',
    featureIds: ['FR-2', 'FR-26', 'FR-30', 'NFR-16'],
    route: '/roles',
    keywords: [
      'roles',
      'permissions',
      'rbac',
      'access',
      'admin',
      'gm',
      'general manager',
      'estimator',
      'viewer',
      'custom role',
      'can',
      'cannot',
    ],
    steps: [
      {
        text: 'Open “Roles” under the Governance menu (Admin only).',
        detail:
          'The four built-in roles are Admin (everything), GM/General Manager (review & approve estimates or return to draft — no authoring), Estimator (create/edit estimates), and Viewer (read/export).',
      },
      {
        text: 'Scan the capability matrix — a ✓/✕ per permission for each role, grouped by area.',
        detail:
          'Access is deny-by-default and enforced on the server, so the matrix reflects what each role is actually allowed to do.',
      },
      {
        text: 'Create a new role, then toggle exactly which permissions it grants (e.g. a “Reviewer” that can approve but not edit). Roles are data-driven — no code change or redeploy.',
        detail: 'Role and permission changes are audited.',
      },
    ],
    related: ['manage-users', 'approval-workflow', 'audit-log'],
  },
  {
    id: 'manage-users',
    title: 'Manage users & roles',
    category: 'Administration',
    persona: 'Administrator',
    goal: 'Create accounts, assign roles, and activate/deactivate users.',
    featureIds: ['FR-26', 'FE-45', 'FE-46'],
    route: '/users',
    keywords: ['users', 'roles', 'admin', 'rbac', 'invite', 'deactivate', 'permissions'],
    steps: [
      { text: 'Open “Users” under the Admin menu (Admin only).' },
      {
        text: 'Create a user with an email and a role: Admin, GM, Estimator, Viewer, or any custom role you’ve defined.',
        detail:
          'A GM reviews/approves estimates but cannot author them. Access is deny-by-default and enforced server-side; role changes are audited.',
      },
      {
        text: 'Deactivate an account to revoke access without deleting history; reactivate when needed.',
      },
    ],
    related: ['roles-permissions', 'audit-log', 'manage-reference-data'],
  },
  {
    id: 'audit-log',
    title: 'Review the audit log',
    category: 'Administration',
    persona: 'Administrator',
    goal: 'See an immutable, read-only trail of who changed what and when.',
    featureIds: ['FR-11', 'NFR-16'],
    route: '/audit',
    keywords: ['audit', 'trail', 'history', 'who', 'changed', 'compliance', 'log', 'security'],
    steps: [
      { text: 'Open “Audit Log” under the Admin menu (requires the audit.view permission).' },
      {
        text: 'Browse events newest-first; filter by entity type or search by entity/action, and page through with the rows-per-page control.',
        detail:
          'Each row shows the actor, action (CREATE / UPDATE / DELETE / UPLOAD / COMMENT / workflow transitions…), entity, and a UTC timestamp.',
      },
      {
        text: 'The log is read-only and append-only — it cannot be edited or deleted, so it stands as the accountability record.',
        detail: 'Document uploads/deletes, user & role changes, and estimate edits all land here.',
      },
    ],
    related: ['manage-users', 'roles-permissions', 'upload-documents'],
  },
  {
    id: 'manage-rate-card',
    title: 'Create & manage a rate card',
    category: 'Administration',
    persona: 'Administrator',
    goal: 'Define governed roles and rates estimators select from.',
    featureIds: ['FR-3', 'FE-10'],
    route: '/rate-cards',
    keywords: ['rate card', 'roles', 'rates', 'currency', 'governed', 'admin'],
    steps: [
      { text: 'Open “Rate cards” from the top navigation.' },
      { text: 'Create a rate card with a name and currency.' },
      {
        text: 'Add roles, each with a unit (hour or day) and an exact-decimal rate.',
        detail:
          'Estimators can select a rate card but not edit it; rates are snapshotted onto labor lines when used.',
      },
    ],
    related: ['choose-rate-card', 'add-labor-line'],
  },
  {
    id: 'cloud-prices-refresh',
    title: 'Review & refresh cloud prices (last-pulled)',
    category: 'Administration',
    persona: 'Administrator',
    goal: 'Inspect the catalog and pull fresh provider prices on demand.',
    featureIds: ['FR-21a', 'FR-21b', 'FE-40'],
    route: '/cloud-prices',
    keywords: [
      'cloud prices',
      'catalog',
      'refresh',
      'sync',
      'last pulled',
      'aws',
      'gcp',
      'azure',
      'region',
      'sort',
    ],
    steps: [
      { text: 'Open “Cloud prices” under the Pricing menu.' },
      {
        text: 'Filter by provider/category or search, sort any column, and page through with the rows-per-page control.',
        detail:
          'The catalog covers AWS (incl. us-east-1 and us-west-2), GCP, Azure and SaaS; an estimate’s cloud line snapshots the unit price you pick.',
      },
      {
        text: 'Review the per-provider “last pulled” dates (MM/DD/CCYY) to see how current each provider is.',
      },
      {
        text: 'Trigger a refresh for a provider to pull fresh prices and re-stamp its last-pulled date.',
        detail:
          'Refreshing the catalog never changes saved estimates — each line keeps its snapshotted unit price.',
      },
    ],
    related: ['add-cloud-line'],
  },
  {
    id: 'manage-reference-data',
    title: 'Manage reference / lookup data',
    category: 'Administration',
    persona: 'Administrator',
    goal: 'Add, rename, reorder, or deactivate lookup values without a code change.',
    featureIds: ['FR-29', 'NFR-17', 'FE-53'],
    route: '/reference-data',
    keywords: [
      'reference data',
      'lookup',
      'phases',
      'priorities',
      'document types',
      'categories',
      'configurable',
      'no code',
    ],
    steps: [
      { text: 'Open “Reference data” under the Admin menu (Admin only).' },
      { text: 'Pick a reference type (e.g. SDLC Phase, Cost Category, Document Type, Priority).' },
      {
        text: 'Add a new value, rename a label, change display order, or deactivate one.',
        detail:
          'Changes take effect across the app immediately — no recompile or redeploy. Built-in values can be renamed but not deleted.',
      },
    ],
    related: ['tag-sdlc-phase', 'approval-workflow'],
  },
  {
    id: 'manage-checklist-rules',
    title: 'Manage checklist rule sets & rules',
    category: 'Administration',
    persona: 'Administrator',
    goal: 'Keep a repo of rule sets and author the rules that validate estimates and gate transitions.',
    featureIds: ['FR-25', 'FE-44'],
    route: '/checklist-rules',
    keywords: [
      'checklist',
      'rules',
      'rule set',
      'validation',
      'severity',
      'blocker',
      'gate',
      'configure',
    ],
    steps: [
      { text: 'Open “Checklist Rules” (Admin only) from the top navigation.' },
      {
        text: 'Each row is a rule set with a system-assigned key (e.g. RS-A1B2C3); type a label and description for context.',
        detail:
          'The default set validates every estimate and gates workflow transitions. Use “Create rule set” to add another.',
      },
      {
        text: 'Click “Edit rules →” on a set to author its rules.',
      },
      {
        text: 'Toggle a rule Active on/off, change its Severity (Blocker / Warning / Info), or edit its description.',
        detail:
          'Severity matters: a failing Blocker stops an estimate from advancing through the workflow; Warning/Info are advisory.',
      },
      {
        text: 'Add a custom advisory rule with a key, description, scope, and severity.',
        detail:
          'Custom rules have no built-in check logic, so they always pass — they act as reminders. Built-in rules can be deactivated or re-tuned but not deleted.',
      },
    ],
    related: ['smart-checklist', 'manage-workflow', 'approval-workflow'],
  },
  {
    id: 'manage-workflow',
    title: 'Manage workflows & transitions',
    category: 'Administration',
    persona: 'Administrator',
    goal: 'Keep a repo of approval workflows and author each one’s stages and transitions.',
    featureIds: ['FR-24', 'FE-43'],
    route: '/workflows',
    keywords: [
      'workflow',
      'workflows',
      'repo',
      'stages',
      'transitions',
      'approval',
      'review',
      'role',
      'gate',
      'configure',
    ],
    steps: [
      { text: 'Open “Workflows” (Admin only) from the top navigation.' },
      {
        text: 'Create a workflow — the system assigns a key; you add a label and description. Then open it to edit stages/transitions.',
        detail: 'Each transition also gets a system key and an optional description for context.',
      },
      {
        text: 'Under Stages, add/rename stages, set their order, and mark one as Initial and any as Terminal.',
        detail:
          'Only one stage can be Initial — new estimates start there. A stage in use by an estimate or referenced in transition history can’t be deleted.',
      },
      {
        text: 'Under Transitions, add a transition by choosing From → To, the allowed role, a button label, and whether it requires the smart checklist to pass.',
        detail:
          'These transitions are exactly what appears on each estimate’s Approval workflow panel, gated by role and (optionally) the checklist.',
      },
    ],
    related: ['approval-workflow', 'smart-checklist', 'manage-reference-data'],
  },
  {
    id: 'manage-fx-rates',
    title: 'Manage currencies & FX rates',
    category: 'Administration',
    persona: 'Administrator',
    goal: 'Maintain exchange rates so cross-currency totals roll up to a base currency.',
    featureIds: ['FR-17', 'FE-12'],
    route: '/fx-rates',
    keywords: ['fx', 'currency', 'exchange rate', 'multi-currency', 'base currency', 'convert'],
    steps: [
      { text: 'Open “FX rates” (Admin only) from the top navigation.' },
      {
        text: 'Review the rates to the base currency (USD = 1) and update any that have drifted.',
      },
      {
        text: 'The dashboard uses these rates to convert per-currency totals into a single comparable base-currency figure.',
      },
    ],
    related: ['dashboard-overview'],
  },
];

const BY_ID = new Map(HELP_USE_CASES.map((u) => [u.id, u]));

/** Look up a use case by its slug. */
export function useCaseById(id: string): UseCase | undefined {
  return BY_ID.get(id);
}

/** Use cases grouped by category, preserving array order within each group. */
export function useCasesByCategory(category: HelpCategory): UseCase[] {
  return HELP_USE_CASES.filter((u) => u.category === category);
}

/**
 * Find the best use case that explains how to resolve a given smart-checklist
 * rule key — the deep-link target for a blocked checklist item (FR-25).
 */
export function useCaseForChecklistKey(key: string): UseCase | undefined {
  return HELP_USE_CASES.find((u) => u.checklistKeys?.includes(key));
}

/** Simple case-insensitive search across title, goal, feature IDs, and keywords. */
export function searchUseCases(query: string): UseCase[] {
  const q = query.trim().toLowerCase();
  if (!q) return HELP_USE_CASES;
  return HELP_USE_CASES.filter((u) => {
    const hay = [
      u.title,
      u.goal,
      u.persona,
      u.category,
      ...(u.featureIds ?? []),
      ...(u.keywords ?? []),
      ...u.steps.map((s) => s.text),
    ]
      .join(' ')
      .toLowerCase();
    return hay.includes(q);
  });
}
