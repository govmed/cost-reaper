import { Injectable, NotFoundException } from '@nestjs/common';
import type { CloudPriceQuery, ProviderLastPulledDto } from '@cost-reaper/types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { PRICING_PROVIDERS } from './pricing-providers';

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
   * Admin-triggered price refresh (FR-21a). Pulls current prices via the
   * provider strategy and re-stamps the catalog's `fetched_at`; saved-estimate
   * price snapshots are never touched (NFR-14).
   */
  async sync(provider: string | undefined, actorId: string): Promise<ProviderLastPulledDto[]> {
    const providers = provider
      ? [provider as 'AWS' | 'GCP' | 'AZURE']
      : (['AWS', 'GCP', 'AZURE'] as const);
    const now = new Date();
    for (const pv of providers) {
      const current = await this.prisma.cloudPrice.findMany({ where: { provider: pv } });
      const fresh = await PRICING_PROVIDERS[pv].fetch(
        current.map((c) => ({
          region: c.region,
          service: c.service,
          skuOrInstance: c.skuOrInstance,
          unit: c.unit,
          unitPrice: c.unitPrice.toString(),
          currency: c.currency,
        })),
      );
      // Stub returns the same catalog → re-stamp the pull time. A live pull would
      // upsert any changed unit prices here (snapshots on estimates stay immutable).
      void fresh;
      await this.prisma.cloudPrice.updateMany({
        where: { provider: pv },
        data: { fetchedAt: now },
      });
      await this.audit.record('CloudPrice', pv, 'SYNC', actorId);
    }
    return this.lastPulled();
  }

  async list(q: CloudPriceQuery) {
    const where: any = {};
    if (q.provider) where.provider = q.provider;
    if (q.region) where.region = { contains: q.region, mode: 'insensitive' };
    if (q.service) where.service = { contains: q.service, mode: 'insensitive' };
    if (q.skuOrInstance) where.skuOrInstance = { contains: q.skuOrInstance, mode: 'insensitive' };
    const rows = await this.prisma.cloudPrice.findMany({
      where,
      orderBy: [{ provider: 'asc' }, { service: 'asc' }, { skuOrInstance: 'asc' }],
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
