import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  type AllocationLine,
  computeEstimate,
  findCapacityViolations,
  lineTotal,
} from '@cost-reaper/engine';
import type {
  AssumptionInput,
  CloudLineInput,
  CreateEstimateRequest,
  EngineResult,
  EstimateListQuery,
  LaborLineInput,
  NonLaborLineInput,
  UpdateEstimateRequest,
} from '@cost-reaper/types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { ReferenceService } from '../reference/reference.service';
import { buildEngineInput, toMappableEstimate } from './engine-mapping';
import { CsvLine, toCsv } from './estimate-csv';

const DETAIL_INCLUDE = {
  laborItems: { include: { rateCardRole: true } },
  nonLaborItems: true,
  cloudItems: true,
  assumptions: { orderBy: { createdAt: 'asc' as const } },
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
        workflowDefinitionId: def?.id ?? null,
        currentStageId: initial?.id ?? null,
      },
    });
    await this.audit.record('Estimate', est.id, 'CREATE', ownerId);
    return this.getDetail(est.id);
  }

  async list(query: EstimateListQuery) {
    const where: any = {};
    if (query.q) where.name = { contains: query.q, mode: 'insensitive' };
    if (query.status) where.status = query.status;
    if (query.ownerId) where.ownerId = query.ownerId;

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.estimate.count({ where }),
      this.prisma.estimate.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: DETAIL_INCLUDE,
      }),
    ]);

    return {
      data: rows.map((e: any) => ({
        id: e.id,
        name: e.name,
        status: e.status,
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
    await this.ensure(id);
    await this.prisma.estimate.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        status: dto.status,
        rateCardId: dto.rateCardId,
        globalUpchargePercent: dto.globalUpchargePercent,
        contingencyPercent: dto.contingencyPercent,
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

  async clone(id: string, actorId: string) {
    const e: any = await this.prisma.estimate.findUnique({
      where: { id },
      include: DETAIL_INCLUDE,
    });
    if (!e) throw new NotFoundException('Estimate not found');
    const copy = await this.prisma.estimate.create({
      data: {
        name: `${e.name} (copy)`,
        description: e.description,
        currency: e.currency,
        rateCardId: e.rateCardId,
        ownerId: actorId,
        globalUpchargePercent: e.globalUpchargePercent,
        contingencyPercent: e.contingencyPercent,
        laborItems: {
          create: e.laborItems.map((l: any) => ({
            rateCardRoleId: l.rateCardRoleId,
            description: l.description,
            quantity: l.quantity,
            units: l.units,
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
    await this.audit.record('Estimate', copy.id, 'CLONE', actorId);
    return this.getDetail(copy.id);
  }

  // ── Totals + export (FR-7, FR-22, FR-23, FR-10) ──────────────────────────────

  async totals(id: string) {
    const e = await this.prisma.estimate.findUnique({ where: { id }, include: DETAIL_INCLUDE });
    if (!e) throw new NotFoundException('Estimate not found');
    return { ...this.computeTotals(e), currency: e.currency };
  }

  async exportCsv(id: string): Promise<{ filename: string; csv: string }> {
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
    return {
      filename: `estimate-${id}.csv`,
      csv: toCsv({ name: e.name, currency: e.currency }, lines, totals),
    };
  }

  // ── Line items ───────────────────────────────────────────────────────────────

  async addLabor(estimateId: string, dto: LaborLineInput, actorId: string) {
    await this.ensure(estimateId);
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

    await this.prisma.laborLineItem.create({
      data: {
        estimateId,
        rateCardRoleId: dto.rateCardRoleId ?? null,
        description: dto.description ?? null,
        quantity: dto.quantity,
        units: dto.units,
        rateSnapshot: rate,
        upchargePercentOverride: dto.upchargePercentOverride ?? null,
        billingPeriod: dto.billingPeriod,
        sdlcPhase: dto.sdlcPhase ?? null,
        resourceName: dto.resourceName ?? null,
        allocationPercent: dto.allocationPercent,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        lineTotal: lineTotal(rate, dto.quantity * dto.units),
      },
    });
    await this.audit.record('Estimate', estimateId, 'UPDATE', actorId);
    return this.getDetail(estimateId);
  }

  async addNonLabor(estimateId: string, dto: NonLaborLineInput, actorId: string) {
    await this.ensure(estimateId);
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
    return this.getDetail(estimateId);
  }

  async addCloud(estimateId: string, dto: CloudLineInput, actorId: string) {
    await this.ensure(estimateId);
    await this.checkSdlcPhase(dto.sdlcPhase);
    const price = await this.prisma.cloudPrice.findUnique({ where: { id: dto.cloudPriceId } });
    if (!price) throw new NotFoundException('Cloud price not found');
    const snapshot = price.unitPrice.toString();
    await this.prisma.cloudComputeLineItem.create({
      data: {
        estimateId,
        cloudPriceId: price.id,
        provider: price.provider,
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
    return this.getDetail(estimateId);
  }

  async deleteLabor(estimateId: string, itemId: string, actorId: string) {
    await this.prisma.laborLineItem.deleteMany({ where: { id: itemId, estimateId } });
    await this.audit.record('Estimate', estimateId, 'UPDATE', actorId);
    return this.getDetail(estimateId);
  }

  async deleteNonLabor(estimateId: string, itemId: string, actorId: string) {
    await this.prisma.nonLaborLineItem.deleteMany({ where: { id: itemId, estimateId } });
    await this.audit.record('Estimate', estimateId, 'UPDATE', actorId);
    return this.getDetail(estimateId);
  }

  async deleteCloud(estimateId: string, itemId: string, actorId: string) {
    await this.prisma.cloudComputeLineItem.deleteMany({ where: { id: itemId, estimateId } });
    await this.audit.record('Estimate', estimateId, 'UPDATE', actorId);
    return this.getDetail(estimateId);
  }

  async addAssumption(estimateId: string, dto: AssumptionInput, actorId: string) {
    await this.ensure(estimateId);
    await this.prisma.assumption.create({ data: { estimateId, text: dto.text } });
    await this.audit.record('Estimate', estimateId, 'UPDATE', actorId);
    return this.getDetail(estimateId);
  }

  async deleteAssumption(estimateId: string, itemId: string, actorId: string) {
    await this.prisma.assumption.deleteMany({ where: { id: itemId, estimateId } });
    await this.audit.record('Estimate', estimateId, 'UPDATE', actorId);
    return this.getDetail(estimateId);
  }

  // ── Internals ────────────────────────────────────────────────────────────────

  private async ensure(id: string): Promise<void> {
    const e = await this.prisma.estimate.findUnique({ where: { id }, select: { id: true } });
    if (!e) throw new NotFoundException('Estimate not found');
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
      status: e.status,
      currency: e.currency,
      rateCardId: e.rateCardId,
      ownerId: e.ownerId,
      currentStageKey: e.currentStage?.key ?? null,
      currentStageLabel: e.currentStage?.label ?? null,
      globalUpchargePercent: Number(e.globalUpchargePercent),
      contingencyPercent: Number(e.contingencyPercent),
      laborItems: e.laborItems.map((l: any) => ({
        id: l.id,
        rateCardRoleId: l.rateCardRoleId,
        roleName: l.rateCardRole?.roleName ?? null,
        description: l.description,
        quantity: l.quantity.toString(),
        units: l.units.toString(),
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
      totals: this.computeTotals(e),
      capacityViolations: findCapacityViolations(e.laborItems.map(toAllocationLine)),
    };
  }
}
