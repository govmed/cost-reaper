import { z } from 'zod';
import { Role } from './common';

export const LoginRequest = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginRequest = z.infer<typeof LoginRequest>;

export const RegisterRequest = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(1).max(120).optional(),
});
export type RegisterRequest = z.infer<typeof RegisterRequest>;

export const RefreshRequest = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshRequest = z.infer<typeof RefreshRequest>;

export const TokenPair = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});
export type TokenPair = z.infer<typeof TokenPair>;

/** The authenticated principal carried in the JWT / request context. */
export const AuthUser = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: Role,
  displayName: z.string().nullable().optional(),
});
export type AuthUser = z.infer<typeof AuthUser>;

// ── User management (FR-26, NFR-16) ──────────────────────────────────────────

export const CreateUserRequest = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: Role.default('ESTIMATOR'),
  displayName: z.string().min(1).max(120).optional(),
});
export type CreateUserRequest = z.infer<typeof CreateUserRequest>;

export const UpdateUserRequest = z.object({
  role: Role.optional(),
  isActive: z.boolean().optional(),
  displayName: z.string().min(1).max(120).optional(),
});
export type UpdateUserRequest = z.infer<typeof UpdateUserRequest>;

export const UserDto = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: Role,
  displayName: z.string().nullable(),
  isActive: z.boolean(),
  lastLoginAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type UserDto = z.infer<typeof UserDto>;
