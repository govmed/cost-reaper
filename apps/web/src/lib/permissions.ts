import type { AuthUser } from './types';

/**
 * Whether the signed-in user may author estimates (create/edit estimates, line
 * items, and supporting documents) — FR-30. Uses the role's permission set when
 * present (wildcard `*` = Admin); falls back to the built-in roles for sessions
 * created before permissions were added to the login response. A GM/Viewer
 * cannot author. The server is the source of truth and enforces this too.
 */
export function canAuthorEstimates(user: AuthUser | null | undefined): boolean {
  const perms = user?.permissions;
  if (perms && perms.length) return perms.some((p) => p === '*' || p === 'estimate.author');
  return user?.role === 'ADMIN' || user?.role === 'ESTIMATOR';
}
