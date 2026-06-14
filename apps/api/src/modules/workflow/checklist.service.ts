import { randomBytes } from 'node:crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type {
  AuthUser,
  ChecklistResult,
  ChecklistRuleDto,
  ChecklistRuleSetDto,
  CreateChecklistRuleRequest,
  CreateChecklistRuleSetRequest,
  UpdateChecklistRuleRequest,
  UpdateChecklistRuleSetRequest,
} from '@cost-reaper/types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { type ChecklistEstimate, EVALUATOR_KEYS, evaluateChecklist } from './checklist-rules';

@Injectable()
export class ChecklistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ── Rule sets (FR-25, admin) — a repo of named rule collections ────────────

  private setToDto(s: {
    id: string;
    key: string;
    name: string;
    description: string | null;
    isDefault: boolean;
    isActive: boolean;
    _count?: { rules: number };
  }): ChecklistRuleSetDto {
    return {
      id: s.id,
      key: s.key,
      name: s.name,
      description: s.description,
      isDefault: s.isDefault,
      isActive: s.isActive,
      ruleCount: s._count?.rules ?? 0,
    };
  }

  async listRuleSets(): Promise<ChecklistRuleSetDto[]> {
    const sets = await this.prisma.checklistRuleSet.findMany({
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
      include: { _count: { select: { rules: true } } },
    });
    return sets.map((s) => this.setToDto(s));
  }

  /** The default set drives evaluation for every estimate; created lazily if missing. */
  private async defaultRuleSetId(): Promise<string> {
    const existing = await this.prisma.checklistRuleSet.findFirst({ where: { isDefault: true } });
    if (existing) return existing.id;
    const created = await this.prisma.checklistRuleSet.create({
      data: { key: 'RS-DEFAULT', name: 'Default checklist', isDefault: true },
    });
    return created.id;
  }

  async createRuleSet(
    dto: CreateChecklistRuleSetRequest,
    user: AuthUser,
  ): Promise<ChecklistRuleSetDto> {
    const key = `RS-${randomBytes(3).toString('hex').toUpperCase()}`;
    const created = await this.prisma.checklistRuleSet.create({
      data: { key, name: dto.name, description: dto.description ?? null },
      include: { _count: { select: { rules: true } } },
    });
    await this.audit.record('ChecklistRuleSet', key, 'CREATE', user.id);
    return this.setToDto(created);
  }

  async updateRuleSet(
    id: string,
    dto: UpdateChecklistRuleSetRequest,
    user: AuthUser,
  ): Promise<ChecklistRuleSetDto[]> {
    const set = await this.prisma.checklistRuleSet.findUnique({ where: { id } });
    if (!set) throw new NotFoundException('Rule set not found');
    await this.prisma.checklistRuleSet.update({
      where: { id },
      data: {
        name: dto.name ?? undefined,
        description: dto.description ?? undefined,
        isActive: dto.isActive ?? undefined,
      },
    });
    await this.audit.record('ChecklistRuleSet', set.key, 'UPDATE', user.id);
    return this.listRuleSets();
  }

  async deleteRuleSet(id: string, user: AuthUser): Promise<ChecklistRuleSetDto[]> {
    const set = await this.prisma.checklistRuleSet.findUnique({
      where: { id },
      include: { _count: { select: { rules: true } } },
    });
    if (!set) throw new NotFoundException('Rule set not found');
    if (set.isDefault) throw new BadRequestException('The default rule set cannot be deleted');
    if (set._count.rules > 0) {
      throw new BadRequestException('Remove or reassign this set’s rules before deleting it');
    }
    await this.prisma.checklistRuleSet.delete({ where: { id } });
    await this.audit.record('ChecklistRuleSet', set.key, 'DELETE', user.id);
    return this.listRuleSets();
  }

  // ── Authoring (FR-25, admin) ───────────────────────────────────────────────

  private toDto(r: {
    id: string;
    key: string;
    description: string;
    severity: string;
    scope: string;
    isActive: boolean;
    isBuiltin: boolean;
    ruleSetId: string;
  }): ChecklistRuleDto {
    return {
      id: r.id,
      key: r.key,
      description: r.description,
      severity: r.severity as ChecklistRuleDto['severity'],
      scope: r.scope as ChecklistRuleDto['scope'],
      isActive: r.isActive,
      isBuiltin: r.isBuiltin,
      ruleSetId: r.ruleSetId,
      hasLogic: EVALUATOR_KEYS.includes(r.key),
    };
  }

  async listRules(ruleSetId?: string): Promise<ChecklistRuleDto[]> {
    const rules = await this.prisma.checklistRule.findMany({
      where: ruleSetId ? { ruleSetId } : undefined,
      orderBy: [{ scope: 'asc' }, { key: 'asc' }],
    });
    return rules.map((r) => this.toDto(r));
  }

  async createRule(dto: CreateChecklistRuleRequest, user: AuthUser): Promise<ChecklistRuleDto[]> {
    const dup = await this.prisma.checklistRule.findUnique({ where: { key: dto.key } });
    if (dup) throw new BadRequestException(`A rule with key ${dto.key} already exists`);
    const ruleSetId = dto.ruleSetId ?? (await this.defaultRuleSetId());
    await this.prisma.checklistRule.create({
      data: {
        key: dto.key,
        description: dto.description,
        severity: dto.severity,
        scope: dto.scope,
        isBuiltin: false,
        ruleSetId,
      },
    });
    await this.audit.record('ChecklistRule', dto.key, 'CREATE', user.id);
    return this.listRules(dto.ruleSetId);
  }

  async updateRule(
    id: string,
    dto: UpdateChecklistRuleRequest,
    user: AuthUser,
  ): Promise<ChecklistRuleDto[]> {
    const rule = await this.prisma.checklistRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Checklist rule not found');
    await this.prisma.checklistRule.update({
      where: { id },
      data: {
        description: dto.description ?? undefined,
        severity: dto.severity ?? undefined,
        isActive: dto.isActive ?? undefined,
      },
    });
    await this.audit.record('ChecklistRule', rule.key, 'UPDATE', user.id);
    return this.listRules();
  }

  async deleteRule(id: string, user: AuthUser): Promise<ChecklistRuleDto[]> {
    const rule = await this.prisma.checklistRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Checklist rule not found');
    if (rule.isBuiltin) {
      throw new BadRequestException('Built-in rules cannot be deleted — deactivate them instead');
    }
    await this.prisma.checklistRule.delete({ where: { id } });
    await this.audit.record('ChecklistRule', rule.key, 'DELETE', user.id);
    return this.listRules();
  }

  async evaluate(estimateId: string): Promise<ChecklistResult> {
    const est: any = await this.prisma.estimate.findUnique({
      where: { id: estimateId },
      include: { laborItems: true, nonLaborItems: true, cloudItems: true },
    });
    if (!est) throw new NotFoundException('Estimate not found');
    // Evaluate against the default rule set (FR-25).
    const defaultSetId = await this.defaultRuleSetId();
    const rules = await this.prisma.checklistRule.findMany({
      where: { isActive: true, ruleSetId: defaultSetId },
      orderBy: { key: 'asc' },
    });
    const e: ChecklistEstimate = {
      rateCardId: est.rateCardId,
      globalUpchargePercent: Number(est.globalUpchargePercent),
      contingencyPercent: Number(est.contingencyPercent),
      labor: est.laborItems.map((l: any) => ({
        id: l.id,
        rateCardRoleId: l.rateCardRoleId,
        rateSnapshot: l.rateSnapshot.toString(),
        quantity: Number(l.quantity),
        units: Number(l.units),
        billingPeriod: l.billingPeriod,
        resourceName: l.resourceName ?? null,
        allocationPercent: Number(l.allocationPercent),
        startDate: l.startDate ? l.startDate.toISOString().slice(0, 10) : null,
        endDate: l.endDate ? l.endDate.toISOString().slice(0, 10) : null,
      })),
      nonLabor: est.nonLaborItems.map((n: any) => ({
        id: n.id,
        amount: n.amount.toString(),
        billingPeriod: n.billingPeriod,
      })),
      cloud: est.cloudItems.map((c: any) => ({
        id: c.id,
        cloudPriceId: c.cloudPriceId,
        unitPriceSnapshot: c.unitPriceSnapshot.toString(),
        quantity: Number(c.quantity),
        usageHoursPerMonth: Number(c.usageHoursPerMonth),
        region: c.region,
        skuOrInstance: c.skuOrInstance,
        billingPeriod: c.billingPeriod,
      })),
    };
    return evaluateChecklist(
      rules.map((r) => ({
        key: r.key,
        description: r.description,
        severity: r.severity,
        scope: r.scope,
      })),
      e,
    );
  }
}
