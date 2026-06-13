import { z } from 'zod';
import { CloudProvider, Currency } from './common';

export const CloudPriceUnit = z.enum(['HOUR', 'MONTH', 'GB_MONTH', 'REQUEST']);
export type CloudPriceUnit = z.infer<typeof CloudPriceUnit>;

export const CloudPriceSource = z.enum(['CATALOG_SEED', 'AWS_API', 'AZURE_API', 'GCP_API']);
export type CloudPriceSource = z.infer<typeof CloudPriceSource>;

export const CloudPriceDto = z.object({
  id: z.string().uuid(),
  provider: CloudProvider,
  region: z.string(),
  service: z.string(),
  skuOrInstance: z.string(),
  unit: CloudPriceUnit,
  /** Decimal string; stored NUMERIC(18,6). */
  unitPrice: z.string().regex(/^-?\d+(\.\d+)?$/),
  currency: Currency,
  source: CloudPriceSource,
  effectiveDate: z.string().datetime(),
});
export type CloudPriceDto = z.infer<typeof CloudPriceDto>;

export const CloudPriceQuery = z.object({
  provider: CloudProvider.optional(),
  region: z.string().optional(),
  service: z.string().optional(),
  skuOrInstance: z.string().optional(),
});
export type CloudPriceQuery = z.infer<typeof CloudPriceQuery>;

/** Admin-triggered price refresh (FR-21a); omit provider to refresh all. */
export const CloudSyncRequest = z.object({ provider: CloudProvider.optional() });
export type CloudSyncRequest = z.infer<typeof CloudSyncRequest>;

/** When each provider's catalog was last pulled (FR-21b). */
export interface ProviderLastPulledDto {
  provider: string;
  lastPulled: string | null;
  priceCount: number;
}
