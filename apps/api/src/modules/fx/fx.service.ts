import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import type { AuthUser, FxRateDto, UpdateFxRateRequest } from '@cost-reaper/types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { mapFxRates } from './fx-rates.mapper';

/** Public, no-auth FX source. Frankfurter (ECB data) returns foreign-per-USD. */
const FX_ENDPOINT = process.env.FX_RATES_ENDPOINT ?? 'https://api.frankfurter.app/latest';

/** Pull foreign-per-USD rates for the given currencies; null on any failure. */
async function fetchForeignPerUsd(currencies: string[]): Promise<Record<string, number> | null> {
  const symbols = [...new Set(currencies.filter((c) => c !== 'USD'))];
  if (symbols.length === 0) return {};
  const url = `${FX_ENDPOINT}?from=USD&symbols=${symbols.join(',')}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const json = (await res.json()) as { rates?: Record<string, number> };
    return json.rates ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** FX rates for multi-currency roll-ups (FR-17). Rate = base (USD) units per 1 of `currency`. */
@Injectable()
export class FxService {
  private readonly logger = new Logger(FxService.name);

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

  /**
   * Refresh all tracked non-USD rates from the public FX source (FR-17), re-stamping
   * `updatedAt`/`updatedByEmail`. On any network failure the catalog is left unchanged
   * (graceful fallback) and the current list is returned.
   */
  async refresh(user: AuthUser): Promise<FxRateDto[]> {
    const existing = await this.prisma.fxRate.findMany();
    const currencies = existing.map((r) => r.currency);
    const foreignPerUsd = await fetchForeignPerUsd(currencies);
    if (!foreignPerUsd) {
      this.logger.warn('FX refresh: source unavailable; rates left unchanged');
      return this.list();
    }
    const fresh = mapFxRates(foreignPerUsd, currencies);
    for (const [cur, rateToBase] of fresh) {
      await this.prisma.fxRate.update({
        where: { currency: cur },
        data: { rateToBase, updatedByEmail: user.email },
      });
    }
    await this.audit.record('FxRate', 'ALL', `REFRESH:${fresh.size}updated`, user.id);
    return this.list();
  }
}
