/**
 * Pure, I/O-free mappers from each provider's pricing-API response to refreshed
 * unit prices for our catalog rows (FR-21a). Network calls live in
 * pricing-providers.ts; these are unit-tested in isolation.
 *
 * A "refresh" only updates the catalog's unit price + last-pulled time. Estimate
 * line items keep their own price snapshot, so saved estimates never change
 * (NFR-14). Returned map: catalogKey(row) -> new unit price (string, 6 dp).
 */

export interface CatalogRow {
  provider: string;
  region: string;
  service: string;
  skuOrInstance: string;
  unit: string;
  unitPrice: string;
  currency: string;
}

export function catalogKey(r: {
  region: string;
  service: string;
  skuOrInstance: string;
  unit: string;
}): string {
  return `${r.region}::${r.service}::${r.skuOrInstance}::${r.unit}`;
}

const money6 = (n: number): string => n.toFixed(6);

// ── Azure Retail Prices API ──────────────────────────────────────────────────
export interface AzureRetailItem {
  serviceName: string;
  armRegionName: string;
  armSkuName: string;
  skuName: string;
  productName: string;
  meterName: string;
  type: string; // "Consumption" = on-demand
  unitOfMeasure: string; // e.g. "1 Hour"
  retailPrice: number;
  currencyCode: string;
}

/** Match Azure VM consumption prices (Linux, on-demand, hourly) to our rows. */
export function mapAzureItems(items: AzureRetailItem[], rows: CatalogRow[]): Map<string, string> {
  const out = new Map<string, string>();
  for (const row of rows) {
    if (row.provider !== 'AZURE' || row.service !== 'Virtual Machines') continue;
    const target = `standard_${row.skuOrInstance}`.toLowerCase();
    const match = items.find(
      (it) =>
        it.type === 'Consumption' &&
        it.armRegionName === row.region &&
        (it.armSkuName ?? '').toLowerCase() === target &&
        !/spot|low priority/i.test(it.skuName ?? '') &&
        !/windows/i.test(it.productName ?? '') &&
        /hour/i.test(it.unitOfMeasure ?? ''),
    );
    if (match && typeof match.retailPrice === 'number' && match.retailPrice > 0) {
      out.set(catalogKey(row), money6(match.retailPrice));
    }
  }
  return out;
}

// ── AWS Price List Query API (GetProducts) ───────────────────────────────────
export interface AwsProduct {
  product?: { attributes?: { instanceType?: string } };
  terms?: {
    OnDemand?: Record<
      string,
      { priceDimensions: Record<string, { pricePerUnit: { USD?: string }; unit: string }> }
    >;
  };
}

/** Extract the on-demand USD/hour price per EC2 instanceType and match our rows. */
export function mapAwsPriceList(products: AwsProduct[], rows: CatalogRow[]): Map<string, string> {
  const byInstance = new Map<string, string>();
  for (const p of products) {
    const it = p.product?.attributes?.instanceType;
    if (!it || byInstance.has(it)) continue;
    const onDemand = p.terms?.OnDemand;
    if (!onDemand) continue;
    const term = Object.values(onDemand)[0];
    const dim = term && Object.values(term.priceDimensions)[0];
    const usd = dim?.pricePerUnit?.USD;
    if (usd && Number(usd) > 0) byInstance.set(it, money6(Number(usd)));
  }
  const out = new Map<string, string>();
  for (const row of rows) {
    if (row.provider !== 'AWS' || row.service !== 'EC2') continue;
    const price = byInstance.get(row.skuOrInstance);
    if (price) out.set(catalogKey(row), price);
  }
  return out;
}

// ── GCP Cloud Billing Catalog API ────────────────────────────────────────────
export interface GcpSku {
  description: string;
  category?: { resourceFamily?: string; resourceGroup?: string; usageType?: string };
  serviceRegions?: string[];
  pricingInfo?: {
    pricingExpression?: {
      usageUnit?: string;
      tieredRates?: { unitPrice?: { currencyCode?: string; units?: string; nanos?: number } }[];
    };
  }[];
}

/** vCPU + RAM(GiB) per machine type — GCP prices core & ram SKUs separately. */
// Standard predefined families price as cores × Core-SKU + ramGb × RAM-SKU.
// E2/N2/N2D/T2D standard = 4 GB/core; N1 predefined = 3.75 GB/core.
const GCP_MACHINE_SPECS: Record<string, { family: string; cores: number; ramGb: number }> = {
  'e2-standard-2': { family: 'E2', cores: 2, ramGb: 8 },
  'e2-standard-4': { family: 'E2', cores: 4, ramGb: 16 },
  'e2-standard-8': { family: 'E2', cores: 8, ramGb: 32 },
  'e2-standard-16': { family: 'E2', cores: 16, ramGb: 64 },
  'n2-standard-2': { family: 'N2', cores: 2, ramGb: 8 },
  'n2-standard-4': { family: 'N2', cores: 4, ramGb: 16 },
  'n2-standard-8': { family: 'N2', cores: 8, ramGb: 32 },
  'n2-standard-16': { family: 'N2', cores: 16, ramGb: 64 },
  'n2-standard-32': { family: 'N2', cores: 32, ramGb: 128 },
  'n2d-standard-2': { family: 'N2D', cores: 2, ramGb: 8 },
  'n2d-standard-4': { family: 'N2D', cores: 4, ramGb: 16 },
  'n2d-standard-8': { family: 'N2D', cores: 8, ramGb: 32 },
  't2d-standard-2': { family: 'T2D', cores: 2, ramGb: 8 },
  't2d-standard-4': { family: 'T2D', cores: 4, ramGb: 16 },
  'n1-standard-1': { family: 'N1 Predefined', cores: 1, ramGb: 3.75 },
  'n1-standard-2': { family: 'N1 Predefined', cores: 2, ramGb: 7.5 },
  'n1-standard-4': { family: 'N1 Predefined', cores: 4, ramGb: 15 },
  'n1-standard-8': { family: 'N1 Predefined', cores: 8, ramGb: 30 },
};

function gcpUnitPrice(sku: GcpSku): number | null {
  const rate = sku.pricingInfo?.[0]?.pricingExpression?.tieredRates?.[0]?.unitPrice;
  if (!rate) return null;
  const units = Number(rate.units ?? 0);
  const nanos = Number(rate.nanos ?? 0);
  return units + nanos / 1e9;
}

/**
 * Compute a per-instance-hour price from GCP's separate Core + RAM SKUs:
 * price = cores × coreHourly + ramGb × ramHourly, for an on-demand machine
 * family in the row's region.
 */
export function mapGcpSkus(skus: GcpSku[], rows: CatalogRow[]): Map<string, string> {
  const out = new Map<string, string>();
  for (const row of rows) {
    if (row.provider !== 'GCP' || row.service !== 'Compute Engine') continue;
    const spec = GCP_MACHINE_SPECS[row.skuOrInstance];
    if (!spec) continue;
    const inRegion = (s: GcpSku) =>
      s.category?.usageType === 'OnDemand' && (s.serviceRegions ?? []).includes(row.region);
    const core = skus.find(
      (s) =>
        inRegion(s) &&
        s.category?.resourceGroup === 'CPU' &&
        new RegExp(`${spec.family} Instance Core`, 'i').test(s.description),
    );
    const ram = skus.find(
      (s) =>
        inRegion(s) &&
        s.category?.resourceGroup === 'RAM' &&
        new RegExp(`${spec.family} Instance Ram`, 'i').test(s.description),
    );
    const corePrice = core ? gcpUnitPrice(core) : null;
    const ramPrice = ram ? gcpUnitPrice(ram) : null;
    if (corePrice != null && ramPrice != null) {
      const price = spec.cores * corePrice + spec.ramGb * ramPrice;
      if (price > 0) out.set(catalogKey(row), money6(price));
    }
  }
  return out;
}
