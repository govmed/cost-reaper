import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser, CreateRoleRequest, RoleDto, UpdateRoleRequest } from '@cost-reaper/types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';

/**
 * Data-driven roles & permissions (FR-30). Admins create/modify roles and the
 * permission keys each grants; the PermissionsGuard resolves a caller's role to
 * its permission set here (cached). Built-in roles can't be deleted or recoded.
 */
@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // code → granted permissions, for the guard. Short TTL; cleared on any write.
  private cache: { at: number; map: Map<string, Set<string>> } | null = null;
  private static readonly CACHE_TTL_MS = 30_000;

  private invalidate(): void {
    this.cache = null;
  }

  /** The permission keys an active role grants (cached). Empty for unknown/inactive roles. */
  async permissionsFor(code: string): Promise<Set<string>> {
    if (!this.cache || Date.now() - this.cache.at > RolesService.CACHE_TTL_MS) {
      const rows = await this.prisma.role.findMany({
        where: { isActive: true },
        select: { code: true, permissions: true },
      });
      this.cache = {
        at: Date.now(),
        map: new Map(rows.map((r) => [r.code, new Set(r.permissions)])),
      };
    }
    return this.cache.map.get(code) ?? new Set<string>();
  }

  private async toDto(row: {
    id: string;
    code: string;
    displayName: string;
    description: string | null;
    isActive: boolean;
    isBuiltin: boolean;
    permissions: string[];
    createdAt: Date;
    updatedAt: Date;
  }): Promise<RoleDto> {
    const userCount = await this.prisma.user.count({ where: { role: row.code } });
    return {
      id: row.id,
      code: row.code,
      displayName: row.displayName,
      description: row.description,
      isActive: row.isActive,
      isBuiltin: row.isBuiltin,
      permissions: row.permissions,
      userCount,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async list(): Promise<RoleDto[]> {
    const rows = await this.prisma.role.findMany({
      orderBy: [{ isBuiltin: 'desc' }, { code: 'asc' }],
    });
    return Promise.all(rows.map((r) => this.toDto(r)));
  }

  async create(dto: CreateRoleRequest, user: AuthUser): Promise<RoleDto> {
    const exists = await this.prisma.role.findUnique({ where: { code: dto.code } });
    if (exists) throw new BadRequestException(`A role with code ${dto.code} already exists`);
    const row = await this.prisma.role.create({
      data: {
        code: dto.code,
        displayName: dto.displayName,
        description: dto.description ?? null,
        isBuiltin: false,
        permissions: dto.permissions,
      },
    });
    this.invalidate();
    await this.audit.record('Role', dto.code, 'CREATE', user.id);
    return this.toDto(row);
  }

  async update(id: string, dto: UpdateRoleRequest, user: AuthUser): Promise<RoleDto> {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');
    // Built-in ADMIN keeps the wildcard — never let it be stripped of access.
    const permissions =
      dto.permissions === undefined
        ? undefined
        : role.code === 'ADMIN'
          ? role.permissions
          : dto.permissions;
    const row = await this.prisma.role.update({
      where: { id },
      data: {
        displayName: dto.displayName ?? undefined,
        description: dto.description === undefined ? undefined : dto.description,
        // A built-in role can't be deactivated (would orphan its users).
        isActive: role.isBuiltin ? undefined : (dto.isActive ?? undefined),
        permissions,
      },
    });
    this.invalidate();
    await this.audit.record('Role', role.code, 'UPDATE', user.id);
    return this.toDto(row);
  }

  async remove(id: string, user: AuthUser): Promise<void> {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');
    if (role.isBuiltin) throw new BadRequestException('Built-in roles cannot be deleted');
    const inUse = await this.prisma.user.count({ where: { role: role.code } });
    if (inUse > 0) {
      throw new BadRequestException(
        `Cannot delete a role assigned to ${inUse} user(s); reassign them first.`,
      );
    }
    await this.prisma.role.delete({ where: { id } });
    this.invalidate();
    await this.audit.record('Role', role.code, 'DELETE', user.id);
  }

  /** The set of active role codes (for validating user/transition assignments). */
  async activeCodes(): Promise<Set<string>> {
    const rows = await this.prisma.role.findMany({
      where: { isActive: true },
      select: { code: true },
    });
    return new Set(rows.map((r) => r.code));
  }
}
