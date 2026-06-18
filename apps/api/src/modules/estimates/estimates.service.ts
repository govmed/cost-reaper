import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  type AllocationLine,
  computeEstimate,
  findCapacityViolations,
  lineTotal,
  pert,
} from '@cost-reaper/engine';
import type {
  AssumptionInput,
  AuthUser,
  BaselineDto,
  CaptureBaselineRequest,
  CloudLineInput,
  CommentInput,
  CreateEstimateRequest,
  EngineResult,
  EstimateListQuery,
  LaborLineInput,
  NonLaborLineInput,
  ScenarioDto,
  UpdateEstimateRequest,
} from '@cost-reaper/types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { pageSkipTake } from '../../common/pagination';
import { ReferenceService } from '../reference/reference.service';
import { buildEngineInput, toMappableEstimate } from './engine-mapping';
import { CsvLine, exportRows, toCsv } from './estimate-csv';
import { buildXlsx } from './xlsx';
import { gmStageWhere } from '../../common/gm-scope';

const DETAIL_INCLUDE = {
  laborItems: { include: { rateCardRole: true } },
  nonLaborItems: true,
  cloudItems: true,
  assumptions: { orderBy: { createdAt: 'asc' as const } },
  comments: { orderBy: { createdAt: 'asc' as const } },
  currentStage: true,
};

/** Prisma `@db.Date` round-trips as a UTC-midnight Date; expose it as 'YYYY-MM-DD'. */
function toIsoDate(d: Date | string | null): string | null {
  if (!d) return null;
  return (d instanceof Date ? d.toISOString() : d).slice(0, 10);
}

/** Project a stored labor row to the engine's capacity contract (FR-27). */
function toAllocationLine(l: {
  resourceName: string | null;
  allocationPercent: unknown;
  startDate: Date | null;
  endDate: Date | null;
}): AllocationLine {
  return {
    resourceName: l.resourceName,
    allocationPercent: Number(l.allocationPercent),
    startDate: toIsoDate(l.startDate),
    endDate: toIsoDate(l.endDate),
  };
}

@Injectable()
export class EstimatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly reference: ReferenceService,
  ) {}

  /** Validate an optional SDLC phase against the active reference values (FR-29). */
  private async checkSdlcPhase(code: string | null | undefined): Promise<void> {
    if (code) await this.reference.assertActiveCode('SDLC_PHASE', code);
  }

  // ── CRUD ───────────────────────────────────────────────────────────────────

  async create(dto: CreateEstimateRequest, ownerId: string) {
    // Attach the seeded default workflow + initial stage (FR-24).
    const def: any = await this.prisma.workflowDefinition.findFirst({
      where: { isDefault: true },
      include: { stages: true },
    });
    const initial = def?.stages.find((s: any) => s.isInitial) ?? def?.stages[0];
    const est = await this.prisma.estimate.create({
      data: {
        name: dto.name,
        description: dto.description ?? null,
        currency: dto.currency,
        rateCardId: dto.rateCardId ?? null,
        ownerId,
        globalUpchargePercent: dto.globalUpchargePercent,
        contingencyPercent: dto.contingencyPercent,
        marginPercent: dto.marginPercent,
        taxPercent: dto.taxPercent,
        workflowDefinitionId: def?.id ?? null,
        currentStageId: initial?.id ?? null,
      },
    });
    await this.audit.record('Estimate', est.id, 'CREATE', ownerId);
    return this.getDetail(est.id);
  }

  async list(query: EstimateListQuery, user?: AuthUser) {
    const where: any = {};
    if (query.q) where.name = { contains: query.q, mode: 'insensitive' };
    if (query.ownerId) where.ownerId = query.ownerId;
    // A GM (approver) only sees the estimates in their queue — those awaiting
    // review and the ones they've approved.
    Object.assign(where, gmStageWhere(user));

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.estimate.count({ where }),
      this.prisma.estimate.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        ...pageSkipTake(query.page, query.pageSize),
        include: DETAIL_INCLUDE,
      }),
    ]);

    return {
      data: rows.map((e: any) => ({
        id: e.id,
        name: e.name,
        currentStageLabel: e.currentStage?.label ?? null,
        currency: e.currency,
        ownerId: e.ownerId,
        currentStageKey: e.currentStage?.key ?? null,
        grandTotal: this.computeTotals(e).grandTotal,
        updatedAt: e.updatedAt.toISOString(),
      })),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async getDetail(id: string) {
    const e = await this.prisma.estimate.findUnique({ where: { id }, include: DETAIL_INCLUDE });
    if (!e) throw new NotFoundException('Estimate not found');
    return this.toDetailDto(e);
  }

  async update(id: string, dto: UpdateEstimateRequest, actorId: string) {
    await this.ensureEditable(id);
    await this.prisma.estimate.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        rateCardId: dto.rateCardId,
        globalUpchargePercent: dto.globalUpchargePercent,
        contingencyPercent: dto.contingencyPercent,
        marginPercent: dto.marginPercent,
        taxPercent: dto.taxPercent,
      },
    });
    await this.audit.record('Estimate', id, 'UPDATE', actorId);
    return this.getDetail(id);
  }

  async remove(id: string, actorId: string): Promise<void> {
    await this.ensure(id);
    await this.prisma.estimate.delete({ where: { id } });
    await this.audit.record('Estimate', id, 'DELETE', actorId);
  }

  async clone(id: string, actorId: string, asScenario = false) {
    const e: any = await this.prisma.estimate.findUnique({
      where: { id },
      include: DETAIL_INCLUDE,
    });
    if (!e) throw new NotFoundException('Estimate not found');
    // A scenario links to the shared root so all variants compare together (FR-14).
    const scenarioOfId = asScenario ? (e.scenarioOfId ?? e.id) : null;
    const copy = await this.prisma.estimate.create({
      data: {
        name: asScenario ? `${e.name} (scenario)` : `${e.name} (copy)`,
        scenarioOfId,
        description: e.description,
        currency: e.currency,
        rateCardId: e.rateCardId,
        ownerId: actorId,
        globalUpchargePercent: e.globalUpchargePercent,
        contingencyPercent: e.contingencyPercent,
        marginPercent: e.marginPercent,
        taxPercent: e.taxPercent,
        laborItems: {
          create: e.laborItems.map((l: any) => ({
            rateCardRoleId: l.rateCardRoleId,
            description: l.description,
            quantity: l.quantity,
            units: l.units,
            unitsOptimistic: l.unitsOptimistic,
            unitsMostLikely: l.unitsMostLikely,
            unitsPessimistic: l.unitsPessimistic,
            rateSnapshot: l.rateSnapshot,
            upchargePercentOverride: l.upchargePercentOverride,
            billingPeriod: l.billingPeriod,
            sdlcPhase: l.sdlcPhase,
            resourceName: l.resourceName,
            allocationPercent: l.allocationPercent,
            startDate: l.startDate,
            endDate: l.endDate,
            lineTotal: l.lineTotal,
          })),
        },
        nonLaborItems: {
          create: e.nonLaborItems.map((n: any) => ({
            category: n.category,
            description: n.description,
            type: n.type,
            amount: n.amount,
            upchargePercentOverride: n.upchargePercentOverride,
            billingPeriod: n.billingPeriod,
            periods: n.periods,
            sdlcPhase: n.sdlcPhase,
            lineTotal: n.lineTotal,
          })),
        },
        cloudItems: {
          create: e.cloudItems.map((c: any) => ({
            cloudPriceId: c.cloudPriceId,
            provider: c.provider,
            region: c.region,
            service: c.service,
            skuOrInstance: c.skuOrInstance,
            quantity: c.quantity,
            usageHoursPerMonth: c.usageHoursPerMonth,
            unitPriceSnapshot: c.unitPriceSnapshot,
            upchargePercentOverride: c.upchargePercentOverride,
            billingPeriod: c.billingPeriod,
            sdlcPhase: c.sdlcPhase,
            lineTotal: c.lineTotal,
          })),
        },
        assumptions: { create: e.assumptions.map((a: any) => ({ text: a.text })) },
      },
    });
    await this.audit.record('Estimate', copy.id, asScenario ? 'SCENARIO' : 'CLONE', actorId);
    return this.getDetail(copy.id);
  }

  /** The estimate's scenario group (root + all variants) with totals, for comparison (FR-14). */
  async scenarios(id: string): Promise<ScenarioDto[]> {
    const est = await this.prisma.estimate.findUnique({
      where: { id },
      select: { id: true, scenarioOfId: true },
    });
    if (!est) throw new NotFoundException('Estimate not found');
    const rootId = est.scenarioOfId ?? est.id;
    const rows: any[] = await this.prisma.estimate.findMany({
      where: { OR: [{ id: rootId }, { scenarioOfId: rootId }] },
      orderBy: { createdAt: 'asc' },
      include: DETAIL_INCLUDE,
    });
    return rows.map((e) => {
      const totals = this.computeTotals(e);
      return {
        id: e.id,
        name: e.name,
        currentStageLabel: e.currentStage?.label ?? null,
        currency: e.currency,
        grandTotal: totals.grandTotal,
        clientPrice: totals.clientPrice,
        isCurrent: e.id === id,
        isRoot: e.id === rootId,
        updatedAt: e.updatedAt.toISOString(),
      };
    });
  }

  // ── Versioning / baselines (FR-15) ───────────────────────────────────────────

  async captureBaseline(estimateId: string, dto: CaptureBaselineRequest, user: AuthUser) {
    await this.ensure(estimateId);
    const detail: any = await this.getDetail(estimateId);
    const t = detail.totals;
    await this.prisma.baseline.create({
      data: {
        estimateId,
        label: dto.label,
        grandTotal: t.grandTotal,
        clientPrice: t.clientPrice,
        oneTimeTotal: t.oneTimeTotal,
        monthlyTotal: t.monthlyTotal,
        yearlyTotal: t.yearlyTotal,
        snapshotJson: detail as Prisma.InputJsonValue,
        createdByEmail: user.email,
      },
    });
    await this.audit.record('Estimate', estimateId, 'BASELINE', user.id);
    return this.listBaselines(estimateId);
  }

  async listBaselines(estimateId: string): Promise<BaselineDto[]> {
    const rows = await this.prisma.baseline.findMany({
      where: { estimateId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((b) => ({
      id: b.id,
      label: b.label,
      grandTotal: b.grandTotal.toString(),
      clientPrice: b.clientPrice.toString(),
      oneTimeTotal: b.oneTimeTotal.toString(),
      monthlyTotal: b.monthlyTotal.toString(),
      yearlyTotal: b.yearlyTotal.toString(),
      createdByEmail: b.createdByEmail,
      createdAt: b.createdAt.toISOString(),
    }));
  }

  async deleteBaseline(estimateId: string, baselineId: string, actorId: string) {
    await this.prisma.baseline.deleteMany({ where: { id: baselineId, estimateId } });
    await this.audit.record('Estimate', estimateId, 'UPDATE', actorId);
    return this.listBaselines(estimateId);
  }

  // ── Totals + export (FR-7, FR-22, FR-23, FR-10) ──────────────────────────────

  async totals(id: string) {
    const e = await this.prisma.estimate.findUnique({ where: { id }, include: DETAIL_INCLUDE });
    if (!e) throw new NotFoundException('Estimate not found');
    return { ...this.computeTotals(e), currency: e.currency };
  }

  /** Assemble the export rows + totals once, reused by CSV and Excel exports. */
  private async buildExport(id: string) {
    const e: any = await this.prisma.estimate.findUnique({
      where: { id },
      include: DETAIL_INCLUDE,
    });
    if (!e) throw new NotFoundException('Estimate not found');
    const totals = this.computeTotals(e);
    const lines: CsvLine[] = [
      ...e.laborItems.map((l: any) => ({
        type: 'Labor',
        description: l.rateCardRole?.roleName ?? l.description ?? '',
        quantity: l.quantity.toString(),
        unit: l.units.toString(),
        rate: l.rateSnapshot.toString(),
        billingPeriod: l.billingPeriod,
        phase: l.sdlcPhase ?? '',
        lineTotal: l.lineTotal.toString(),
      })),
      ...e.nonLaborItems.map((n: any) => ({
        type: 'Non-labor',
        description: `${n.category}${n.description ? ' — ' + n.description : ''}`,
        quantity: n.periods.toString(),
        unit: 'period',
        rate: n.amount.toString(),
        billingPeriod: n.billingPeriod,
        phase: n.sdlcPhase ?? '',
        lineTotal: n.lineTotal.toString(),
      })),
      ...e.cloudItems.map((c: any) => ({
        type: `Cloud (${c.provider})`,
        description: `${c.service} ${c.skuOrInstance} @ ${c.region}`,
        quantity: c.quantity.toString(),
        unit: `${c.usageHoursPerMonth}h/mo`,
        rate: c.unitPriceSnapshot.toString(),
        billingPeriod: c.billingPeriod,
        phase: c.sdlcPhase ?? '',
        lineTotal: c.lineTotal.toString(),
      })),
    ];
    return { meta: { name: e.name, currency: e.currency }, lines, totals };
  }

  async exportCsv(id: string): Promise<{ filename: string; csv: string }> {
    const { meta, lines, totals } = await this.buildExport(id);
    return { filename: `estimate-${id}.csv`, csv: toCsv(meta, lines, totals) };
  }

  async exportExcel(id: string): Promise<{ filename: string; xlsx: Buffer }> {
    const { meta, lines, totals } = await this.buildExport(id);
    return {
      filename: `estimate-${id}.xlsx`,
      xlsx: buildXlsx('Estimate', exportRows(meta, lines, totals)),
    };
  }

  // ── Line items ───────────────────────────────────────────────────────────────

  async addLabor(estimateId: string, dto: LaborLineInput, actorId: string) {
    await this.ensureEditable(estimateId);
    await this.checkSdlcPhase(dto.sdlcPhase);
    let rate = dto.rateSnapshot;
    if (!rate) {
      if (!dto.rateCardRoleId)
        throw new BadRequestException('rateSnapshot or rateCardRoleId is required');
      const role = await this.prisma.rateCardRole.findUnique({ where: { id: dto.rateCardRoleId } });
      if (!role) throw new NotFoundException('Rate-card role not found');
      rate = role.rate.toString();
    }

    // Resource-capacity stage guard (FR-27): reject a write that pushes any
    // resource over 100% on any date, considering this estimate's existing lines.
    const existing = await this.prisma.laborLineItem.findMany({
      where: { estimateId },
      select: { resourceName: true, allocationPercent: true, startDate: true, endDate: true },
    });
    const candidate: AllocationLine = {
      resourceName: dto.resourceName ?? null,
      allocationPercent: dto.allocationPercent,
      startDate: dto.startDate ?? null,
      endDate: dto.endDate ?? null,
    };
    const violations = findCapacityViolations([...existing.map(toAllocationLine), candidate]);
    if (violations.length) {
      const v = violations[0];
      throw new BadRequestException(
        `${v.resourceName} would be over-allocated to ${v.totalPercent}% on ${v.date} (max 100%).`,
      );
    }

    // Three-point/PERT (FR-13): when all three points are given, the effective
    // units = PERT expected value; `units` is stored as that expected value.
    const threePoint =
      dto.unitsOptimistic != null && dto.unitsMostLikely != null && dto.unitsPessimistic != null;
    const effUnits = threePoint
      ? pert(dto.unitsOptimistic!, dto.unitsMostLikely!, dto.unitsPessimistic!)
      : dto.units;

    await this.prisma.laborLineItem.create({
      data: {
        estimateId,
        rateCardRoleId: dto.rateCardRoleId ?? null,
        description: dto.description ?? null,
        quantity: dto.quantity,
        units: effUnits,
        unitsOptimistic: dto.unitsOptimistic ?? null,
        unitsMostLikely: dto.unitsMostLikely ?? null,
        unitsPessimistic: dto.unitsPessimistic ?? null,
        rateSnapshot: rate,
        upchargePercentOverride: dto.upchargePercentOverride ?? null,
        billingPeriod: dto.billingPeriod,
        sdlcPhase: dto.sdlcPhase ?? null,
        resourceName: dto.resourceName ?? null,
        allocationPercent: dto.allocationPercent,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        lineTotal: lineTotal(rate, dto.quantity * effUnits),
      },
    });
    await this.audit.record('Estimate', estimateId, 'UPDATE', actorId);
    await this.touch(estimateId);
    return this.getDetail(estimateId);
  }

  async addNonLabor(estimateId: string, dto: NonLaborLineInput, actorId: string) {
    await this.ensureEditable(estimateId);
    await this.checkSdlcPhase(dto.sdlcPhase);
    // Cost category is governed by the COST_CATEGORY reference list (FR-29, FE-11).
    await this.reference.assertActiveDisplayName('COST_CATEGORY', dto.category);
    await this.prisma.nonLaborLineItem.create({
      data: {
        estimateId,
        category: dto.category,
        description: dto.description ?? null,
        type: dto.type,
        amount: dto.amount,
        upchargePercentOverride: dto.upchargePercentOverride ?? null,
        billingPeriod: dto.billingPeriod,
        periods: dto.periods,
        sdlcPhase: dto.sdlcPhase ?? null,
        lineTotal: lineTotal(dto.amount, dto.periods),
      },
    });
    await this.audit.record('Estimate', estimateId, 'UPDATE', actorId);
    await this.touch(estimateId);
    return this.getDetail(estimateId);
  }

  async addCloud(estimateId: string, dto: CloudLineInput, actorId: string) {
    await this.ensureEditable(estimateId);
    await this.checkSdlcPhase(dto.sdlcPhase);
    const price = await this.prisma.cloudPrice.findUnique({ where: { id: dto.cloudPriceId } });
    if (!price) throw new NotFoundException('Cloud price not found');
    const snapshot = price.unitPrice.toString();
    await this.prisma.cloudComputeLineItem.create({
      data: {
        estimateId,
        cloudPriceId: price.id,
        provider: price.provider,
        category: price.category,
        region: price.region,
        service: price.service,
        skuOrInstance: price.skuOrInstance,
        quantity: dto.quantity,
        usageHoursPerMonth: dto.usageHoursPerMonth,
        unitPriceSnapshot: snapshot,
        upchargePercentOverride: dto.upchargePercentOverride ?? null,
        billingPeriod: dto.billingPeriod,
        sdlcPhase: dto.sdlcPhase ?? null,
        lineTotal: lineTotal(snapshot, dto.quantity * dto.usageHoursPerMonth),
      },
    });
    await this.audit.record('Estimate', estimateId, 'UPDATE', actorId);
    await this.touch(estimateId);
    return this.getDetail(estimateId);
  }

  async deleteLabor(estimateId: string, itemId: string, actorId: string) {
    await this.ensureEditable(estimateId);
    await this.prisma.laborLineItem.deleteMany({ where: { id: itemId, estimateId } });
    await this.audit.record('Estimate', estimateId, 'UPDATE', actorId);
    await this.touch(estimateId);
    return this.getDetail(estimateId);
  }

  async deleteNonLabor(estimateId: string, itemId: string, actorId: string) {
    await this.ensureEditable(estimateId);
    await this.prisma.nonLaborLineItem.deleteMany({ where: { id: itemId, estimateId } });
    await this.audit.record('Estimate', estimateId, 'UPDATE', actorId);
    await this.touch(estimateId);
    return this.getDetail(estimateId);
  }

  async deleteCloud(estimateId: string, itemId: string, actorId: string) {
    await this.ensureEditable(estimateId);
    await this.prisma.cloudComputeLineItem.deleteMany({ where: { id: itemId, estimateId } });
    await this.audit.record('Estimate', estimateId, 'UPDATE', actorId);
    await this.touch(estimateId);
    return this.getDetail(estimateId);
  }

  async addAssumption(estimateId: string, dto: AssumptionInput, actorId: string) {
    await this.ensureEditable(estimateId);
    await this.prisma.assumption.create({ data: { estimateId, text: dto.text } });
    await this.audit.record('Estimate', estimateId, 'UPDATE', actorId);
    await this.touch(estimateId);
    return this.getDetail(estimateId);
  }

  async deleteAssumption(estimateId: string, itemId: string, actorId: string) {
    await this.ensureEditable(estimateId);
    await this.prisma.assumption.deleteMany({ where: { id: itemId, estimateId } });
    await this.audit.record('Estimate', estimateId, 'UPDATE', actorId);
    await this.touch(estimateId);
    return this.getDetail(estimateId);
  }

  // ── Comments (FR-19) ─────────────────────────────────────────────────────────

  async addComment(estimateId: string, dto: CommentInput, author: AuthUser) {
    await this.ensure(estimateId);
    await this.prisma.comment.create({
      data: { estimateId, authorId: author.id, authorEmail: author.email, text: dto.text },
    });
    await this.audit.record('Estimate', estimateId, 'COMMENT', author.id);
    return this.getDetail(estimateId);
  }

  /** A comment may be deleted by its author or an admin. */
  async deleteComment(estimateId: string, commentId: string, user: AuthUser) {
    const c = await this.prisma.comment.findFirst({ where: { id: commentId, estimateId } });
    if (!c) throw new NotFoundException('Comment not found');
    if (c.authorId !== user.id && user.role !== 'ADMIN') {
      throw new ForbiddenException('Only the author or an admin can delete a comment');
    }
    await this.prisma.comment.delete({ where: { id: commentId } });
    await this.audit.record('Estimate', estimateId, 'UPDATE', user.id);
    return this.getDetail(estimateId);
  }

  // ── Internals ────────────────────────────────────────────────────────────────

  /**
   * Bump the estimate's `updatedAt` after a content change. Line items and
   * assumptions live in child tables, so writing them does NOT touch the parent
   * estimate row's @updatedAt on its own — we bump it explicitly so consumers
   * (e.g. the SOW "Estimate updated" column) reflect content edits, not just
   * settings/status changes.
   */
  private async touch(id: string): Promise<void> {
    await this.prisma.estimate.update({ where: { id }, data: { updatedAt: new Date() } });
  }

  private async ensure(id: string): Promise<void> {
    const e = await this.prisma.estimate.findUnique({ where: { id }, select: { id: true } });
    if (!e) throw new NotFoundException('Estimate not found');
  }

  /**
   * Edit guard (FR-24 governance): an estimate is editable only in its workflow's
   * initial (Draft) stage. Once it leaves Draft — In Review, Approved, Final,
   * Archived — its content is locked until it transitions back to Draft. Comments,
   * cloning, baselines and stage transitions are intentionally NOT gated here.
   */
  private async ensureEditable(id: string): Promise<void> {
    const e = await this.prisma.estimate.findUnique({
      where: { id },
      select: { id: true, currentStage: { select: { isInitial: true, label: true } } },
    });
    if (!e) throw new NotFoundException('Estimate not found');
    if (e.currentStage && !e.currentStage.isInitial) {
      throw new ConflictException(
        `This estimate is locked while in "${e.currentStage.label}". Return it to Draft to make changes.`,
      );
    }
  }

  private computeTotals(e: any): EngineResult {
    return computeEstimate(buildEngineInput(toMappableEstimate(e)));
  }

  private toDetailDto(e: any) {
    const pct = (v: any) => (v == null ? null : Number(v));
    return {
      id: e.id,
      name: e.name,
      description: e.description,
      currency: e.currency,
      rateCardId: e.rateCardId,
      ownerId: e.ownerId,
      currentStageKey: e.currentStage?.key ?? null,
      currentStageLabel: e.currentStage?.label ?? null,
      // Content is editable only in the workflow's initial (Draft) stage (FR-24).
      editable: e.currentStage ? e.currentStage.isInitial : true,
      globalUpchargePercent: Number(e.globalUpchargePercent),
      contingencyPercent: Number(e.contingencyPercent),
      marginPercent: Number(e.marginPercent),
      taxPercent: Number(e.taxPercent),
      laborItems: e.laborItems.map((l: any) => ({
        id: l.id,
        rateCardRoleId: l.rateCardRoleId,
        roleName: l.rateCardRole?.roleName ?? null,
        description: l.description,
        quantity: l.quantity.toString(),
        units: l.units.toString(),
        unitsOptimistic: l.unitsOptimistic != null ? l.unitsOptimistic.toString() : null,
        unitsMostLikely: l.unitsMostLikely != null ? l.unitsMostLikely.toString() : null,
        unitsPessimistic: l.unitsPessimistic != null ? l.unitsPessimistic.toString() : null,
        rateSnapshot: l.rateSnapshot.toString(),
        upchargePercentOverride: pct(l.upchargePercentOverride),
        billingPeriod: l.billingPeriod,
        sdlcPhase: l.sdlcPhase ?? null,
        resourceName: l.resourceName ?? null,
        allocationPercent: Number(l.allocationPercent),
        startDate: toIsoDate(l.startDate),
        endDate: toIsoDate(l.endDate),
        lineTotal: l.lineTotal.toString(),
      })),
      nonLaborItems: e.nonLaborItems.map((n: any) => ({
        id: n.id,
        category: n.category,
        description: n.description,
        type: n.type,
        amount: n.amount.toString(),
        upchargePercentOverride: pct(n.upchargePercentOverride),
        billingPeriod: n.billingPeriod,
        periods: n.periods,
        sdlcPhase: n.sdlcPhase ?? null,
        lineTotal: n.lineTotal.toString(),
      })),
      cloudItems: e.cloudItems.map((c: any) => ({
        id: c.id,
        cloudPriceId: c.cloudPriceId,
        provider: c.provider,
        region: c.region,
        service: c.service,
        skuOrInstance: c.skuOrInstance,
        quantity: c.quantity.toString(),
        usageHoursPerMonth: c.usageHoursPerMonth.toString(),
        unitPriceSnapshot: c.unitPriceSnapshot.toString(),
        upchargePercentOverride: pct(c.upchargePercentOverride),
        billingPeriod: c.billingPeriod,
        sdlcPhase: c.sdlcPhase ?? null,
        lineTotal: c.lineTotal.toString(),
      })),
      assumptions: e.assumptions.map((a: any) => ({
        id: a.id,
        text: a.text,
        createdAt: a.createdAt.toISOString(),
      })),
      comments: (e.comments ?? []).map((c: any) => ({
        id: c.id,
        authorId: c.authorId,
        authorEmail: c.authorEmail,
        text: c.text,
        createdAt: c.createdAt.toISOString(),
      })),
      totals: this.computeTotals(e),
      capacityViolations: findCapacityViolations(e.laborItems.map(toAllocationLine)),
    };
  }
}
