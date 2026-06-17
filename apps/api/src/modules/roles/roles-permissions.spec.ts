/**
 * Roles & permissions card — FR-30 contract QA. Covers the permission catalog,
 * the RoleCode format, and the role create/update contracts the admin Roles
 * editor posts. Pure (no DB) — runs in the standard build gate.
 */
import { describe, it, expect } from 'vitest';
import {
  CreateRoleRequest,
  UpdateRoleRequest,
  PermissionKey,
  PERMISSION_KEYS,
  PERMISSIONS,
  RoleCode,
  WILDCARD_PERMISSION,
} from '@cost-reaper/types';

const role = (o: Record<string, unknown> = {}) => ({
  code: 'REVIEWER',
  displayName: 'Reviewer',
  ...o,
});
const cOk = (o: Record<string, unknown>) => CreateRoleRequest.safeParse(o).success;

describe('FR-30 · permission catalog', () => {
  it('TC-01 the wildcard permission is "*"', () => {
    expect(WILDCARD_PERMISSION).toBe('*');
  });
  it('TC-02 estimate.author is a valid permission', () => {
    expect(PermissionKey.safeParse('estimate.author').success).toBe(true);
  });
  it('TC-03 roles.manage is a valid permission', () => {
    expect(PermissionKey.safeParse('roles.manage').success).toBe(true);
  });
  it('TC-04 users.manage is a valid permission', () => {
    expect(PermissionKey.safeParse('users.manage').success).toBe(true);
  });
  it('TC-05 an unknown permission is rejected', () => {
    expect(PermissionKey.safeParse('estimate.delete').success).toBe(false);
  });
  it('TC-06 the wildcard is NOT a catalog permission key', () => {
    expect(PermissionKey.safeParse('*').success).toBe(false);
  });
  it('TC-07 the catalog covers every permission key', () => {
    expect([...PERMISSIONS.map((p) => p.key)].sort()).toEqual([...PERMISSION_KEYS].sort());
  });
  it('TC-08 every catalog entry has a label, description, and group', () => {
    for (const p of PERMISSIONS) {
      expect(p.label.length).toBeGreaterThan(0);
      expect(p.description.length).toBeGreaterThan(0);
      expect(p.group.length).toBeGreaterThan(0);
    }
  });
  it('TC-09 there are no duplicate permission keys', () => {
    expect(new Set(PERMISSION_KEYS).size).toBe(PERMISSION_KEYS.length);
  });
  it('TC-10 the catalog includes the workflow.advance permission', () => {
    expect(PERMISSION_KEYS).toContain('workflow.advance');
  });
});

describe('FR-30 · RoleCode format', () => {
  it('TC-11 accepts UPPER_SNAKE', () => {
    expect(RoleCode.safeParse('REVIEWER').success).toBe(true);
  });
  it('TC-12 accepts digits and underscores', () => {
    expect(RoleCode.safeParse('TIER_2_LEAD').success).toBe(true);
  });
  it('TC-13 accepts the built-in codes', () => {
    for (const c of ['ADMIN', 'GM', 'ESTIMATOR', 'VIEWER'])
      expect(RoleCode.safeParse(c).success).toBe(true);
  });
  it('TC-14 rejects lowercase', () => {
    expect(RoleCode.safeParse('reviewer').success).toBe(false);
  });
  it('TC-15 rejects a hyphen', () => {
    expect(RoleCode.safeParse('SR-DEV').success).toBe(false);
  });
  it('TC-16 rejects a space', () => {
    expect(RoleCode.safeParse('SR DEV').success).toBe(false);
  });
  it('TC-17 rejects a leading digit', () => {
    expect(RoleCode.safeParse('1ADMIN').success).toBe(false);
  });
  it('TC-18 rejects empty', () => {
    expect(RoleCode.safeParse('').success).toBe(false);
  });
  it('TC-19 rejects over 40 chars', () => {
    expect(RoleCode.safeParse('A'.repeat(41)).success).toBe(false);
  });
});

describe('FR-30 · create role contract', () => {
  it('TC-20 a minimal role is valid', () => {
    expect(cOk(role())).toBe(true);
  });
  it('TC-21 permissions default to an empty array', () => {
    expect(CreateRoleRequest.parse(role()).permissions).toEqual([]);
  });
  it('TC-22 accepts a set of valid permissions', () => {
    expect(cOk(role({ permissions: ['estimate.author', 'workflow.advance'] }))).toBe(true);
  });
  it('TC-23 accepts a description', () => {
    expect(cOk(role({ description: 'Reviews submissions' }))).toBe(true);
  });
  it('TC-24 rejects a malformed code', () => {
    expect(cOk(role({ code: 'reviewer' }))).toBe(false);
  });
  it('TC-25 rejects an empty display name', () => {
    expect(cOk(role({ displayName: '' }))).toBe(false);
  });
  it('TC-26 rejects an unknown permission', () => {
    expect(cOk(role({ permissions: ['estimate.author', 'do.anything'] }))).toBe(false);
  });
  it('TC-27 rejects the wildcard as an assignable permission (built-in only)', () => {
    expect(cOk(role({ permissions: ['*'] }))).toBe(false);
  });
  it('TC-28 rejects a display name over 80 chars', () => {
    expect(cOk(role({ displayName: 'n'.repeat(81) }))).toBe(false);
  });
});

describe('FR-30 · update role contract', () => {
  it('TC-29 an empty update is valid', () => {
    expect(UpdateRoleRequest.safeParse({}).success).toBe(true);
  });
  it('TC-30 may set permissions', () => {
    expect(UpdateRoleRequest.safeParse({ permissions: ['sow.author'] }).success).toBe(true);
  });
  it('TC-31 may set an empty permission set (revoke all)', () => {
    expect(UpdateRoleRequest.safeParse({ permissions: [] }).success).toBe(true);
  });
  it('TC-32 may deactivate', () => {
    expect(UpdateRoleRequest.safeParse({ isActive: false }).success).toBe(true);
  });
  it('TC-33 may rename', () => {
    expect(UpdateRoleRequest.safeParse({ displayName: 'Senior Reviewer' }).success).toBe(true);
  });
  it('TC-34 may clear the description with null', () => {
    expect(UpdateRoleRequest.safeParse({ description: null }).success).toBe(true);
  });
  it('TC-35 rejects an unknown permission on update', () => {
    expect(UpdateRoleRequest.safeParse({ permissions: ['nope'] }).success).toBe(false);
  });
  it('TC-36 rejects an empty display name on update', () => {
    expect(UpdateRoleRequest.safeParse({ displayName: '' }).success).toBe(false);
  });
});
