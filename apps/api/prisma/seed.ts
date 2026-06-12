/**
 * Seed baseline data (setup step 6):
 *   - one Admin from env (FR-26 / Section 0.1 — never hardcoded)
 *   - a sample rate card (FR-3)
 *   - a cloud price catalog for AWS / GCP / Azure (FR-21, source CATALOG_SEED)
 *   - the default approval workflow (FR-24)
 *   - the built-in smart-checklist rules (FR-25)
 *
 * Idempotent: safe to re-run (upserts / find-or-create).
 */
import {
  ChecklistScope,
  ChecklistSeverity,
  CloudPriceSource,
  CloudPriceUnit,
  CloudProvider,
  PrismaClient,
  RateUnit,
  Role,
} from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'change_me';
  const passwordHash = await argon2.hash(password);
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      role: Role.ADMIN,
      displayName: 'Administrator',
      isActive: true,
    },
  });
}

async function seedRateCard(adminId: string) {
  const existing = await prisma.rateCard.findFirst({ where: { name: 'Standard Rate Card 2026' } });
  if (existing) return existing;
  return prisma.rateCard.create({
    data: {
      name: 'Standard Rate Card 2026',
      currency: 'USD',
      createdById: adminId,
      roles: {
        create: [
          { roleName: 'Solution Architect', unit: RateUnit.HOUR, rate: '210.0000' },
          { roleName: 'Senior Engineer', unit: RateUnit.HOUR, rate: '165.0000' },
          { roleName: 'Engineer', unit: RateUnit.HOUR, rate: '130.0000' },
          { roleName: 'QA Engineer', unit: RateUnit.HOUR, rate: '110.0000' },
          { roleName: 'Project Manager', unit: RateUnit.DAY, rate: '1200.0000' },
        ],
      },
    },
  });
}

const CLOUD_PRICES = [
  // AWS — us-east-1
  {
    provider: CloudProvider.AWS,
    region: 'us-east-1',
    service: 'EC2',
    skuOrInstance: 't3.medium',
    unit: CloudPriceUnit.HOUR,
    unitPrice: '0.041600',
  },
  {
    provider: CloudProvider.AWS,
    region: 'us-east-1',
    service: 'EC2',
    skuOrInstance: 'm5.large',
    unit: CloudPriceUnit.HOUR,
    unitPrice: '0.096000',
  },
  {
    provider: CloudProvider.AWS,
    region: 'us-east-1',
    service: 'EC2',
    skuOrInstance: 'c5.xlarge',
    unit: CloudPriceUnit.HOUR,
    unitPrice: '0.170000',
  },
  {
    provider: CloudProvider.AWS,
    region: 'us-east-1',
    service: 'S3',
    skuOrInstance: 'Standard Storage',
    unit: CloudPriceUnit.GB_MONTH,
    unitPrice: '0.023000',
  },
  // GCP — us-central1
  {
    provider: CloudProvider.GCP,
    region: 'us-central1',
    service: 'Compute Engine',
    skuOrInstance: 'e2-standard-2',
    unit: CloudPriceUnit.HOUR,
    unitPrice: '0.067006',
  },
  {
    provider: CloudProvider.GCP,
    region: 'us-central1',
    service: 'Compute Engine',
    skuOrInstance: 'n2-standard-4',
    unit: CloudPriceUnit.HOUR,
    unitPrice: '0.194240',
  },
  {
    provider: CloudProvider.GCP,
    region: 'us-central1',
    service: 'Cloud Storage',
    skuOrInstance: 'Standard Storage',
    unit: CloudPriceUnit.GB_MONTH,
    unitPrice: '0.020000',
  },
  // Azure — eastus
  {
    provider: CloudProvider.AZURE,
    region: 'eastus',
    service: 'Virtual Machines',
    skuOrInstance: 'B2ms',
    unit: CloudPriceUnit.HOUR,
    unitPrice: '0.083200',
  },
  {
    provider: CloudProvider.AZURE,
    region: 'eastus',
    service: 'Virtual Machines',
    skuOrInstance: 'D2s_v5',
    unit: CloudPriceUnit.HOUR,
    unitPrice: '0.096000',
  },
  {
    provider: CloudProvider.AZURE,
    region: 'eastus',
    service: 'Blob Storage',
    skuOrInstance: 'Hot LRS',
    unit: CloudPriceUnit.GB_MONTH,
    unitPrice: '0.018400',
  },
];

async function seedCloudPrices() {
  for (const p of CLOUD_PRICES) {
    await prisma.cloudPrice.upsert({
      where: {
        provider_region_service_skuOrInstance_unit: {
          provider: p.provider,
          region: p.region,
          service: p.service,
          skuOrInstance: p.skuOrInstance,
          unit: p.unit,
        },
      },
      update: { unitPrice: p.unitPrice },
      create: {
        provider: p.provider,
        region: p.region,
        service: p.service,
        skuOrInstance: p.skuOrInstance,
        unit: p.unit,
        unitPrice: p.unitPrice,
        currency: 'USD',
        source: CloudPriceSource.CATALOG_SEED,
      },
    });
  }
}

async function seedDefaultWorkflow(adminId: string) {
  const existing = await prisma.workflowDefinition.findFirst({ where: { isDefault: true } });
  if (existing) return existing;

  const def = await prisma.workflowDefinition.create({
    data: {
      name: 'Default Approval Workflow',
      isDefault: true,
      isActive: true,
      createdById: adminId,
    },
  });

  const stagesData = [
    { key: 'DRAFT', label: 'Draft', sortOrder: 1, isInitial: true, isTerminal: false },
    { key: 'IN_REVIEW', label: 'In Review', sortOrder: 2, isInitial: false, isTerminal: false },
    { key: 'APPROVED', label: 'Approved', sortOrder: 3, isInitial: false, isTerminal: false },
    { key: 'FINAL', label: 'Final', sortOrder: 4, isInitial: false, isTerminal: true },
    { key: 'ARCHIVED', label: 'Archived', sortOrder: 5, isInitial: false, isTerminal: true },
  ];
  const stageIds: Record<string, string> = {};
  for (const s of stagesData) {
    const created = await prisma.workflowStage.create({
      data: { ...s, workflowDefinitionId: def.id },
    });
    stageIds[s.key] = created.id;
  }

  const transitions = [
    {
      from: 'DRAFT',
      to: 'IN_REVIEW',
      allowedRole: Role.ESTIMATOR,
      label: 'Submit for review',
      requiresChecklistPass: true,
    },
    {
      from: 'IN_REVIEW',
      to: 'DRAFT',
      allowedRole: Role.ESTIMATOR,
      label: 'Return to draft',
      requiresChecklistPass: false,
    },
    {
      from: 'IN_REVIEW',
      to: 'APPROVED',
      allowedRole: Role.ADMIN,
      label: 'Approve',
      requiresChecklistPass: true,
    },
    {
      from: 'APPROVED',
      to: 'FINAL',
      allowedRole: Role.ADMIN,
      label: 'Finalize',
      requiresChecklistPass: true,
    },
    {
      from: 'FINAL',
      to: 'ARCHIVED',
      allowedRole: Role.ADMIN,
      label: 'Archive',
      requiresChecklistPass: false,
    },
  ];
  for (const t of transitions) {
    await prisma.workflowTransition.create({
      data: {
        workflowDefinitionId: def.id,
        fromStageId: stageIds[t.from],
        toStageId: stageIds[t.to],
        allowedRole: t.allowedRole,
        label: t.label,
        requiresChecklistPass: t.requiresChecklistPass,
      },
    });
  }
  return def;
}

const CHECKLIST_RULES = [
  {
    key: 'rate_card_selected',
    description: 'A rate card is selected for the estimate',
    severity: ChecklistSeverity.BLOCKER,
    scope: ChecklistScope.ESTIMATE,
  },
  {
    key: 'labor_role_assigned',
    description: 'Every labor line has a role/resource assigned with quantity and units',
    severity: ChecklistSeverity.BLOCKER,
    scope: ChecklistScope.LABOR,
  },
  {
    key: 'cloud_line_complete',
    description:
      'Every cloud line has provider, region, instance, usage and a snapshotted unit price',
    severity: ChecklistSeverity.BLOCKER,
    scope: ChecklistScope.CLOUD,
  },
  {
    key: 'nonlabor_amount_period',
    description: 'Every non-labor line has an amount and a billing period',
    severity: ChecklistSeverity.BLOCKER,
    scope: ChecklistScope.NONLABOR,
  },
  {
    key: 'billing_period_set',
    description: 'No recurring line is missing a billing period',
    severity: ChecklistSeverity.BLOCKER,
    scope: ChecklistScope.ESTIMATE,
  },
  {
    key: 'resource_capacity',
    description: 'No resource is allocated over 100% on any date',
    severity: ChecklistSeverity.BLOCKER,
    scope: ChecklistScope.RESOURCE,
  },
  {
    key: 'upcharge_set',
    description: 'An upcharge percentage is set (or explicitly zero)',
    severity: ChecklistSeverity.WARNING,
    scope: ChecklistScope.ESTIMATE,
  },
  {
    key: 'contingency_set',
    description: 'A contingency percentage is set (or explicitly zero)',
    severity: ChecklistSeverity.WARNING,
    scope: ChecklistScope.ESTIMATE,
  },
  {
    key: 'totals_reconcile',
    description: 'One-time, monthly and yearly totals reconcile',
    severity: ChecklistSeverity.INFO,
    scope: ChecklistScope.ESTIMATE,
  },
];

async function seedChecklistRules() {
  for (const r of CHECKLIST_RULES) {
    await prisma.checklistRule.upsert({
      where: { key: r.key },
      update: { description: r.description, severity: r.severity, scope: r.scope },
      create: {
        key: r.key,
        description: r.description,
        severity: r.severity,
        scope: r.scope,
        isBuiltin: true,
      },
    });
  }
}

// ─── Reference data (FR-29, NFR-17) ──────────────────────────────────────────
// Baseline DB-driven reference/lookup values. Built-ins (is_builtin) may be
// deactivated/renamed/re-sequenced by admins but not deleted. Idempotent.

interface RefVal {
  code: string;
  name: string;
  children?: { code: string; name: string }[];
}
interface RefType {
  code: string;
  name: string;
  desc?: string;
  values: RefVal[];
}

const REFERENCE_DATA: RefType[] = [
  {
    code: 'SDLC_PHASE',
    name: 'SDLC Phase',
    desc: 'Software delivery lifecycle phases and their tasks',
    values: [
      {
        code: 'PLANNING',
        name: 'Planning',
        children: [
          { code: 'REQUIREMENTS', name: 'Requirements' },
          { code: 'ESTIMATION', name: 'Estimation' },
        ],
      },
      {
        code: 'DESIGN',
        name: 'Design',
        children: [
          { code: 'ARCHITECTURE', name: 'Architecture' },
          { code: 'UX_DESIGN', name: 'UX Design' },
        ],
      },
      {
        code: 'DEVELOPMENT',
        name: 'Development',
        children: [
          { code: 'CODING', name: 'Coding' },
          { code: 'CODE_REVIEW', name: 'Code Review' },
        ],
      },
      {
        code: 'TESTING',
        name: 'Testing',
        children: [
          { code: 'UNIT_TESTING', name: 'Unit Testing' },
          { code: 'INTEGRATION_TESTING', name: 'Integration Testing' },
          { code: 'UAT', name: 'User Acceptance Testing' },
        ],
      },
      {
        code: 'DEPLOYMENT',
        name: 'Deployment',
        children: [
          { code: 'RELEASE', name: 'Release' },
          { code: 'CUTOVER', name: 'Cutover' },
        ],
      },
      {
        code: 'MAINTENANCE',
        name: 'Maintenance',
        children: [
          { code: 'SUPPORT', name: 'Support' },
          { code: 'ENHANCEMENTS', name: 'Enhancements' },
        ],
      },
    ],
  },
  {
    code: 'ESTIMATE_STATUS',
    name: 'Estimate Status',
    values: [
      { code: 'DRAFT', name: 'Draft' },
      { code: 'FINAL', name: 'Final' },
    ],
  },
  {
    code: 'BILLING_PERIOD',
    name: 'Billing Period',
    values: [
      { code: 'ONE_TIME', name: 'One-time' },
      { code: 'MONTHLY', name: 'Monthly' },
      { code: 'YEARLY', name: 'Yearly' },
    ],
  },
  {
    code: 'RATE_UNIT',
    name: 'Rate Unit',
    values: [
      { code: 'HOUR', name: 'Hour' },
      { code: 'DAY', name: 'Day' },
    ],
  },
  {
    code: 'CLOUD_PROVIDER',
    name: 'Cloud Provider',
    values: [
      { code: 'AWS', name: 'Amazon Web Services' },
      { code: 'GCP', name: 'Google Cloud' },
      { code: 'AZURE', name: 'Microsoft Azure' },
    ],
  },
  {
    code: 'CLOUD_PRICE_UNIT',
    name: 'Cloud Price Unit',
    values: [
      { code: 'HOUR', name: 'Hour' },
      { code: 'MONTH', name: 'Month' },
      { code: 'GB_MONTH', name: 'GB-month' },
      { code: 'REQUEST', name: 'Request' },
    ],
  },
  {
    code: 'NON_LABOR_TYPE',
    name: 'Non-Labor Type',
    values: [
      { code: 'FIXED', name: 'Fixed' },
      { code: 'RECURRING', name: 'Recurring' },
    ],
  },
  {
    code: 'ROLE',
    name: 'User Role',
    values: [
      { code: 'ADMIN', name: 'Administrator' },
      { code: 'ESTIMATOR', name: 'Estimator' },
      { code: 'VIEWER', name: 'Viewer' },
    ],
  },
  {
    code: 'COST_CATEGORY',
    name: 'Cost Category',
    values: [
      { code: 'LABOR', name: 'Labor' },
      { code: 'LICENSES', name: 'Licenses' },
      { code: 'INFRASTRUCTURE', name: 'Infrastructure' },
      { code: 'THIRD_PARTY', name: 'Third-party Services' },
      { code: 'TRAVEL', name: 'Travel' },
      { code: 'OTHER', name: 'Other' },
    ],
  },
  {
    code: 'CHECKLIST_SEVERITY',
    name: 'Checklist Severity',
    values: [
      { code: 'BLOCKER', name: 'Blocker' },
      { code: 'WARNING', name: 'Warning' },
      { code: 'INFO', name: 'Info' },
    ],
  },
  {
    code: 'CHECKLIST_SCOPE',
    name: 'Checklist Scope',
    values: [
      { code: 'ESTIMATE', name: 'Estimate' },
      { code: 'LABOR', name: 'Labor' },
      { code: 'NONLABOR', name: 'Non-labor' },
      { code: 'CLOUD', name: 'Cloud' },
      { code: 'RESOURCE', name: 'Resource' },
    ],
  },
  {
    code: 'WORKFLOW_STAGE',
    name: 'Workflow Stage',
    values: [
      { code: 'DRAFT', name: 'Draft' },
      { code: 'IN_REVIEW', name: 'In Review' },
      { code: 'APPROVED', name: 'Approved' },
      { code: 'FINAL', name: 'Final' },
      { code: 'ARCHIVED', name: 'Archived' },
    ],
  },
  {
    code: 'PRIORITY',
    name: 'Priority',
    values: [
      { code: 'LOW', name: 'Low' },
      { code: 'MEDIUM', name: 'Medium' },
      { code: 'HIGH', name: 'High' },
      { code: 'CRITICAL', name: 'Critical' },
    ],
  },
  {
    code: 'RESOURCE_TYPE',
    name: 'Resource Type',
    values: [
      { code: 'EMPLOYEE', name: 'Employee' },
      { code: 'CONTRACTOR', name: 'Contractor' },
      { code: 'VENDOR', name: 'Vendor' },
    ],
  },
  {
    code: 'TESTING_PHASE',
    name: 'Testing Phase',
    desc: 'Testing phases and their testing types',
    values: [
      { code: 'UNIT', name: 'Unit', children: [{ code: 'COMPONENT', name: 'Component' }] },
      {
        code: 'INTEGRATION',
        name: 'Integration',
        children: [
          { code: 'API_TESTING', name: 'API Testing' },
          { code: 'CONTRACT_TESTING', name: 'Contract Testing' },
        ],
      },
      {
        code: 'SYSTEM',
        name: 'System',
        children: [
          { code: 'E2E', name: 'End-to-end' },
          { code: 'REGRESSION', name: 'Regression' },
        ],
      },
      {
        code: 'ACCEPTANCE',
        name: 'Acceptance',
        children: [
          { code: 'UAT', name: 'User Acceptance' },
          { code: 'PERFORMANCE', name: 'Performance' },
          { code: 'SECURITY', name: 'Security' },
        ],
      },
    ],
  },
  {
    code: 'DOCUMENT_TYPE',
    name: 'Document Type',
    values: [
      { code: 'SOW', name: 'Statement of Work' },
      { code: 'PROPOSAL', name: 'Proposal' },
      { code: 'ESTIMATE_SUMMARY', name: 'Estimate Summary' },
      { code: 'ARCHITECTURE', name: 'Architecture Document' },
    ],
  },
];

async function seedReferenceData(adminId: string): Promise<void> {
  for (let ti = 0; ti < REFERENCE_DATA.length; ti++) {
    const t = REFERENCE_DATA[ti];
    const type = await prisma.referenceType.upsert({
      where: { code: t.code },
      update: { displayName: t.name, description: t.desc ?? null, displayOrder: ti + 1 },
      create: {
        code: t.code,
        displayName: t.name,
        description: t.desc ?? null,
        displayOrder: ti + 1,
        createdById: adminId,
        updatedById: adminId,
      },
    });
    for (let vi = 0; vi < t.values.length; vi++) {
      const v = t.values[vi];
      const parent = await prisma.referenceValue.upsert({
        where: { referenceTypeId_code: { referenceTypeId: type.id, code: v.code } },
        update: { displayName: v.name, displayOrder: vi + 1, parentId: null, isBuiltin: true },
        create: {
          referenceTypeId: type.id,
          code: v.code,
          displayName: v.name,
          displayOrder: vi + 1,
          isBuiltin: true,
          createdById: adminId,
          updatedById: adminId,
        },
      });
      const children = v.children ?? [];
      for (let ci = 0; ci < children.length; ci++) {
        const c = children[ci];
        await prisma.referenceValue.upsert({
          where: { referenceTypeId_code: { referenceTypeId: type.id, code: c.code } },
          update: {
            displayName: c.name,
            displayOrder: ci + 1,
            parentId: parent.id,
            isBuiltin: true,
          },
          create: {
            referenceTypeId: type.id,
            parentId: parent.id,
            code: c.code,
            displayName: c.name,
            displayOrder: ci + 1,
            isBuiltin: true,
            createdById: adminId,
            updatedById: adminId,
          },
        });
      }
    }
  }
}

async function main(): Promise<void> {
  const admin = await seedAdmin();
  await seedRateCard(admin.id);
  await seedCloudPrices();
  await seedDefaultWorkflow(admin.id);
  await seedChecklistRules();
  await seedReferenceData(admin.id);
  console.log(`Seed complete. Admin: ${admin.email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
