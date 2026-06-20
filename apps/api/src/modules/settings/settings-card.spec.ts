/**
 * Settings card — QA for the admin-configurable document upload limit
 * (FR-26/NFR-16) and its permission. Pure contract tests (no DB/HTTP).
 */
import { describe, it, expect } from 'vitest';
import {
  DocumentUploadLimitDto,
  UpdateDocumentUploadLimitRequest,
  DOCUMENT_UPLOAD_MAX_MB,
  DOCUMENT_UPLOAD_DEFAULT_MB,
  MAX_DOCUMENT_BYTES,
  PERMISSION_KEYS,
  PERMISSIONS,
  WILDCARD_PERMISSION,
} from '@cost-reaper/types';

describe('Settings · upload-limit constants', () => {
  it('ST-01 the hard ceiling is 100 MB', () => {
    expect(DOCUMENT_UPLOAD_MAX_MB).toBe(100);
  });
  it('ST-02 the default limit is 100 MB', () => {
    expect(DOCUMENT_UPLOAD_DEFAULT_MB).toBe(100);
  });
  it('ST-03 MAX_DOCUMENT_BYTES is 100 MB in bytes', () => {
    expect(MAX_DOCUMENT_BYTES).toBe(100 * 1024 * 1024);
  });
  it('ST-04 MAX_DOCUMENT_BYTES equals the hard ceiling in bytes', () => {
    expect(MAX_DOCUMENT_BYTES).toBe(DOCUMENT_UPLOAD_MAX_MB * 1024 * 1024);
  });
});

describe('Settings · update-limit request', () => {
  const ok = (mb: unknown) =>
    UpdateDocumentUploadLimitRequest.safeParse({ maxUploadMb: mb }).success;
  it('ST-05 accepts 100 (the ceiling)', () => expect(ok(100)).toBe(true));
  it('ST-06 accepts 1 (the floor)', () => expect(ok(1)).toBe(true));
  it('ST-07 accepts a mid value (25)', () => expect(ok(25)).toBe(true));
  it('ST-08 rejects 0', () => expect(ok(0)).toBe(false));
  it('ST-09 rejects a negative', () => expect(ok(-5)).toBe(false));
  it('ST-10 rejects above the ceiling (101)', () => expect(ok(101)).toBe(false));
  it('ST-11 rejects a large value (1000)', () => expect(ok(1000)).toBe(false));
  it('ST-12 rejects a non-integer (1.5)', () => expect(ok(1.5)).toBe(false));
  it('ST-13 rejects a string', () => expect(ok('50')).toBe(false));
  it('ST-14 rejects a missing field', () => {
    expect(UpdateDocumentUploadLimitRequest.safeParse({}).success).toBe(false);
  });
  it('ST-15 ignores extra keys (strips them)', () => {
    const r = UpdateDocumentUploadLimitRequest.parse({ maxUploadMb: 10, foo: 1 } as Record<
      string,
      unknown
    >);
    expect('foo' in r).toBe(false);
    expect(r.maxUploadMb).toBe(10);
  });
});

describe('Settings · upload-limit DTO', () => {
  const ok = (mb: unknown) => DocumentUploadLimitDto.safeParse({ maxUploadMb: mb }).success;
  it('ST-16 accepts a valid limit', () => expect(ok(100)).toBe(true));
  it('ST-17 rejects 0', () => expect(ok(0)).toBe(false));
  it('ST-18 rejects above the ceiling', () => expect(ok(200)).toBe(false));
  it('ST-19 rejects a non-integer', () => expect(ok(12.34)).toBe(false));
  it('ST-20 rejects a missing field', () => {
    expect(DocumentUploadLimitDto.safeParse({}).success).toBe(false);
  });
});

describe('Settings · settings.manage permission (FR-30)', () => {
  it('ST-21 settings.manage is a catalog permission key', () => {
    expect(PERMISSION_KEYS).toContain('settings.manage');
  });
  it('ST-22 settings.manage has a catalog entry', () => {
    expect(PERMISSIONS.some((p) => p.key === 'settings.manage')).toBe(true);
  });
  it('ST-23 settings.manage is grouped under Administration', () => {
    const meta = PERMISSIONS.find((p) => p.key === 'settings.manage');
    expect(meta?.group).toBe('Administration');
    expect((meta?.label.length ?? 0) > 0).toBe(true);
    expect((meta?.description.length ?? 0) > 0).toBe(true);
  });
  it('ST-24 the wildcard is not settings.manage', () => {
    expect(WILDCARD_PERMISSION).not.toBe('settings.manage');
  });
});
