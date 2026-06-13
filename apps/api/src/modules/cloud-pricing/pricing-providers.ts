import { createHash, createHmac } from 'node:crypto';
import { Logger } from '@nestjs/common';
import {
  type AwsProduct,
  type AzureRetailItem,
  type CatalogRow,
  type GcpSku,
  mapAwsPriceList,
  mapAzureItems,
  mapGcpSkus,
} from './price-mappers';

/**
 * Pricing-provider strategy seam (NFR-15, FR-21a). Each provider pulls fresh
 * unit prices from its public pricing source and returns a map of
 * catalogKey(row) -> new unit price for the rows it could refresh. Anything not
 * returned keeps its existing catalog price. Failures / missing credentials
 * resolve to an empty map (graceful fallback). Estimate snapshots are never
 * touched (NFR-14).
 */
export interface PricingProvider {
  readonly provider: 'AWS' | 'GCP' | 'AZURE';
  readonly source: 'AWS_API' | 'GCP_API' | 'AZURE_API';
  fetchPrices(rows: CatalogRow[]): Promise<Map<string, string>>;
}

const log = new Logger('PricingProvider');

async function fetchJson<T>(url: string, init: RequestInit, timeoutMs = 12_000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

// ── Azure (Retail Prices API — no auth) ──────────────────────────────────────
class AzureRetailProvider implements PricingProvider {
  readonly provider = 'AZURE' as const;
  readonly source = 'AZURE_API' as const;

  async fetchPrices(rows: CatalogRow[]): Promise<Map<string, string>> {
    const vmRows = rows.filter((r) => r.service === 'Virtual Machines');
    if (vmRows.length === 0) return new Map();
    const endpoint =
      process.env.AZURE_RETAIL_PRICES_ENDPOINT ?? 'https://prices.azure.com/api/retail/prices';
    const byRegion = new Map<string, CatalogRow[]>();
    for (const r of vmRows)
      (byRegion.get(r.region) ?? byRegion.set(r.region, []).get(r.region)!).push(r);

    const items: AzureRetailItem[] = [];
    try {
      for (const [region, regionRows] of byRegion) {
        const skuOr = regionRows
          .map((r) => `armSkuName eq 'Standard_${r.skuOrInstance}'`)
          .join(' or ');
        const filter = `serviceName eq 'Virtual Machines' and armRegionName eq '${region}' and priceType eq 'Consumption' and (${skuOr})`;
        const url = `${endpoint}?currencyCode='USD'&$filter=${encodeURIComponent(filter)}`;
        const page = await fetchJson<{ Items?: AzureRetailItem[] }>(url, {});
        if (Array.isArray(page.Items)) items.push(...page.Items);
      }
      return mapAzureItems(items, rows);
    } catch (err) {
      log.warn(`Azure price pull failed, keeping catalog: ${(err as Error).message}`);
      return new Map();
    }
  }
}

// ── AWS (Price List Query API — SigV4, requires credentials) ─────────────────
const AWS_REGION_TO_LOCATION: Record<string, string> = {
  'us-east-1': 'US East (N. Virginia)',
  'us-east-2': 'US East (Ohio)',
  'us-west-2': 'US West (Oregon)',
  'eu-west-1': 'EU (Ireland)',
};

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac('sha256', key).update(data, 'utf8').digest();
}

class AwsPricingProvider implements PricingProvider {
  readonly provider = 'AWS' as const;
  readonly source = 'AWS_API' as const;

  async fetchPrices(rows: CatalogRow[]): Promise<Map<string, string>> {
    const access = process.env.AWS_ACCESS_KEY_ID;
    const secret = process.env.AWS_SECRET_ACCESS_KEY;
    const ec2Rows = rows.filter((r) => r.service === 'EC2');
    if (!access || !secret || ec2Rows.length === 0) return new Map();
    // The Price List Query API is served from us-east-1 (and ap-south-1).
    const apiRegion = 'us-east-1';
    const host = `api.pricing.${apiRegion}.amazonaws.com`;
    const products: AwsProduct[] = [];
    try {
      for (const row of ec2Rows) {
        const location = AWS_REGION_TO_LOCATION[row.region];
        if (!location) continue;
        const body = JSON.stringify({
          ServiceCode: 'AmazonEC2',
          FormatVersion: 'aws_v1',
          Filters: [
            { Type: 'TERM_MATCH', Field: 'instanceType', Value: row.skuOrInstance },
            { Type: 'TERM_MATCH', Field: 'location', Value: location },
            { Type: 'TERM_MATCH', Field: 'tenancy', Value: 'Shared' },
            { Type: 'TERM_MATCH', Field: 'operatingSystem', Value: 'Linux' },
            { Type: 'TERM_MATCH', Field: 'preInstalledSw', Value: 'NA' },
            { Type: 'TERM_MATCH', Field: 'capacitystatus', Value: 'Used' },
          ],
          MaxResults: 10,
        });
        const headers = this.sign(host, apiRegion, body, access, secret);
        const res = await fetchJson<{ PriceList?: string[] }>(`https://${host}/`, {
          method: 'POST',
          headers,
          body,
        });
        for (const p of res.PriceList ?? []) {
          try {
            products.push(JSON.parse(p) as AwsProduct);
          } catch {
            /* skip malformed entry */
          }
        }
      }
      return mapAwsPriceList(products, rows);
    } catch (err) {
      log.warn(`AWS price pull failed, keeping catalog: ${(err as Error).message}`);
      return new Map();
    }
  }

  /** Minimal AWS SigV4 signing for the pricing GetProducts POST (no SDK). */
  private sign(
    host: string,
    region: string,
    body: string,
    access: string,
    secret: string,
  ): Record<string, string> {
    const service = 'pricing';
    const target = 'AWSPriceListService.GetProducts';
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, ''); // YYYYMMDDTHHMMSSZ
    const dateStamp = amzDate.slice(0, 8);
    const contentType = 'application/x-amz-json-1.1';

    const canonicalHeaders =
      `content-type:${contentType}\n` +
      `host:${host}\n` +
      `x-amz-date:${amzDate}\n` +
      `x-amz-target:${target}\n`;
    const signedHeaders = 'content-type;host;x-amz-date;x-amz-target';
    const payloadHash = createHash('sha256').update(body, 'utf8').digest('hex');
    const canonicalRequest = `POST\n/\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

    const scope = `${dateStamp}/${region}/${service}/aws4_request`;
    const stringToSign =
      `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n` +
      createHash('sha256').update(canonicalRequest, 'utf8').digest('hex');

    const kDate = hmac(`AWS4${secret}`, dateStamp);
    const kRegion = hmac(kDate, region);
    const kService = hmac(kRegion, service);
    const kSigning = hmac(kService, 'aws4_request');
    const signature = createHmac('sha256', kSigning).update(stringToSign, 'utf8').digest('hex');

    const authorization =
      `AWS4-HMAC-SHA256 Credential=${access}/${scope}, ` +
      `SignedHeaders=${signedHeaders}, Signature=${signature}`;

    return {
      'Content-Type': contentType,
      'X-Amz-Date': amzDate,
      'X-Amz-Target': target,
      Authorization: authorization,
    };
  }
}

// ── GCP (Cloud Billing Catalog API — requires an API key) ────────────────────
const GCP_COMPUTE_SERVICE = '6F81-5844-456A'; // Compute Engine

class GcpBillingProvider implements PricingProvider {
  readonly provider = 'GCP' as const;
  readonly source = 'GCP_API' as const;

  async fetchPrices(rows: CatalogRow[]): Promise<Map<string, string>> {
    const key = process.env.GCP_BILLING_API_KEY;
    const computeRows = rows.filter((r) => r.service === 'Compute Engine');
    if (!key || computeRows.length === 0) return new Map();
    const base = `https://cloudbilling.googleapis.com/v1/services/${GCP_COMPUTE_SERVICE}/skus?key=${key}&pageSize=5000`;
    const skus: GcpSku[] = [];
    try {
      let pageToken: string | undefined;
      for (let page = 0; page < 6; page++) {
        const url = pageToken ? `${base}&pageToken=${pageToken}` : base;
        const res = await fetchJson<{ skus?: GcpSku[]; nextPageToken?: string }>(url, {});
        if (Array.isArray(res.skus)) skus.push(...res.skus);
        if (!res.nextPageToken) break;
        pageToken = res.nextPageToken;
      }
      return mapGcpSkus(skus, rows);
    } catch (err) {
      log.warn(`GCP price pull failed, keeping catalog: ${(err as Error).message}`);
      return new Map();
    }
  }
}

export const PRICING_PROVIDERS: Record<'AWS' | 'GCP' | 'AZURE', PricingProvider> = {
  AWS: new AwsPricingProvider(),
  GCP: new GcpBillingProvider(),
  AZURE: new AzureRetailProvider(),
};
