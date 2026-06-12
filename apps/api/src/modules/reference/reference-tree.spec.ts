import { describe, it, expect } from 'vitest';
import { buildReferenceTree, type ReferenceValueRow } from './reference-tree';

const row = (
  p: Partial<ReferenceValueRow> & Pick<ReferenceValueRow, 'id' | 'code'>,
): ReferenceValueRow => ({
  referenceTypeId: 't',
  parentId: null,
  displayName: p.code,
  description: null,
  displayOrder: 0,
  isActive: true,
  isBuiltin: true,
  metadataJson: null,
  createdAt: '2026-06-12T00:00:00.000Z',
  updatedAt: '2026-06-12T00:00:00.000Z',
  ...p,
});

describe('buildReferenceTree (FR-29)', () => {
  it('nests children under their parent, preserving input order', () => {
    const tree = buildReferenceTree([
      row({ id: 'p1', code: 'PLANNING' }),
      row({ id: 'p1a', code: 'REQUIREMENTS', parentId: 'p1' }),
      row({ id: 'p1b', code: 'ESTIMATION', parentId: 'p1' }),
      row({ id: 'p2', code: 'DESIGN' }),
    ]);
    expect(tree.map((t) => t.code)).toEqual(['PLANNING', 'DESIGN']);
    expect(tree[0].children.map((c) => c.code)).toEqual(['REQUIREMENTS', 'ESTIMATION']);
    expect(tree[1].children).toEqual([]);
  });

  it('surfaces an orphaned child (missing/inactive parent) as a root', () => {
    const tree = buildReferenceTree([row({ id: 'c', code: 'CHILD', parentId: 'gone' })]);
    expect(tree.map((t) => t.code)).toEqual(['CHILD']);
  });

  it('maps metadataJson to metadata and dates to ISO strings', () => {
    const [dto] = buildReferenceTree([
      row({ id: 'x', code: 'X', metadataJson: { color: 'teal' }, isActive: false }),
    ]);
    expect(dto.metadata).toEqual({ color: 'teal' });
    expect(dto.isActive).toBe(false);
    expect(dto.createdAt).toBe('2026-06-12T00:00:00.000Z');
  });
});
