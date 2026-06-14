/**
 * Online User Guide (NFR-12, FR-12). A readable, navigable handbook rendered in
 * the app at `/guide`. It complements the task-oriented Help use cases (`/help`)
 * — prose + pointers, deep-linkable by section anchor (`/guide#<id>`).
 */
export interface GuideLink {
  label: string;
  /** A route or a `/help#uc-…` anchor. */
  to: string;
}

export interface GuideSection {
  id: string;
  title: string;
  body: string[];
  bullets?: string[];
  links?: GuideLink[];
}

export const USER_GUIDE: GuideSection[] = [
  {
    id: 'welcome',
    title: 'Welcome',
    body: [
      'cost-reaper turns scattered spreadsheets into consistent, auditable project cost estimates. You build an estimate from a governed rate card plus AWS/GCP/Azure cloud pricing, apply markup and contingency, see monthly and yearly costs, route it through an approval workflow, and export a professional summary.',
      'This guide is a readable overview. For numbered, click-by-click instructions, use the Help guide — every topic here links to the matching step-by-step use case. For estimating technique and best practices, see the Estimation Guide.',
    ],
    links: [
      { label: 'Open the Help guide', to: '/help' },
      { label: 'Read the Estimation Guide', to: '/estimation-guide' },
    ],
  },
  {
    id: 'signing-in',
    title: 'Signing in & identity',
    body: [
      'How you sign in depends on how your administrator configured identity. With the built-in (LOCAL) identity you sign in with an email and password. If single sign-on is enabled, you’ll also see a “Sign in with …” button that takes you to your company identity provider (OIDC, SAML, or WS-Federation).',
      'Your session is kept signed in and refreshed automatically; use Log out (top right) to end it.',
    ],
    links: [{ label: 'Step-by-step: sign in', to: '/help#uc-sign-in' }],
  },
  {
    id: 'roles',
    title: 'Roles & what you can do',
    body: [
      'Access is deny-by-default and enforced on the server. There are three roles: Admin (governs everything), Estimator (builds and runs estimates), and Viewer (read-only). The Roles page shows the full capability matrix and highlights your role.',
    ],
    links: [
      { label: 'Open Roles & permissions', to: '/roles' },
      { label: 'Step-by-step: understand roles', to: '/help#uc-roles-permissions' },
    ],
  },
  {
    id: 'building',
    title: 'Building an estimate',
    body: [
      'Create an estimate, attach a rate card, then add line items. Labor lines price effort by role × quantity × units at a snapshotted rate. Non-labor lines capture fixed or recurring costs. Cloud lines price resources from the categorized AWS/GCP/Azure catalog (see “Cloud resources & categories” below), with the unit price snapshotted onto the line so refreshing the catalog never changes a saved estimate.',
      'Record assumptions and notes as you go so the numbers can be defended later.',
    ],
    links: [
      { label: 'Create an estimate', to: '/help#uc-create-estimate' },
      { label: 'Choose a rate card', to: '/help#uc-choose-rate-card' },
      { label: 'Add a labor line', to: '/help#uc-add-labor-line' },
      { label: 'Add a cloud line', to: '/help#uc-add-cloud-line' },
    ],
  },
  {
    id: 'cloud-categories',
    title: 'Cloud resources & categories',
    body: [
      'The cloud catalog covers everything an enterprise architect needs to model a full cloud build across AWS, GCP, and Azure — not just compute. Every price is organized into a category, so you can browse, filter, and group resources as you assemble a cost model. On the Cloud Prices screen, filter by Category; in the estimate’s cloud-line picker, options are grouped by category.',
    ],
    bullets: [
      'Compute — VMs and instance families (general-purpose, compute/memory/storage-optimized, and GPU/accelerated).',
      'Storage — object tiers (hot/cool/archive), block & file storage, and managed disks.',
      'Networking — egress/bandwidth, load balancers, NAT, CDN, DNS, and VPN / interconnect.',
      'Database — managed SQL, NoSQL (DynamoDB/Firestore/Cosmos), and in-memory caches.',
      'Containers & Serverless — functions, container runtimes (Fargate/Cloud Run/ACI), and Kubernetes (EKS/GKE/AKS).',
      'Analytics & Big Data — query/scan engines, streaming, and data pipelines.',
      'AI & Machine Learning — training/inference compute and foundation-model APIs.',
      'Security & Tools — WAF, key management, secrets, and cloud security posture.',
      'Management & Monitoring — metrics, logs, and observability.',
      'Managed Services — cloud-vendor managed offerings (managed streaming/Kafka, backup, API management, support).',
      'SaaS — third-party subscriptions (observability, identity & security, productivity, dev tools, data platforms), billed per user or per month.',
    ],
    links: [
      { label: 'Browse the Cloud Prices catalog', to: '/cloud-prices' },
      { label: 'Add a cloud line', to: '/help#uc-add-cloud-line' },
    ],
  },
  {
    id: 'pricing',
    title: 'Pricing: markup, contingency & totals',
    body: [
      'Apply a global upcharge (with optional per-line overrides), then a contingency on the upcharged subtotal — a single, well-tested order. Add margin and tax to turn internal cost into a client-facing price.',
      'Every line has a billing period, so the summary shows distinct one-time, monthly, and yearly (annualized ×12) totals.',
    ],
    links: [
      { label: 'Apply an upcharge', to: '/help#uc-apply-upcharge' },
      { label: 'Margin, tax & client price', to: '/help#uc-margin-tax-client-price' },
      { label: 'Read the totals', to: '/help#uc-read-totals' },
    ],
  },
  {
    id: 'phases-capacity',
    title: 'SDLC phases & resource capacity',
    body: [
      'Tag any line with an SDLC phase to see a cost breakdown per phase on the estimate. Assign people to labor lines with an allocation percentage and date window; the system prevents anyone exceeding 100% on a given day.',
    ],
    links: [
      { label: 'Tag SDLC phases', to: '/help#uc-tag-sdlc-phase' },
      { label: 'Resource capacity', to: '/help#uc-assign-resource-capacity' },
    ],
  },
  {
    id: 'governance',
    title: 'Review & approval',
    body: [
      'The smart checklist continuously validates that an estimate is complete and consistent; clicking an item jumps to exactly what needs fixing. The approval workflow moves an estimate between stages (e.g. Draft → In Review → Approved), gated by role and — where required — by a passing checklist.',
    ],
    links: [
      { label: 'Use the smart checklist', to: '/help#uc-smart-checklist' },
      { label: 'Advance the workflow', to: '/help#uc-approval-workflow' },
    ],
  },
  {
    id: 'scenarios',
    title: 'Scenarios, baselines & collaboration',
    body: [
      'Create scenarios to compare options side by side, capture baselines to freeze a snapshot of the totals and track drift, and discuss inline with comments.',
    ],
    links: [
      { label: 'Compare scenarios', to: '/help#uc-scenarios-compare' },
      { label: 'Capture a baseline', to: '/help#uc-baselines-versions' },
    ],
  },
  {
    id: 'outputs',
    title: 'Exports & printing',
    body: [
      'Download a CSV or a native Excel (.xlsx) workbook, or open the printable summary and save it as a PDF from your browser. All outputs include the line items, totals, and per-phase breakdown.',
    ],
    links: [
      { label: 'Export to CSV', to: '/help#uc-export-csv' },
      { label: 'Export to Excel', to: '/help#uc-export-excel' },
      { label: 'Print / PDF', to: '/help#uc-printable-summary' },
    ],
  },
  {
    id: 'dashboard',
    title: 'The dashboard',
    body: [
      'The dashboard gives a portfolio view: totals (converted to a base currency), counts by status, a by-workflow-stage breakdown you can click to drill into, and recent activity.',
    ],
    links: [{ label: 'Read the dashboard', to: '/help#uc-dashboard-overview' }],
  },
  {
    id: 'administration',
    title: 'Administration',
    body: [
      'Admins govern the shared configuration. Most of this is data-driven, so changes take effect without a redeploy.',
    ],
    bullets: [
      'Users & roles — invite users and assign Admin / Estimator / Viewer.',
      'Rate cards — define governed roles and rates.',
      'Reference data — phases, statuses, categories, units, and more.',
      'FX rates — exchange rates with a live refresh.',
      'Cloud prices — review the catalog and pull fresh provider prices.',
      'Workflow & checklist — author the stages, transitions, and validation rules.',
    ],
    links: [
      { label: 'Manage users', to: '/help#uc-manage-users' },
      { label: 'Configure the workflow', to: '/help#uc-manage-workflow' },
      { label: 'Configure checklist rules', to: '/help#uc-manage-checklist-rules' },
    ],
  },
  {
    id: 'help',
    title: 'Getting more help',
    body: [
      'The Help guide is a searchable catalog of step-by-step use cases for every task, each deep-linkable. When the smart checklist blocks an estimate, its “How?” link opens the exact use case that explains the fix.',
    ],
    links: [{ label: 'Open the Help guide', to: '/help' }],
  },
];
