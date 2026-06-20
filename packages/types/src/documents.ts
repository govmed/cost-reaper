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

/** Absolute hard ceiling for a single document upload (100 MB). The effective
 *  limit is admin-configurable up to this — see DOCUMENT_UPLOAD_MAX_MB. */
export const MAX_DOCUMENT_BYTES = 100 * 1024 * 1024;
