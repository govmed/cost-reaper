import { SetMetadata } from '@nestjs/common';
import type { PermissionKey } from '@cost-reaper/types';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Gates a route (or controller) by permission (FR-30, NFR-16). The caller's role
 * must grant every listed permission (the built-in ADMIN role holds the wildcard
 * and so passes any check). Resolved server-side by the PermissionsGuard.
 */
export const RequirePermission = (...permissions: PermissionKey[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
