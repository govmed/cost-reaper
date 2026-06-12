import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  CreateReferenceTypeRequest,
  CreateReferenceValueRequest,
  ReferenceTypeDto,
  ReferenceValueDto,
  UpdateReferenceValueRequest,
} from '@cost-reaper/types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { buildReferenceTree, toReferenceValueDto } from './reference-tree';

/**
 * Reference-data platform (FR-29, NFR-17). Serves every configurable lookup
 * dynamically from `reference_type` / `reference_value` so labels, ordering,
 * and active flags are data, not code. Values are resolved by `code`.
 */
@Injectable()
export class ReferenceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Short-lived cache of active codes/names per type, so validation isn't a per-request query (NFR-1). */
  private readonly cache = new Map<
    string,
    { codes: Set<string>; names: Set<string>; at: number }
  >();
  private static readonly CACHE_TTL_MS = 60_000;

  private async loadActive(typeCode: string): Promise<{ codes: Set<string>; names: Set<string> }> {
    const hit = this.cache.get(typeCode);
    if (hit && Date.now() - hit.at < ReferenceService.CACHE_TTL_MS) return hit;
    const type = await this.prisma.referenceType.findUnique({
      where: { code: typeCode },
      select: { id: true },
    });
    const rows = type
      ? await this.prisma.referenceValue.findMany({
          where: { referenceTypeId: type.id, isActive: true },
          select: { code: true, displayName: true },
        })
      : [];
    const entry = {
      codes: new Set(rows.map((r) => r.code)),
      names: new Set(rows.map((r) => r.displayName)),
      at: Date.now(),
    };
    this.cache.set(typeCode, entry);
    return entry;
  }

  /** The active value codes for a reference type (cached). Empty set if the type is unknown. */
  async getActiveCodes(typeCode: string): Promise<Set<string>> {
    return (await this.loadActive(typeCode)).codes;
  }

  /** The active value display names for a reference type (cached). */
  async getActiveDisplayNames(typeCode: string): Promise<Set<string>> {
    return (await this.loadActive(typeCode)).names;
  }

  /** Throw unless `code` is an active value of `typeCode` — deny-by-default validation (FR-29). */
  async assertActiveCode(typeCode: string, code: string): Promise<void> {
    if (!(await this.getActiveCodes(typeCode)).has(code)) {
      throw new BadRequestException(`'${code}' is not an active ${typeCode} value`);
    }
  }

  /** Throw unless `name` is an active display name of `typeCode` (used for governed labels, FR-29). */
  async assertActiveDisplayName(typeCode: string, name: string): Promise<void> {
    if (!(await this.getActiveDisplayNames(typeCode)).has(name)) {
      throw new BadRequestException(`'${name}' is not an active ${typeCode} value`);
    }
  }

  async listTypes(): Promise<ReferenceTypeDto[]> {
    const types = await this.prisma.referenceType.findMany({
      orderBy: [{ displayOrder: 'asc' }, { code: 'asc' }],
      include: { _count: { select: { values: true } } },
    });
    return types.map((t: any) => ({
      id: t.id,
      code: t.code,
      displayName: t.displayName,
      description: t.description,
      displayOrder: t.displayOrder,
      isActive: t.isActive,
      valueCount: t._count.values,
    }));
  }

  /** Active (or all) values for a type, ordered by displayOrder, nested by parent. */
  async getValues(typeCode: string, includeInactive = false): Promise<ReferenceValueDto[]> {
    const type = await this.prisma.referenceType.findUnique({ where: { code: typeCode } });
    if (!type) throw new NotFoundException(`Unknown reference type '${typeCode}'`);
    const where: any = { referenceTypeId: type.id };
    if (!includeInactive) where.isActive = true;
    const rows = await this.prisma.referenceValue.findMany({
      where,
      orderBy: [{ displayOrder: 'asc' }, { code: 'asc' }],
    });
    return buildReferenceTree(rows);
  }

  async createType(dto: CreateReferenceTypeRequest, actorId: string): Promise<ReferenceTypeDto> {
    const existing = await this.prisma.referenceType.findUnique({ where: { code: dto.code } });
    if (existing) throw new BadRequestException(`Reference type '${dto.code}' already exists`);
    const t = await this.prisma.referenceType.create({
      data: {
        code: dto.code,
        displayName: dto.displayName,
        description: dto.description ?? null,
        displayOrder: dto.displayOrder,
        createdById: actorId,
        updatedById: actorId,
      },
    });
    await this.audit.record('ReferenceType', t.id, 'CREATE', actorId);
    return {
      id: t.id,
      code: t.code,
      displayName: t.displayName,
      description: t.description,
      displayOrder: t.displayOrder,
      isActive: t.isActive,
      valueCount: 0,
    };
  }

  async createValue(
    typeCode: string,
    dto: CreateReferenceValueRequest,
    actorId: string,
  ): Promise<ReferenceValueDto> {
    const type = await this.prisma.referenceType.findUnique({ where: { code: typeCode } });
    if (!type) throw new NotFoundException(`Unknown reference type '${typeCode}'`);
    if (dto.parentId) await this.assertParent(dto.parentId, type.id);

    const dup = await this.prisma.referenceValue.findUnique({
      where: { referenceTypeId_code: { referenceTypeId: type.id, code: dto.code } },
    });
    if (dup) throw new BadRequestException(`'${dto.code}' already exists for ${typeCode}`);

    const v = await this.prisma.referenceValue.create({
      data: {
        referenceTypeId: type.id,
        parentId: dto.parentId ?? null,
        code: dto.code,
        displayName: dto.displayName,
        description: dto.description ?? null,
        displayOrder: dto.displayOrder,
        metadataJson: dto.metadata == null ? undefined : (dto.metadata as Prisma.InputJsonValue),
        createdById: actorId,
        updatedById: actorId,
      },
    });
    await this.audit.record('ReferenceValue', v.id, 'CREATE', actorId);
    this.cache.clear();
    return toReferenceValueDto(v);
  }

  async updateValue(
    id: string,
    dto: UpdateReferenceValueRequest,
    actorId: string,
  ): Promise<ReferenceValueDto> {
    const current = await this.prisma.referenceValue.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Reference value not found');
    if (dto.parentId) {
      if (dto.parentId === id) throw new BadRequestException('A value cannot be its own parent');
      await this.assertParent(dto.parentId, current.referenceTypeId);
    }
    const v = await this.prisma.referenceValue.update({
      where: { id },
      data: {
        displayName: dto.displayName,
        description: dto.description,
        displayOrder: dto.displayOrder,
        isActive: dto.isActive,
        parentId: dto.parentId === undefined ? undefined : dto.parentId,
        metadataJson:
          dto.metadata === undefined
            ? undefined
            : dto.metadata === null
              ? Prisma.DbNull
              : (dto.metadata as Prisma.InputJsonValue),
        updatedById: actorId,
      },
    });
    await this.audit.record('ReferenceValue', v.id, 'UPDATE', actorId);
    this.cache.clear();
    return toReferenceValueDto(v);
  }

  async deleteValue(id: string, actorId: string): Promise<void> {
    const v = await this.prisma.referenceValue.findUnique({ where: { id } });
    if (!v) throw new NotFoundException('Reference value not found');
    if (v.isBuiltin) {
      throw new BadRequestException('Built-in values cannot be deleted; deactivate them instead');
    }
    const childCount = await this.prisma.referenceValue.count({ where: { parentId: id } });
    if (childCount > 0) {
      throw new BadRequestException('Remove or reparent child values before deleting this value');
    }
    await this.prisma.referenceValue.delete({ where: { id } });
    await this.audit.record('ReferenceValue', id, 'DELETE', actorId);
    this.cache.clear();
  }

  // ── internals ───────────────────────────────────────────────────────────────

  private async assertParent(parentId: string, referenceTypeId: string): Promise<void> {
    const parent = await this.prisma.referenceValue.findUnique({ where: { id: parentId } });
    if (!parent || parent.referenceTypeId !== referenceTypeId) {
      throw new BadRequestException('Parent must be a value of the same reference type');
    }
  }
}
