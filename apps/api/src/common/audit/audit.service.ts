import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuditEventDto, AuditListQuery, Page } from '@cost-reaper/types';
import { PrismaService } from '../prisma/prisma.service';

/** Records and reads create/modify actions on governed entities (FR-11). */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(
    entityType: string,
    entityId: string,
    action: string,
    actorId?: string | null,
  ): Promise<void> {
    await this.prisma.auditEvent.create({
      data: { entityType, entityId, action, actorId: actorId ?? null },
    });
  }

  /** Read-only, paginated view of the immutable audit trail (newest first). */
  async list(query: AuditListQuery): Promise<Page<AuditEventDto>> {
    const where: Prisma.AuditEventWhereInput = {};
    if (query.entityType) where.entityType = query.entityType;
    if (query.q) {
      const contains = { contains: query.q, mode: 'insensitive' as const };
      where.OR = [{ entityType: contains }, { action: contains }, { entityId: contains }];
    }
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.auditEvent.findMany({
        where,
        include: { actor: { select: { email: true } } },
        orderBy: { occurredAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.auditEvent.count({ where }),
    ]);
    return {
      data: rows.map((r) => ({
        id: r.id,
        entityType: r.entityType,
        entityId: r.entityId,
        action: r.action,
        actorId: r.actorId,
        actorEmail: r.actor?.email ?? null,
        occurredAt: r.occurredAt.toISOString(),
      })),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  /** Distinct entity types present in the trail — for the viewer's filter dropdown. */
  async entityTypes(): Promise<string[]> {
    const rows = await this.prisma.auditEvent.findMany({
      distinct: ['entityType'],
      select: { entityType: true },
      orderBy: { entityType: 'asc' },
    });
    return rows.map((r) => r.entityType);
  }
}
