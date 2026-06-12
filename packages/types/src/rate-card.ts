import { z } from 'zod';
import { Currency, Money, RateUnit } from './common';

export const RateCardRoleInput = z.object({
  roleName: z.string().min(1).max(120),
  unit: RateUnit,
  rate: Money,
});
export type RateCardRoleInput = z.infer<typeof RateCardRoleInput>;

export const RateCardRoleDto = RateCardRoleInput.extend({
  id: z.string().uuid(),
});
export type RateCardRoleDto = z.infer<typeof RateCardRoleDto>;

export const CreateRateCardRequest = z.object({
  name: z.string().min(1).max(160),
  currency: Currency,
  roles: z.array(RateCardRoleInput).default([]),
});
export type CreateRateCardRequest = z.infer<typeof CreateRateCardRequest>;

export const UpdateRateCardRequest = z.object({
  name: z.string().min(1).max(160).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateRateCardRequest = z.infer<typeof UpdateRateCardRequest>;

export const UpdateRateCardRoleRequest = z.object({
  roleName: z.string().min(1).max(120).optional(),
  unit: RateUnit.optional(),
  rate: Money.optional(),
});
export type UpdateRateCardRoleRequest = z.infer<typeof UpdateRateCardRoleRequest>;

export const RateCardDto = z.object({
  id: z.string().uuid(),
  name: z.string(),
  currency: Currency,
  isActive: z.boolean(),
  roles: z.array(RateCardRoleDto),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type RateCardDto = z.infer<typeof RateCardDto>;
