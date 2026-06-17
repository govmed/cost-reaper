/**
 * Users & Roles cards — identity/RBAC QA (FR-1, FR-2, FR-26, NFR-16). 52 cases
 * against the auth contracts (`CreateUserRequest`, `UpdateUserRequest`,
 * `LoginRequest`, `RegisterRequest`) and the `Role` enum (incl. the GM role).
 */
import { describe, it, expect } from 'vitest';
import {
  CreateUserRequest,
  UpdateUserRequest,
  LoginRequest,
  RegisterRequest,
  Role,
} from '@cost-reaper/types';

const user = (o: Record<string, unknown> = {}) => ({
  email: 'a@b.com',
  password: 'password1',
  ...o,
});
const cOk = (o: Record<string, unknown>) => CreateUserRequest.safeParse(o).success;
const uOk = (o: Record<string, unknown>) => UpdateUserRequest.safeParse(o).success;

describe('Roles · the Role enum (FR-2, FR-26)', () => {
  it('TC-01 ADMIN is a valid role', () => {
    expect(Role.safeParse('ADMIN').success).toBe(true);
  });
  it('TC-02 ESTIMATOR is a valid role', () => {
    expect(Role.safeParse('ESTIMATOR').success).toBe(true);
  });
  it('TC-03 VIEWER is a valid role', () => {
    expect(Role.safeParse('VIEWER').success).toBe(true);
  });
  it('TC-04 GM is a valid role (the approver role)', () => {
    expect(Role.safeParse('GM').success).toBe(true);
  });
  it('TC-05 the enum has exactly the four known roles', () => {
    expect([...Role.options].sort()).toEqual(['ADMIN', 'ESTIMATOR', 'GM', 'VIEWER']);
  });
  it('TC-06 an unknown role is rejected', () => {
    expect(Role.safeParse('SUPERUSER').success).toBe(false);
  });
  it('TC-07 a lowercase role is rejected', () => {
    expect(Role.safeParse('admin').success).toBe(false);
  });
  it('TC-08 an empty role is rejected', () => {
    expect(Role.safeParse('').success).toBe(false);
  });
});

describe('Users · create contract — valid + defaults', () => {
  it('TC-09 minimal create (email + password) is valid', () => {
    expect(cOk(user())).toBe(true);
  });
  it('TC-10 role defaults to ESTIMATOR', () => {
    expect(CreateUserRequest.parse(user()).role).toBe('ESTIMATOR');
  });
  it('TC-11 create an ADMIN', () => {
    expect(cOk(user({ role: 'ADMIN' }))).toBe(true);
  });
  it('TC-12 create a GM', () => {
    expect(cOk(user({ role: 'GM' }))).toBe(true);
  });
  it('TC-13 create a VIEWER', () => {
    expect(cOk(user({ role: 'VIEWER' }))).toBe(true);
  });
  it('TC-14 accepts a display name', () => {
    expect(cOk(user({ displayName: 'Ada Lovelace' }))).toBe(true);
  });
  it('TC-15 accepts an exactly-8-char password', () => {
    expect(cOk(user({ password: '12345678' }))).toBe(true);
  });
  it('TC-16 accepts a 120-char display name', () => {
    expect(cOk(user({ displayName: 'n'.repeat(120) }))).toBe(true);
  });
  it('TC-17 accepts a plus-addressed email', () => {
    expect(cOk(user({ email: 'ada+test@example.co.uk' }))).toBe(true);
  });
});

describe('Users · create contract — rejected', () => {
  it('TC-18 rejects a missing email', () => {
    expect(CreateUserRequest.safeParse({ password: 'password1' }).success).toBe(false);
  });
  it('TC-19 rejects an invalid email', () => {
    expect(cOk(user({ email: 'not-an-email' }))).toBe(false);
  });
  it('TC-20 rejects a missing password', () => {
    expect(CreateUserRequest.safeParse({ email: 'a@b.com' }).success).toBe(false);
  });
  it('TC-21 rejects a password under 8 chars', () => {
    expect(cOk(user({ password: 'short7!' }))).toBe(false);
  });
  it('TC-22 rejects a malformed role code (membership is validated server-side, FR-30)', () => {
    expect(cOk(user({ role: 'bad role' }))).toBe(false);
  });
  it('TC-23 rejects an empty display name', () => {
    expect(cOk(user({ displayName: '' }))).toBe(false);
  });
  it('TC-24 rejects a display name over 120 chars', () => {
    expect(cOk(user({ displayName: 'n'.repeat(121) }))).toBe(false);
  });
  it('TC-25 rejects an email without a domain', () => {
    expect(cOk(user({ email: 'ada@' }))).toBe(false);
  });
});

describe('Users · update contract (admin edits, FR-26)', () => {
  it('TC-26 an empty update is valid', () => {
    expect(uOk({})).toBe(true);
  });
  it('TC-27 change role to ADMIN', () => {
    expect(uOk({ role: 'ADMIN' })).toBe(true);
  });
  it('TC-28 change role to GM', () => {
    expect(uOk({ role: 'GM' })).toBe(true);
  });
  it('TC-29 change role to VIEWER', () => {
    expect(uOk({ role: 'VIEWER' })).toBe(true);
  });
  it('TC-30 deactivate an account', () => {
    expect(uOk({ isActive: false })).toBe(true);
  });
  it('TC-31 reactivate an account', () => {
    expect(uOk({ isActive: true })).toBe(true);
  });
  it('TC-32 rename the display name', () => {
    expect(uOk({ displayName: 'New Name' })).toBe(true);
  });
  it('TC-33 change role and active together', () => {
    expect(uOk({ role: 'GM', isActive: true })).toBe(true);
  });
  it('TC-34 rejects a malformed role code on update (membership server-side, FR-30)', () => {
    expect(uOk({ role: 'bad-role' })).toBe(false);
  });
  it('TC-35 rejects an empty display name on update', () => {
    expect(uOk({ displayName: '' })).toBe(false);
  });
  it('TC-36 rejects a non-boolean isActive', () => {
    expect(uOk({ isActive: 'yes' })).toBe(false);
  });
});

describe('Auth · login contract (FR-1)', () => {
  it('TC-37 valid login', () => {
    expect(LoginRequest.safeParse({ email: 'a@b.com', password: 'x' }).success).toBe(true);
  });
  it('TC-38 rejects a missing password', () => {
    expect(LoginRequest.safeParse({ email: 'a@b.com' }).success).toBe(false);
  });
  it('TC-39 rejects an empty password', () => {
    expect(LoginRequest.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false);
  });
  it('TC-40 rejects an invalid email', () => {
    expect(LoginRequest.safeParse({ email: 'nope', password: 'x' }).success).toBe(false);
  });
  it('TC-41 login does not enforce the 8-char min (that is for sign-up)', () => {
    expect(LoginRequest.safeParse({ email: 'a@b.com', password: '1' }).success).toBe(true);
  });
});

describe('Auth · self-registration contract (FR-1)', () => {
  it('TC-42 valid registration', () => {
    expect(RegisterRequest.safeParse({ email: 'a@b.com', password: 'password1' }).success).toBe(
      true,
    );
  });
  it('TC-43 accepts an optional display name', () => {
    expect(
      RegisterRequest.safeParse({ email: 'a@b.com', password: 'password1', displayName: 'A' })
        .success,
    ).toBe(true);
  });
  it('TC-44 rejects a password under 8 chars', () => {
    expect(RegisterRequest.safeParse({ email: 'a@b.com', password: 'short' }).success).toBe(false);
  });
  it('TC-45 rejects an invalid email', () => {
    expect(RegisterRequest.safeParse({ email: 'bad', password: 'password1' }).success).toBe(false);
  });
  it('TC-46 registration carries no role field (least privilege assigned server-side)', () => {
    const r = RegisterRequest.parse({ email: 'a@b.com', password: 'password1' });
    expect('role' in r).toBe(false);
  });
});

describe('RBAC · role-string round-trips (used by guards & reference data)', () => {
  it('TC-47 ADMIN round-trips through the enum', () => {
    expect(Role.parse('ADMIN')).toBe('ADMIN');
  });
  it('TC-48 GM round-trips through the enum', () => {
    expect(Role.parse('GM')).toBe('GM');
  });
  it('TC-49 a create with each role parses', () => {
    for (const r of Role.options) expect(cOk(user({ role: r }))).toBe(true);
  });
  it('TC-50 an update to each role parses', () => {
    for (const r of Role.options) expect(uOk({ role: r })).toBe(true);
  });
  it('TC-51 whitespace role is rejected', () => {
    expect(Role.safeParse(' ADMIN ').success).toBe(false);
  });
  it('TC-52 numeric role is rejected', () => {
    expect(Role.safeParse(1 as unknown as string).success).toBe(false);
  });
});
