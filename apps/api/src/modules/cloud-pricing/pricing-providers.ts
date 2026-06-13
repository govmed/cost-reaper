/**
 * Pricing-provider strategy seam (NFR-15, FR-21a). Each provider knows how to
 * pull current prices from its public pricing source (AWS Price List API,
 * Azure Retail Prices API, GCP Cloud Billing Catalog API). The live fetch is a
 * future drop-in; the stub returns the maintained catalog unchanged so an
 * admin-triggered refresh re-stamps the "last pulled" time without altering
 * saved-estimate price snapshots (NFR-14).
 */
export interface FetchedPrice {
  region: string;
  service: string;
  skuOrInstance: string;
  unit: string;
  unitPrice: string;
  currency: string;
}

export interface PricingProvider {
  readonly provider: 'AWS' | 'GCP' | 'AZURE';
  /** Pull current prices. Receives the existing catalog rows for the provider. */
  fetch(current: FetchedPrice[]): Promise<FetchedPrice[]>;
}

/** Default stub: echoes the maintained catalog (no external call yet, FR-21a). */
class CatalogStubProvider implements PricingProvider {
  constructor(readonly provider: 'AWS' | 'GCP' | 'AZURE') {}
  async fetch(current: FetchedPrice[]): Promise<FetchedPrice[]> {
    // TODO: replace with the real provider pricing-source call (FR-21a).
    return current;
  }
}

export const PRICING_PROVIDERS: Record<'AWS' | 'GCP' | 'AZURE', PricingProvider> = {
  AWS: new CatalogStubProvider('AWS'),
  GCP: new CatalogStubProvider('GCP'),
  AZURE: new CatalogStubProvider('AZURE'),
};
