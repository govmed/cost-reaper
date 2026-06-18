import { z } from 'zod';

/**
 * A supporting document attached to an estimate (catalogued by DOCUMENT_TYPE,
 * FR-29). Metadata only — the file bytes are streamed by the download endpoint.
 */
export const EstimateDocumentDto = z.object({
  id: z.string().uuid(),
  fileName: z.string(),
  /** DOCUMENT_TYPE reference code; the UI shows its display name. */
  documentType: z.string(),
  description: z.string().nullable(),
  contentType: z.string(),
  sizeBytes: z.number().int(),
  uploadedByEmail: z.string().nullable(),
  uploadedAt: z.string(),
});
export type EstimateDocumentDto = z.infer<typeof EstimateDocumentDto>;

/** Max upload size for a supporting document (10 MB). */
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
