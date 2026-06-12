import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Records create/modify actions on governed entities (FR-11). */
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
}
