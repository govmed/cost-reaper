import { Injectable, NotFoundException } from '@nestjs/common';
import type { CloudPriceQuery, ProviderLastPulledDto } from '@cost-reaper/types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { PRICING_PROVIDERS } from './pricing-providers';
import { type CatalogRow, catalogKey } from './price-mappers';

@Injectable()
export class CloudPricesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Per-provider last-pulled date + count, for the freshness table (FR-21b). */
  async lastPulled(): Promise<ProviderLastPulledDto[]> {
    const rows = await this.prisma.cloudPrice.groupBy({
      by: ['provider'],
      _max: { fetchedAt: true },
      _count: { _all: true },
    });
    return rows
      .map((r: any) => ({
        provider: r.provider,
        lastPulled: r._max.fetchedAt ? r._max.fetchedAt.toISOString() : null,
        priceCount: r._count._all,
      }))
      .sort((a, b) => a.provider.localeCompare(b.provider));
  }

  /**
   * Admin-triggered price refresh (FR-21a). Pulls fresh prices from each
   * provider's pricing source (Azure Retail Prices — no auth; AWS Price List —
   * SigV4, requires credentials; GCP Cloud Billing — requires an API key),
   * updates matched catalog rows' unit price + source, and re-stamps the
   * `fetched_at` "last pulled" time on the rest. Saved-estimate price snapshots
   * are never touched (NFR-14); a provider that's unconfigured or unreachable
   * falls back to the existing catalog.
   */
  async sync(provider: string | undefined, actorId: string): Promise<ProviderLastPulledDto[]> {
    const providers = provider
      ? [provider as 'AWS' | 'GCP' | 'AZURE']
      : (['AWS', 'GCP', 'AZURE'] as const);
    const now = new Date();
    for (const pv of providers) {
      const strategy = PRICING_PROVIDERS[pv];
      // SaaS / catalog-only providers have no live pricing source — skip them.
      if (!strategy) continue;
      const current = await this.prisma.cloudPrice.findMany({ where: { provider: pv } });
      const rows: CatalogRow[] = current.map((c) => ({
        provider: c.provider,
        region: c.region,
        service: c.service,
        skuOrInstance: c.skuOrInstance,
        unit: c.unit,
        unitPrice: c.unitPrice.toString(),
        currency: c.currency,
      }));
      const fresh = await strategy.fetchPrices(rows);

      let refreshed = 0;
      for (const c of current) {
        const newPrice = fresh.get(catalogKey(c));
        const data: { fetchedAt: Date; unitPrice?: string; source?: any; effectiveDate?: Date } = {
          fetchedAt: now,
        };
        if (newPrice) {
          data.source = strategy.source; // this row was confirmed from the live source
          if (newPrice !== c.unitPrice.toString()) {
            data.unitPrice = newPrice;
            data.effectiveDate = now;
            refreshed += 1;
          }
        }
        await this.prisma.cloudPrice.update({ where: { id: c.id }, data });
      }
      await this.audit.record(
        'CloudPrice',
        pv,
        `SYNC:${fresh.size}pulled:${refreshed}changed`,
        actorId,
      );
    }
    return this.lastPulled();
  }

  async list(q: CloudPriceQuery) {
    const where: any = {};
    if (q.provider) where.provider = q.provider;
    if (q.category) where.category = q.category;
    if (q.region) where.region = { contains: q.region, mode: 'insensitive' };
    if (q.service) where.service = { contains: q.service, mode: 'insensitive' };
    if (q.skuOrInstance) where.skuOrInstance = { contains: q.skuOrInstance, mode: 'insensitive' };
    const rows = await this.prisma.cloudPrice.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { provider: 'asc' },
        { service: 'asc' },
        { skuOrInstance: 'asc' },
      ],
    });
    return rows.map((p) => this.toDto(p));
  }

  async get(id: string) {
    const p = await this.prisma.cloudPrice.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Cloud price not found');
    return this.toDto(p);
  }

  private toDto(p: {
    id: string;
    provider: string;
    category: string;
    region: string;
    service: string;
    skuOrInstance: string;
    unit: string;
    unitPrice: { toString(): string };
    currency: string;
    source: string;
    effectiveDate: Date;
  }) {
    return {
      id: p.id,
      provider: p.provider,
      category: p.category,
      region: p.region,
      service: p.service,
      skuOrInstance: p.skuOrInstance,
      unit: p.unit,
      unitPrice: p.unitPrice.toString(),
      currency: p.currency,
      source: p.source,
      effectiveDate: p.effectiveDate.toISOString(),
    };
  }
}
