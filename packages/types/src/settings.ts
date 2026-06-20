import { z } from 'zod';

/**
 * Application settings (admin-configurable). The document upload size limit is
 * stored as MB and bounded by an absolute hard ceiling so a single upload can
 * never exceed what the API will accept.
 */

/** Absolute hard ceiling (MB) for a single document upload; the configurable
 *  limit can be set anywhere from 1 up to this. */
export const DOCUMENT_UPLOAD_MAX_MB = 100;
/** Default configurable limit when unset. */
export const DOCUMENT_UPLOAD_DEFAULT_MB = 100;

export const DocumentUploadLimitDto = z.object({
  /** Current configured limit, in megabytes. */
  maxUploadMb: z.number().int().min(1).max(DOCUMENT_UPLOAD_MAX_MB),
});
export type DocumentUploadLimitDto = z.infer<typeof DocumentUploadLimitDto>;

export const UpdateDocumentUploadLimitRequest = z.object({
  maxUploadMb: z.number().int().min(1).max(DOCUMENT_UPLOAD_MAX_MB),
});
export type UpdateDocumentUploadLimitRequest = z.infer<typeof UpdateDocumentUploadLimitRequest>;
