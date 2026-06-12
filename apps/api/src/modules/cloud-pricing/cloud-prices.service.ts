import { Injectable, NotFoundException } from '@nestjs/common';
import type { CloudPriceQuery } from '@cost-reaper/types';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class CloudPricesService {
  constructor(private readonly prisma: PrismaService) {}

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
