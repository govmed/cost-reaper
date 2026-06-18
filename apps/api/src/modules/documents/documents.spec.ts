/**
 * Supporting documents (FR-29) — contract QA for the catalog DTO + upload limit.
 */
import { describe, it, expect } from 'vitest';
import { EstimateDocumentDto, MAX_DOCUMENT_BYTES } from '@cost-reaper/types';

const UUID = '550e8400-e29b-41d4-a716-446655440000';
const doc = (o: Record<string, unknown> = {}) => ({
  id: UUID,
  fileName: 'proposal.pdf',
  documentType: 'PROPOSAL',
  description: null,
  contentType: 'application/pdf',
  sizeBytes: 12345,
  uploadedByEmail: 'admin@example.com',
  uploadedAt: '2026-06-17T00:00:00.000Z',
  ...o,
});

describe('Documents · DTO + limits', () => {
  it('DOC-01 accepts a complete document', () => {
    expect(EstimateDocumentDto.safeParse(doc()).success).toBe(true);
  });
  it('DOC-02 allows a null description', () => {
    expect(EstimateDocumentDto.safeParse(doc({ description: null })).success).toBe(true);
  });
  it('DOC-03 allows a null uploader (deleted user)', () => {
    expect(EstimateDocumentDto.safeParse(doc({ uploadedByEmail: null })).success).toBe(true);
  });
  it('DOC-04 rejects a non-integer size', () => {
    expect(EstimateDocumentDto.safeParse(doc({ sizeBytes: 1.5 })).success).toBe(false);
  });
  it('DOC-05 rejects a non-uuid id', () => {
    expect(EstimateDocumentDto.safeParse(doc({ id: 'x' })).success).toBe(false);
  });
  it('DOC-06 the upload limit is 10 MB', () => {
    expect(MAX_DOCUMENT_BYTES).toBe(10 * 1024 * 1024);
  });
});
