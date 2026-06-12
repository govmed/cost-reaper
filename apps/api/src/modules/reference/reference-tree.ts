import type { ReferenceValueDto } from '@cost-reaper/types';

/** A stored reference_value row (the fields the tree builder needs). */
export interface ReferenceValueRow {
  id: string;
  referenceTypeId: string;
  parentId: string | null;
  code: string;
  displayName: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  isBuiltin: boolean;
  metadataJson: unknown;
  createdAt: Date | string;
  updatedAt: Date | string;
}

const iso = (d: Date | string): string => (typeof d === 'string' ? d : d.toISOString());

export function toReferenceValueDto(r: ReferenceValueRow): ReferenceValueDto {
  return {
    id: r.id,
    referenceTypeId: r.referenceTypeId,
    parentId: r.parentId,
    code: r.code,
    displayName: r.displayName,
    description: r.description,
    displayOrder: r.displayOrder,
    isActive: r.isActive,
    isBuiltin: r.isBuiltin,
    metadata: (r.metadataJson as Record<string, unknown> | null) ?? null,
    children: [],
    createdAt: iso(r.createdAt),
    updatedAt: iso(r.updatedAt),
  };
}

/**
 * Order-preserving parent→children nesting (FR-29). Input must already be
 * ordered (displayOrder, code). A child whose parent isn't in the set (e.g.
 * an inactive parent filtered out) surfaces as a root rather than vanishing.
 */
export function buildReferenceTree(rows: ReferenceValueRow[]): ReferenceValueDto[] {
  const byId = new Map<string, ReferenceValueDto>();
  for (const r of rows) byId.set(r.id, toReferenceValueDto(r));
  const roots: ReferenceValueDto[] = [];
  for (const r of rows) {
    const dto = byId.get(r.id)!;
    const parent = r.parentId ? byId.get(r.parentId) : undefined;
    if (parent) parent.children.push(dto);
    else roots.push(dto);
  }
  return roots;
}
