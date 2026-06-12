import { SetMetadata } from '@nestjs/common';
import type { Role } from '@cost-reaper/types';

export const ROLES_KEY = 'roles';

/** Restricts a route (or controller) to the given roles (FR-2, NFR-16). */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
