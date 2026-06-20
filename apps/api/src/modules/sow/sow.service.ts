import { randomBytes } from 'node:crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type StatementOfWork } from '@prisma/client';
import type {
  AuthUser,
  CreateSowRequest,
  SowEligibleEstimateDto,
  SowSummaryDto,
  StatementOfWorkDto,
  UpdateSowRequest,
} from '@cost-reaper/types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { EstimatesService } from '../estimates/estimates.service';

// A SOW can only be built from an estimate that has reached an approval stage in
// its workflow (those transitions already require the smart checklist to pass).
const SOW_ELIGIBLE_STAGE_KEYS = ['APPROVED', 'FINAL'];

// Editable default boilerplate for a new SOW — the user tailors these before issuing.
const DEFAULT_SCOPE =
  'The Provider shall perform the professional services described in this Statement of Work ' +
  '(the “Services”) in accordance with the terms of the governing Master Services Agreement ' +
  'between the parties. Any work not expressly described herein is out of scope and requires a ' +
  'separate written change order.';
const DEFAULT_DELIVERABLES =
  'Deliverables are organized by SDLC phase. Each phase is a billable milestone: upon the ' +
  'Client’s written acceptance of a phase’s deliverables, the Provider invoices that phase’s ' +
  'one-time milestone fee per the Milestone Schedule below (derived from the approved estimate’s ' +
  'cost per phase). Recurring costs are billed on their stated cadence.';
const DEFAULT_TIMELINE =
  'The Services are expected to commence on the Effective Date and proceed per the milestones ' +
  'agreed by the parties. Dates are estimates and may be adjusted by mutual written agreement.';
const DEFAULT_PAYMENT_TERMS =
  'Fees are set out in the Pricing section below. Unless otherwise stated, invoices are issued ' +
  'monthly and are due net thirty (30) days from the invoice date. Amounts are exclusive of ' +
  'applicable taxes, which the Client shall pay where required by law.';
const DEFAULT_TERMS =
  '1. Confidentiality. Each party shall protect the other’s confidential information and use it ' +
  'solely to perform under this SOW.\n' +
  '2. Intellectual Property. Deliverables are assigned to the Client upon full payment, excluding ' +
  'the Provider’s pre-existing materials, which are licensed for the Client’s internal use.\n' +
  '3. Warranty. The Provider warrants the Services will be performed in a professional and ' +
  'workmanlike manner.\n' +
  '4. Limitation of Liability. Neither party is liable for indirect or consequential damages; ' +
  'each party’s aggregate liability is limited to the fees paid under this SOW.\n' +
  '5. Governing Law. This SOW is governed by the laws of the jurisdiction stated in the Master ' +
  'Services Agreement.\n' +
  '6. Entire Agreement. This SOW, together with the Master Services Agreement, is the entire ' +
  'agreement between the parties regarding its subject matter.';

// Additional template sections (SOW_TEMPLATE.md) — seeded as editable boilerplate.
const DEFAULT_EXECUTIVE_SUMMARY =
  'The Provider is pleased to submit this Statement of Work to design, build, implement, operate, ' +
  'and maintain the solution described herein. Our approach is structured, secure, scalable, and ' +
  'maintainable, and is aligned to the Client’s business objectives, operational needs, and ' +
  'compliance requirements.';
const DEFAULT_CUSTOMER_UNDERSTANDING =
  'The Provider understands the Client requires a qualified technology partner to deliver and ' +
  'support the solution, integrate with existing systems where applicable, and provide ' +
  'documentation, training, and knowledge transfer — improving efficiency, reliability, ' +
  'transparency, and auditability.';
const DEFAULT_OUT_OF_SCOPE =
  'The following are excluded unless added through a formal change order: changes to ' +
  'customer-owned legacy systems; third-party licensing not identified herein; data cleanup ' +
  'beyond the agreed scope; hardware procurement unless specified; and any integrations, ' +
  'reporting, or systems not identified in this SOW.';
const DEFAULT_SOLUTION_OVERVIEW =
  'The proposed solution uses a modular, configurable, secure, and scalable architecture that ' +
  'supports maintainability, observability, auditability, and future enhancement, guided by ' +
  'security-by-design, privacy-by-design, and accessibility-by-design principles.';
const DEFAULT_GOVERNANCE =
  'Delivery is governed through an executive steering committee (strategic decisions and ' +
  'escalation), weekly project leadership meetings (schedule, budget, scope, risks), technical ' +
  'and security reviews as needed, a change control board, and an operational readiness review ' +
  'prior to go-live.';
const DEFAULT_ROLES =
  'Provider responsibilities: qualified personnel, delivery management, design and build, agreed ' +
  'testing, deployment support, status reporting, risk/issue management, knowledge transfer, and ' +
  'maintenance as agreed.\n' +
  'Client responsibilities: timely decisions and approvals; access to stakeholders, systems, and ' +
  'environments; business rules and subject-matter expertise; deliverable review; UAT support; ' +
  'and test data where required.';
const DEFAULT_NFRS =
  'Security: RBAC, MFA where required, encryption in transit and at rest, audit logging, and ' +
  'least-privilege access.\n' +
  'Performance: defined response-time and throughput targets with monitoring.\n' +
  'Availability: defined targets, backup and recovery, and disaster-recovery planning.\n' +
  'Accessibility: WCAG 2.2 and Section 508 alignment where applicable.\n' +
  'Maintainability and auditability: modular code, automated testing, and a reportable audit trail.';
const DEFAULT_TESTING =
  'Testing includes unit, integration, system, regression, performance, accessibility, and ' +
  'security testing, plus support for user acceptance testing. Exit criteria: critical/high ' +
  'defects resolved or accepted, requirements traceability complete, and UAT approval received.';
const DEFAULT_MAINTENANCE =
  'After deployment, the Provider may provide incident resolution, problem investigation, minor ' +
  'enhancements, security patching, monitoring and alert response, and operational reporting ' +
  'across Tier 1–3 support. Service levels (response and resolution targets by priority) are as ' +
  'agreed in the governing agreement.';
const DEFAULT_RISKS =
  'Key risks and mitigations: unclear requirements (discovery workshops and sign-off); approval ' +
  'delays (approval SLAs and escalation); third-party dependencies (early identification and ' +
  'weekly tracking); data quality (assessment and cleansing plan); and scope growth (formal ' +
  'change control).';
const DEFAULT_ACCEPTANCE =
  'A deliverable is accepted when it is submitted in the agreed format, satisfies approved ' +
  'requirements, review comments are addressed or dispositioned, required approvals are received, ' +
  'and acceptance is documented in writing. Absent feedback within the agreed review period, the ' +
  'deliverable may be deemed accepted per the governing agreement.';
const DEFAULT_CHANGE_CONTROL =
  'Any change to scope, schedule, cost, deliverables, assumptions, or acceptance criteria is ' +
  'managed through a formal change-control process: request submission, impact analysis, cost and ' +
  'schedule estimate, risk assessment, Client review, approval or rejection, baseline update, and ' +
  'implementation tracking. No out-of-scope work begins until the change is approved by both parties.';

/**
 * SOW template flavors (BR-7). The ENTERPRISE base uses the defaults above; each
 * other flavor overrides only the sections whose tone/content meaningfully differs
 * for that style. See docs/templates/sow-flavors/ for the full reference styles.
 */
type SowBoilerplate = {
  executiveSummary: string;
  customerUnderstanding: string;
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
  risksMitigation: string;
  acceptanceCriteria: string;
  changeControl: string;
  termsAndConditions: string;
};

function flavorBoilerplate(flavor: string): SowBoilerplate {
  const base: SowBoilerplate = {
    executiveSummary: DEFAULT_EXECUTIVE_SUMMARY,
    customerUnderstanding: DEFAULT_CUSTOMER_UNDERSTANDING,
    scope: DEFAULT_SCOPE,
    outOfScope: DEFAULT_OUT_OF_SCOPE,
    solutionOverview: DEFAULT_SOLUTION_OVERVIEW,
    deliverables: DEFAULT_DELIVERABLES,
    timeline: DEFAULT_TIMELINE,
    paymentTerms: DEFAULT_PAYMENT_TERMS,
    governanceModel: DEFAULT_GOVERNANCE,
    rolesResponsibilities: DEFAULT_ROLES,
    nonFunctionalRequirements: DEFAULT_NFRS,
    testingStrategy: DEFAULT_TESTING,
    maintenanceSupport: DEFAULT_MAINTENANCE,
    risksMitigation: DEFAULT_RISKS,
    acceptanceCriteria: DEFAULT_ACCEPTANCE,
    changeControl: DEFAULT_CHANGE_CONTROL,
    termsAndConditions: DEFAULT_TERMS,
  };
  const overrides: Record<string, Partial<SowBoilerplate>> = {
    ENTERPRISE: {},
    CONCISE: {
      paymentTerms: '50% on signature and 50% on acceptance, invoiced electronically, net 15 days.',
      acceptanceCriteria:
        'A deliverable is accepted on written approval, or 5 business days after delivery if no ' +
        'issues are raised.',
      changeControl:
        'Out-of-scope work is handled by a brief written change note agreed by both parties before ' +
        'it begins.',
      termsAndConditions:
        'Governed by the parties’ existing Master Services Agreement; this SOW states only the ' +
        'work, schedule, and fees.',
    },
    PROPOSAL: {
      solutionOverview:
        'The Provider will deliver and configure the solution as a hosted subscription, completed in ' +
        'collaboration with the Client team. Final scope and related fees are confirmed at kickoff ' +
        'and approved by both parties before the Order Form is executed.',
      deliverables:
        'Deployment: provisioned environment, security and SSO (SAML 2.0), and branding.\n' +
        'Configuration: solution set up to the agreed use cases.\n' +
        'Training & documentation: admin, end-user, and train-the-trainer sessions plus guides.\n' +
        'Support: ticketing access, onboarding guide, and support SLAs.',
      paymentTerms:
        'Subscription fees are billed annually in advance; one-time implementation is invoiced 50% ' +
        'at kickoff and 50% at go-live. All pricing is in the estimate’s currency, exclusive of taxes.',
      termsAndConditions:
        'Final scope and fees are confirmed in an Order Form. The solution may be purchased directly ' +
        'or via a cloud marketplace private offer (AWS Marketplace / Microsoft Azure Marketplace), ' +
        'applicable toward EDP/MACC commitments, with identical terms and simplified onboarding.',
    },
    TIME_MATERIALS: {
      solutionOverview:
        'This is a time-and-materials engagement delivered in iterative sprints. The Provider supplies ' +
        'the roles in the pricing table at the stated rates; the Client directs priorities through a ' +
        'shared backlog. Fees accrue against actual effort, capped at the not-to-exceed amount.',
      scope:
        'Scope is managed as a prioritized backlog and may evolve by mutual agreement within the ' +
        'not-to-exceed ceiling. The initial backlog reflects the line items in the pricing section.',
      paymentTerms:
        'Time & materials, invoiced monthly in arrears for hours/days worked plus approved expenses, ' +
        'net 30 days, capped at the not-to-exceed amount (the grand total / client price below).',
      changeControl:
        'Backlog re-prioritization within the ceiling needs no change order. Changes to rates, roles, ' +
        'or the not-to-exceed amount are made by a written change note signed by both parties.',
      acceptanceCriteria:
        'Increments are reviewed at each sprint review and accepted on Client sign-off, or 5 business ' +
        'days after the demo if no issues are raised.',
    },
    IMPL_MAINTENANCE: {
      solutionOverview:
        'This SOW covers two connected phases: the implementation of the solution and its subsequent ' +
        'maintenance and support once live. The work is delivered through discovery, design, build & ' +
        'configure, test, deploy, a hypercare stabilization period, and ongoing maintenance.',
      scope:
        'In scope: discovery and requirements confirmation; solution design and architecture; build, ' +
        'configuration, and customization; data migration; integrations; testing (unit, system, UAT ' +
        'support); deployment to production; documentation and knowledge transfer; and post-go-live ' +
        'maintenance and support (see the Maintenance & Support and SLA sections).',
      deliverables:
        'Deliverables include a requirements baseline (Discovery), a solution design document (Design), ' +
        'the configured solution (Build), migrated and validated data (Deploy), tested integrations, ' +
        'documentation and runbooks, and go-live — each accepted against its criteria.',
      maintenanceSupport:
        'Following go-live and the hypercare period, the Provider delivers ongoing maintenance: incident ' +
        'management and break/fix, application of patches/updates and minor configuration changes, ' +
        'proactive monitoring, root-cause analysis for recurring issues, and periodic service reporting. ' +
        'Excluded: new features/enhancements (handled via Change Control), issues caused by client-side ' +
        'changes or unsupported third-party software, and major version upgrades. Service levels and ' +
        'support hours are defined in the SLA and Support sections.',
      paymentTerms:
        'Implementation is invoiced per the milestone schedule (e.g. 30% kickoff, 40% UAT sign-off, ' +
        '30% go-live). Maintenance is billed on its recurring cadence (monthly/annual). All pricing is ' +
        'in the estimate’s currency, exclusive of taxes; invoices are due net 30 days.',
    },
  };
  // The split-pricing flavor shares the maintenance narrative.
  overrides.IMPL_MAINT_SPLIT = overrides.IMPL_MAINTENANCE;
  return { ...base, ...(overrides[flavor] ?? {}) };
}

/** Flavors that carry the structured maintenance sections (SLA/support/warranty). */
const MAINTENANCE_FLAVORS = ['IMPL_MAINTENANCE', 'IMPL_MAINT_SPLIT'];

// ── Implementation & Maintenance structured defaults (BR-7) ───────────────────
const DEFAULT_SLA_TIERS = [
  {
    priority: 'P1 – Critical',
    definition: 'Service down / major business impact',
    response: '15 minutes',
    resolution: '4 hours',
  },
  {
    priority: 'P2 – High',
    definition: 'Significant degradation',
    response: '1 hour',
    resolution: '1 business day',
  },
  {
    priority: 'P3 – Medium',
    definition: 'Minor issue / workaround exists',
    response: '4 hours',
    resolution: '3 business days',
  },
  {
    priority: 'P4 – Low',
    definition: 'Request / query',
    response: '1 business day',
    resolution: 'Scheduled',
  },
];
const DEFAULT_SUPPORT_TIERS = [
  { tier: 'Standard', coverage: 'Business hours (8×5)', channel: 'Support portal / email' },
  { tier: 'Extended (optional)', coverage: '24×7 / on-call', channel: 'Phone / portal' },
];
const DEFAULT_SECURITY_COMPLIANCE =
  'Data is handled in accordance with applicable law and Client policy (e.g. GDPR / HIPAA). The ' +
  'Provider maintains relevant certifications (e.g. ISO 27001 / SOC 2) where applicable. Access ' +
  'follows least-privilege principles with credentials managed per policy. Data residency: as agreed.';

/** Structured maintenance sections — populated only for the maintenance flavor. */
function maintenanceDefaults(flavor: string): {
  slaTiers: typeof DEFAULT_SLA_TIERS;
  supportTiers: typeof DEFAULT_SUPPORT_TIERS;
  warrantyDays: number | null;
  securityCompliance: string;
} {
  if (MAINTENANCE_FLAVORS.includes(flavor)) {
    return {
      slaTiers: DEFAULT_SLA_TIERS,
      supportTiers: DEFAULT_SUPPORT_TIERS,
      warrantyDays: 90,
      securityCompliance: DEFAULT_SECURITY_COMPLIANCE,
    };
  }
  return { slaTiers: [], supportTiers: [], warrantyDays: null, securityCompliance: '' };
}

@Injectable()
export class SowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly estimates: EstimatesService,
  ) {}

  private async toDto(sow: StatementOfWork): Promise<StatementOfWorkDto> {
    // Pricing: a draft reflects the estimate live; an issued SOW uses its snapshot.
    const detail: any = await this.estimates.getDetail(sow.estimateId);
    const useSnapshot = sow.status === 'ISSUED' && sow.totalsSnapshot;
    return {
      id: sow.id,
      number: sow.number,
      estimateId: sow.estimateId,
      estimateName: detail.name,
      title: sow.title,
      status: sow.status as StatementOfWorkDto['status'],
      flavor: sow.templateFlavor as StatementOfWorkDto['flavor'],
      clientName: sow.clientName,
      providerName: sow.providerName,
      executiveSummary: sow.executiveSummary,
      customerUnderstanding: sow.customerUnderstanding,
      overview: sow.overview,
      scope: sow.scope,
      outOfScope: sow.outOfScope,
      solutionOverview: sow.solutionOverview,
      deliverables: sow.deliverables,
      timeline: sow.timeline,
      paymentTerms: sow.paymentTerms,
      governanceModel: sow.governanceModel,
      rolesResponsibilities: sow.rolesResponsibilities,
      nonFunctionalRequirements: sow.nonFunctionalRequirements,
      testingStrategy: sow.testingStrategy,
      maintenanceSupport: sow.maintenanceSupport,
      assumptions: sow.assumptions,
      risksMitigation: sow.risksMitigation,
      acceptanceCriteria: sow.acceptanceCriteria,
      changeControl: sow.changeControl,
      termsAndConditions: sow.termsAndConditions,
      effectiveDate: sow.effectiveDate ? sow.effectiveDate.toISOString().slice(0, 10) : null,
      issuedAt: sow.issuedAt ? sow.issuedAt.toISOString() : null,
      preparedByEmail: sow.preparedByEmail,
      currency: useSnapshot ? (sow.currencySnapshot ?? detail.currency) : detail.currency,
      pricing: useSnapshot ? (sow.totalsSnapshot as StatementOfWorkDto['pricing']) : detail.totals,
      // Line items: an issued SOW uses its snapshot (older issued SOWs that predate
      // the snapshot fall back to the live estimate).
      lineItems:
        useSnapshot && sow.lineItemsSnapshot
          ? (sow.lineItemsSnapshot as unknown as StatementOfWorkDto['lineItems'])
          : this.buildLineItems(detail),
      slaTiers: (sow.slaTiers as unknown as StatementOfWorkDto['slaTiers']) ?? [],
      supportTiers: (sow.supportTiers as unknown as StatementOfWorkDto['supportTiers']) ?? [],
      warrantyDays: sow.warrantyDays ?? null,
      securityCompliance: sow.securityCompliance ?? '',
      createdAt: sow.createdAt.toISOString(),
      updatedAt: sow.updatedAt.toISOString(),
    };
  }

  /** Flatten an estimate's labor / non-labor / cloud lines into SOW table rows. */
  private buildLineItems(detail: any): StatementOfWorkDto['lineItems'] {
    const labor = (detail.laborItems ?? []).map((l: any) => ({
      kind: 'LABOR' as const,
      category: 'Labor',
      item: [l.roleName, l.resourceName].filter(Boolean).join(' · ') || 'Labor',
      quantity: `${l.quantity} × ${l.units}`,
      unitPrice: l.rateSnapshot,
      billingPeriod: l.billingPeriod,
      lineTotal: l.lineTotal,
    }));
    const nonLabor = (detail.nonLaborItems ?? []).map((n: any) => ({
      kind: 'NONLABOR' as const,
      category: n.category,
      item: n.description || n.category,
      quantity: String(n.periods ?? 1),
      unitPrice: n.amount,
      billingPeriod: n.billingPeriod,
      lineTotal: n.lineTotal,
    }));
    const cloud = (detail.cloudItems ?? []).map((c: any) => ({
      kind: 'CLOUD' as const,
      category: `${c.provider} ${c.service}`.trim(),
      item: `${c.skuOrInstance} (${c.region})`,
      quantity: String(c.quantity),
      unitPrice: c.unitPriceSnapshot,
      billingPeriod: c.billingPeriod,
      lineTotal: c.lineTotal,
    }));
    return [...labor, ...nonLabor, ...cloud];
  }

  async list(): Promise<SowSummaryDto[]> {
    const rows = await this.prisma.statementOfWork.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { estimate: { select: { name: true, updatedAt: true } } },
    });
    return rows.map((s) => ({
      id: s.id,
      number: s.number,
      estimateId: s.estimateId,
      estimateName: s.estimate.name,
      title: s.title,
      status: s.status as SowSummaryDto['status'],
      clientName: s.clientName,
      updatedAt: s.updatedAt.toISOString(),
      estimateUpdatedAt: s.estimate.updatedAt.toISOString(),
    }));
  }

  async get(id: string): Promise<StatementOfWorkDto> {
    const sow = await this.prisma.statementOfWork.findUnique({ where: { id } });
    if (!sow) throw new NotFoundException('Statement of Work not found');
    return this.toDto(sow);
  }

  /** Estimates that have reached an approval stage — the only valid SOW sources. */
  async eligibleEstimates(): Promise<SowEligibleEstimateDto[]> {
    const rows = await this.prisma.estimate.findMany({
      where: { currentStage: { key: { in: SOW_ELIGIBLE_STAGE_KEYS } } },
      select: { id: true, name: true, currentStage: { select: { key: true, label: true } } },
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map((e) => ({
      id: e.id,
      name: e.name,
      stageKey: e.currentStage?.key ?? '',
      stageLabel: e.currentStage?.label ?? '',
    }));
  }

  async create(dto: CreateSowRequest, user: AuthUser): Promise<StatementOfWorkDto> {
    // A SOW may only be created from an approved estimate (deny-by-default; NFR-16).
    const stageOf = await this.prisma.estimate.findUnique({
      where: { id: dto.estimateId },
      select: { currentStage: { select: { key: true, label: true } } },
    });
    if (!stageOf) throw new NotFoundException('Estimate not found');
    if (!stageOf.currentStage || !SOW_ELIGIBLE_STAGE_KEYS.includes(stageOf.currentStage.key)) {
      throw new BadRequestException(
        `A SOW can only be created from an approved estimate (current stage: ${
          stageOf.currentStage?.label ?? 'none'
        }).`,
      );
    }
    // getDetail throws NotFound if the estimate is missing.
    const detail: any = await this.estimates.getDetail(dto.estimateId);
    const number = `SOW-${randomBytes(3).toString('hex').toUpperCase()}`;
    const assumptionsText = (detail.assumptions ?? [])
      .map((a: { text: string }) => `• ${a.text}`)
      .join('\n');
    const flavor = dto.flavor ?? 'ENTERPRISE';
    const bp = flavorBoilerplate(flavor);
    const md = maintenanceDefaults(flavor);
    const sow = await this.prisma.statementOfWork.create({
      data: {
        estimateId: dto.estimateId,
        number,
        title: dto.title ?? `Statement of Work — ${detail.name}`,
        templateFlavor: flavor,
        slaTiers: md.slaTiers as unknown as Prisma.InputJsonValue,
        supportTiers: md.supportTiers as unknown as Prisma.InputJsonValue,
        warrantyDays: md.warrantyDays,
        securityCompliance: md.securityCompliance,
        clientName: dto.clientName ?? '',
        providerName: dto.providerName ?? '',
        executiveSummary: bp.executiveSummary,
        customerUnderstanding: bp.customerUnderstanding,
        overview: detail.description ?? '',
        scope: bp.scope,
        outOfScope: bp.outOfScope,
        solutionOverview: bp.solutionOverview,
        deliverables: bp.deliverables,
        timeline: bp.timeline,
        paymentTerms: bp.paymentTerms,
        governanceModel: bp.governanceModel,
        rolesResponsibilities: bp.rolesResponsibilities,
        nonFunctionalRequirements: bp.nonFunctionalRequirements,
        testingStrategy: bp.testingStrategy,
        maintenanceSupport: bp.maintenanceSupport,
        assumptions: assumptionsText,
        risksMitigation: bp.risksMitigation,
        acceptanceCriteria: bp.acceptanceCriteria,
        changeControl: bp.changeControl,
        termsAndConditions: bp.termsAndConditions,
        preparedByEmail: user.email,
      },
    });
    await this.audit.record('StatementOfWork', number, 'CREATE', user.id);
    return this.toDto(sow);
  }

  async update(id: string, dto: UpdateSowRequest, user: AuthUser): Promise<StatementOfWorkDto> {
    const sow = await this.prisma.statementOfWork.findUnique({ where: { id } });
    if (!sow) throw new NotFoundException('Statement of Work not found');
    if (sow.status === 'ISSUED') {
      throw new BadRequestException('An issued SOW is locked; revert it to draft to edit.');
    }
    const effectiveDate =
      dto.effectiveDate === undefined
        ? undefined
        : dto.effectiveDate.trim() === ''
          ? null
          : new Date(dto.effectiveDate);
    const updated = await this.prisma.statementOfWork.update({
      where: { id },
      data: {
        title: dto.title,
        clientName: dto.clientName,
        providerName: dto.providerName,
        executiveSummary: dto.executiveSummary,
        customerUnderstanding: dto.customerUnderstanding,
        overview: dto.overview,
        scope: dto.scope,
        outOfScope: dto.outOfScope,
        solutionOverview: dto.solutionOverview,
        deliverables: dto.deliverables,
        timeline: dto.timeline,
        paymentTerms: dto.paymentTerms,
        governanceModel: dto.governanceModel,
        rolesResponsibilities: dto.rolesResponsibilities,
        nonFunctionalRequirements: dto.nonFunctionalRequirements,
        testingStrategy: dto.testingStrategy,
        maintenanceSupport: dto.maintenanceSupport,
        assumptions: dto.assumptions,
        risksMitigation: dto.risksMitigation,
        acceptanceCriteria: dto.acceptanceCriteria,
        changeControl: dto.changeControl,
        termsAndConditions: dto.termsAndConditions,
        slaTiers:
          dto.slaTiers === undefined
            ? undefined
            : (dto.slaTiers as unknown as Prisma.InputJsonValue),
        supportTiers:
          dto.supportTiers === undefined
            ? undefined
            : (dto.supportTiers as unknown as Prisma.InputJsonValue),
        warrantyDays: dto.warrantyDays === undefined ? undefined : dto.warrantyDays,
        securityCompliance: dto.securityCompliance,
        effectiveDate,
      },
    });
    await this.audit.record('StatementOfWork', sow.number, 'UPDATE', user.id);
    return this.toDto(updated);
  }

  /** Lock the SOW and snapshot the estimate's pricing so the document is immutable. */
  async issue(id: string, user: AuthUser): Promise<StatementOfWorkDto> {
    const sow = await this.prisma.statementOfWork.findUnique({ where: { id } });
    if (!sow) throw new NotFoundException('Statement of Work not found');
    if (sow.status === 'ISSUED') throw new BadRequestException('This SOW is already issued.');
    const detail: any = await this.estimates.getDetail(sow.estimateId);
    const updated = await this.prisma.statementOfWork.update({
      where: { id },
      data: {
        status: 'ISSUED',
        issuedAt: new Date(),
        totalsSnapshot: detail.totals as Prisma.InputJsonValue,
        lineItemsSnapshot: this.buildLineItems(detail) as unknown as Prisma.InputJsonValue,
        currencySnapshot: detail.currency,
      },
    });
    await this.audit.record('StatementOfWork', sow.number, 'ISSUE', user.id);
    return this.toDto(updated);
  }

  /** Reopen an issued SOW for editing (clears the lock; keeps the prior snapshot until re-issued). */
  async revert(id: string, user: AuthUser): Promise<StatementOfWorkDto> {
    const sow = await this.prisma.statementOfWork.findUnique({ where: { id } });
    if (!sow) throw new NotFoundException('Statement of Work not found');
    const updated = await this.prisma.statementOfWork.update({
      where: { id },
      data: { status: 'DRAFT', issuedAt: null },
    });
    await this.audit.record('StatementOfWork', sow.number, 'UPDATE', user.id);
    return this.toDto(updated);
  }

  async remove(id: string, user: AuthUser): Promise<void> {
    const sow = await this.prisma.statementOfWork.findUnique({ where: { id } });
    if (!sow) throw new NotFoundException('Statement of Work not found');
    await this.prisma.statementOfWork.delete({ where: { id } });
    await this.audit.record('StatementOfWork', sow.number, 'DELETE', user.id);
  }
}
