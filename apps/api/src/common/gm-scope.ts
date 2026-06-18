/**
 * GM (General Manager) visibility scope (FR-2/FR-24). A GM is an approver, so
 * their estimate views are limited to their review queue — the estimates that
 * are awaiting review or already approved. Centralised here so the estimates
 * list, the dashboard, and stage drill-downs all enforce the same rule, and so
 * the rule is pure + unit-testable.
 */

/** Workflow stage keys a GM may see. */
export const GM_VISIBLE_STAGE_KEYS = ['IN_REVIEW', 'APPROVED'] as const;

type RoleHolder = { role?: string | null } | null | undefined;

/** True when this user's estimate visibility is limited to the GM queue. */
export function isGmScoped(user: RoleHolder): boolean {
  return user?.role === 'GM';
}

/**
 * A Prisma `where` fragment that scopes estimates to the GM queue, or `{}` for
 * everyone else (no restriction). Spread/merge it into an estimate query's where.
 */
export function gmStageWhere(user: RoleHolder): Record<string, unknown> {
  return isGmScoped(user) ? { currentStage: { key: { in: [...GM_VISIBLE_STAGE_KEYS] } } } : {};
}

/** Whether a user may view a given stage's drill-down — a GM only their queue. */
export function gmCanViewStage(user: RoleHolder, stageKey: string): boolean {
  return !isGmScoped(user) || (GM_VISIBLE_STAGE_KEYS as readonly string[]).includes(stageKey);
}
