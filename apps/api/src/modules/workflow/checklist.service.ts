import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type {
  AuthUser,
  ChecklistResult,
  ChecklistRuleDto,
  CreateChecklistRuleRequest,
  UpdateChecklistRuleRequest,
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

  // ── Authoring (FR-25, admin) ───────────────────────────────────────────────

  private toDto(r: {
    id: string;
    key: string;
    description: string;
    severity: string;
    scope: string;
    isActive: boolean;
    isBuiltin: boolean;
  }): ChecklistRuleDto {
    return {
      id: r.id,
      key: r.key,
      description: r.description,
      severity: r.severity as ChecklistRuleDto['severity'],
      scope: r.scope as ChecklistRuleDto['scope'],
      isActive: r.isActive,
      isBuiltin: r.isBuiltin,
      hasLogic: EVALUATOR_KEYS.includes(r.key),
    };
  }

  async listRules(): Promise<ChecklistRuleDto[]> {
    const rules = await this.prisma.checklistRule.findMany({
      orderBy: [{ scope: 'asc' }, { key: 'asc' }],
    });
    return rules.map((r) => this.toDto(r));
  }

  async createRule(dto: CreateChecklistRuleRequest, user: AuthUser): Promise<ChecklistRuleDto[]> {
    const dup = await this.prisma.checklistRule.findUnique({ where: { key: dto.key } });
    if (dup) throw new BadRequestException(`A rule with key ${dto.key} already exists`);
    await this.prisma.checklistRule.create({
      data: {
        key: dto.key,
        description: dto.description,
        severity: dto.severity,
        scope: dto.scope,
        isBuiltin: false,
      },
    });
    await this.audit.record('ChecklistRule', dto.key, 'CREATE', user.id);
    return this.listRules();
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
    const rules = await this.prisma.checklistRule.findMany({
      where: { isActive: true },
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
