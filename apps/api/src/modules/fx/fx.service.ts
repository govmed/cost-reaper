import { BadRequestException, Injectable } from '@nestjs/common';
import type { AuthUser, FxRateDto, UpdateFxRateRequest } from '@cost-reaper/types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';

/** FX rates for multi-currency roll-ups (FR-17). Rate = base (USD) units per 1 of `currency`. */
@Injectable()
export class FxService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(): Promise<FxRateDto[]> {
    const rows = await this.prisma.fxRate.findMany({ orderBy: { currency: 'asc' } });
    return rows.map((r) => ({
      currency: r.currency,
      rateToBase: r.rateToBase.toString(),
      updatedByEmail: r.updatedByEmail,
      updatedAt: r.updatedAt.toISOString(),
    }));
  }

  async upsert(currency: string, dto: UpdateFxRateRequest, user: AuthUser): Promise<FxRateDto[]> {
    const cur = currency.toUpperCase();
    if (!/^[A-Z]{3}$/.test(cur)) {
      throw new BadRequestException('Currency must be a 3-letter ISO code');
    }
    await this.prisma.fxRate.upsert({
      where: { currency: cur },
      update: { rateToBase: dto.rateToBase, updatedByEmail: user.email },
      create: { currency: cur, rateToBase: dto.rateToBase, updatedByEmail: user.email },
    });
    await this.audit.record('FxRate', cur, 'UPDATE', user.id);
    return this.list();
  }
}
