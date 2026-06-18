import { describe, it, expect } from 'vitest';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';

process.env.JWT_SECRET = 'test_access_secret_at_least_32_characters_long';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_at_least_32_characters';

function makeService(users: any[]) {
  const prisma: any = {
    user: {
      findUnique: async ({ where }: any) =>
        users.find((u) => (where.email ? u.email === where.email : u.id === where.id)) ?? null,
      create: async ({ data }: any) => {
        const u = {
          id: `u${users.length + 1}`,
          role: 'ESTIMATOR',
          isActive: true,
          displayName: null,
          ...data,
        };
        users.push(u);
        return u;
      },
      update: async ({ where, data }: any) => {
        const u = users.find((x) => x.id === where.id);
        Object.assign(u, data);
        return u;
      },
    },
  };
  // Minimal RolesService stub — resolves a role's permissions for the auth user.
  const roles: any = {
    permissionsFor: async (role: string) =>
      new Set<string>(role === 'ADMIN' ? ['*'] : ['estimate.author']),
  };
  return new AuthService(prisma, new JwtService(), roles);
}

describe('AuthService', () => {
  it('registers a new user and returns a token pair', async () => {
    const svc = makeService([]);
    const res = await svc.register({ email: 'new@x.com', password: 'password123' });
    expect(res.user.email).toBe('new@x.com');
    expect(res.user.permissions).toContain('estimate.author');
    expect(typeof res.accessToken).toBe('string');
    expect(typeof res.refreshToken).toBe('string');
  });

  it('rejects a duplicate email', async () => {
    const svc = makeService([
      {
        id: 'u1',
        email: 'dup@x.com',
        passwordHash: 'x',
        role: 'ESTIMATOR',
        isActive: true,
        displayName: null,
      },
    ]);
    await expect(svc.register({ email: 'dup@x.com', password: 'password123' })).rejects.toThrow();
  });

  it('logs in with the correct password and rejects a wrong one', async () => {
    const passwordHash = await argon2.hash('password123');
    const svc = makeService([
      {
        id: 'u1',
        email: 'a@x.com',
        passwordHash,
        role: 'ADMIN',
        isActive: true,
        displayName: null,
      },
    ]);
    const ok = await svc.login({ email: 'a@x.com', password: 'password123' });
    expect(ok.user.role).toBe('ADMIN');
    expect(ok.user.permissions).toContain('*');
    expect(typeof ok.accessToken).toBe('string');
    await expect(svc.login({ email: 'a@x.com', password: 'wrong' })).rejects.toThrow();
  });

  it('issues fresh tokens from a valid refresh token', async () => {
    const passwordHash = await argon2.hash('password123');
    const svc = makeService([
      {
        id: 'u1',
        email: 'a@x.com',
        passwordHash,
        role: 'ESTIMATOR',
        isActive: true,
        displayName: null,
      },
    ]);
    const { refreshToken } = await svc.login({ email: 'a@x.com', password: 'password123' });
    const pair = await svc.refresh(refreshToken);
    expect(typeof pair.accessToken).toBe('string');
  });
});
