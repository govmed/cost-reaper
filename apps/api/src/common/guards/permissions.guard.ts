import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthUser, PermissionKey } from '@cost-reaper/types';
import { WILDCARD_PERMISSION } from '@cost-reaper/types';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { RolesService } from '../../modules/roles/roles.service';

/**
 * Permission-based RBAC (FR-30, NFR-16). Deny-by-default: a route annotated with
 * @RequirePermission(...) is allowed only if the caller's role grants every
 * listed permission. The caller's permissions are resolved from the data-driven
 * `roles` table (cached); the built-in ADMIN role holds the wildcard.
 * Routes with no @RequirePermission are open to any authenticated user (reads).
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly roles: RolesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<PermissionKey[] | undefined>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = req.user;
    if (!user) throw new ForbiddenException('Not authenticated');

    const granted = await this.roles.permissionsFor(user.role);
    if (granted.has(WILDCARD_PERMISSION)) return true;
    if (!required.every((p) => granted.has(p))) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}
