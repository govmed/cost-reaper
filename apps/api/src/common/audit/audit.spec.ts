/**
 * Audit log (FR-11) — contract QA for the read-only viewer: the list query
 * (filters + pagination), the event DTO shape, and the `audit.view` permission.
 */
import { describe, it, expect } from 'vitest';
import {
  AuditListQuery,
  AuditEventDto,
  PermissionKey,
  PERMISSION_KEYS,
  PERMISSIONS,
} from '@cost-reaper/types';

const UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('Audit · list query contract', () => {
  it('AU-01 defaults to page 1, pageSize 50', () => {
    const r = AuditListQuery.parse({});
    expect(r.page).toBe(1);
    expect(r.pageSize).toBe(50);
  });
  it('AU-02 coerces numeric strings (query params)', () => {
    const r = AuditListQuery.parse({ page: '3', pageSize: '25' });
    expect(r.page).toBe(3);
    expect(r.pageSize).toBe(25);
  });
  it('AU-03 accepts a free-text search', () => {
    expect(AuditListQuery.safeParse({ q: 'Estimate' }).success).toBe(true);
  });
  it('AU-04 accepts an entity-type filter', () => {
    expect(AuditListQuery.safeParse({ entityType: 'Role' }).success).toBe(true);
  });
  it('AU-05 rejects page below 1', () => {
    expect(AuditListQuery.safeParse({ page: 0 }).success).toBe(false);
  });
  it('AU-06 rejects pageSize above 200', () => {
    expect(AuditListQuery.safeParse({ pageSize: 500 }).success).toBe(false);
  });
  it('AU-07 rejects pageSize below 1', () => {
    expect(AuditListQuery.safeParse({ pageSize: 0 }).success).toBe(false);
  });
  it('AU-08 rejects a non-integer page', () => {
    expect(AuditListQuery.safeParse({ page: 1.5 }).success).toBe(false);
  });
  it('AU-09 rejects an over-long search string', () => {
    expect(AuditListQuery.safeParse({ q: 'x'.repeat(201) }).success).toBe(false);
  });
  it('AU-10 rejects an over-long entityType', () => {
    expect(AuditListQuery.safeParse({ entityType: 'E'.repeat(81) }).success).toBe(false);
  });
});

describe('Audit · event DTO shape', () => {
  const base = (o: Record<string, unknown> = {}) => ({
    id: UUID,
    entityType: 'Estimate',
    entityId: 'abc',
    action: 'UPDATE',
    actorId: UUID,
    actorEmail: 'admin@example.com',
    occurredAt: '2026-06-17T00:00:00.000Z',
    ...o,
  });
  it('AU-11 accepts a complete event', () => {
    expect(AuditEventDto.safeParse(base()).success).toBe(true);
  });
  it('AU-12 allows a null actor (system / deleted user)', () => {
    expect(AuditEventDto.safeParse(base({ actorId: null, actorEmail: null })).success).toBe(true);
  });
  it('AU-13 rejects a missing action', () => {
    const o = base();
    delete (o as Record<string, unknown>).action;
    expect(AuditEventDto.safeParse(o).success).toBe(false);
  });
  it('AU-14 rejects a non-uuid id', () => {
    expect(AuditEventDto.safeParse(base({ id: 'not-a-uuid' })).success).toBe(false);
  });
});

describe('Audit · permission (FR-30)', () => {
  it('AU-15 audit.view is a valid permission', () => {
    expect(PermissionKey.safeParse('audit.view').success).toBe(true);
  });
  it('AU-16 audit.view is in the permission catalog', () => {
    expect(PERMISSION_KEYS).toContain('audit.view');
    expect(PERMISSIONS.some((p) => p.key === 'audit.view')).toBe(true);
  });
});
