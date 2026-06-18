import { z } from 'zod';

// ── Audit trail (FR-11, NFR-11) — read-only, append-only event log ────────────

/** One immutable audit event (who did what to which entity, and when). */
export const AuditEventDto = z.object({
  id: z.string().uuid(),
  entityType: z.string(),
  entityId: z.string(),
  action: z.string(),
  actorId: z.string().uuid().nullable(),
  actorEmail: z.string().nullable(),
  /** UTC ISO timestamp. */
  occurredAt: z.string(),
});
export type AuditEventDto = z.infer<typeof AuditEventDto>;

export const AuditListQuery = z.object({
  /** Free-text match over entity type, action, and entity id. */
  q: z.string().max(200).optional(),
  /** Exact entity-type filter (e.g. "Estimate", "Role", "User"). */
  entityType: z.string().max(80).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});
export type AuditListQuery = z.infer<typeof AuditListQuery>;
