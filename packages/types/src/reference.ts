import { z } from 'zod';

/**
 * Reference-data contract (FR-29, NFR-17). The generic `reference_type` /
 * `reference_value` pair backs every configurable lookup so values, labels,
 * sequencing, and active flags are data — not hard-coded enums.
 */

/** A reference value code: uppercase snake-ish token, stable across renames. */
export const ReferenceCode = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[A-Z0-9][A-Z0-9_]*$/, 'Use UPPER_SNAKE codes (A–Z, 0–9, _)');

export interface ReferenceValueDto {
  id: string;
  referenceTypeId: string;
  parentId: string | null;
  code: string;
  displayName: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  isBuiltin: boolean;
  metadata: Record<string, unknown> | null;
  /** Active child values (e.g. SDLC phase → tasks), ordered by displayOrder. */
  children: ReferenceValueDto[];
  createdAt: string;
  updatedAt: string;
}

export interface ReferenceTypeDto {
  id: string;
  code: string;
  displayName: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  valueCount: number;
}

export const CreateReferenceTypeRequest = z.object({
  code: ReferenceCode,
  displayName: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  displayOrder: z.number().int().min(0).default(0),
});
export type CreateReferenceTypeRequest = z.infer<typeof CreateReferenceTypeRequest>;

export const CreateReferenceValueRequest = z.object({
  code: ReferenceCode,
  displayName: z.string().min(1).max(160),
  description: z.string().max(2000).optional(),
  displayOrder: z.number().int().min(0).default(0),
  parentId: z.string().uuid().nullable().optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
});
export type CreateReferenceValueRequest = z.infer<typeof CreateReferenceValueRequest>;

export const UpdateReferenceValueRequest = z.object({
  displayName: z.string().min(1).max(160).optional(),
  description: z.string().max(2000).nullable().optional(),
  displayOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  parentId: z.string().uuid().nullable().optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
});
export type UpdateReferenceValueRequest = z.infer<typeof UpdateReferenceValueRequest>;
