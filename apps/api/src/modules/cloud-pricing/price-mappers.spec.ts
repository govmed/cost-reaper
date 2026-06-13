import { describe, it, expect } from 'vitest';
import {
  catalogKey,
  mapAwsPriceList,
  mapAzureItems,
  mapGcpSkus,
  type AwsProduct,
  type AzureRetailItem,
  type CatalogRow,
  type GcpSku,
} from './price-mappers';

const row = (
  p: Partial<CatalogRow> & Pick<CatalogRow, 'provider' | 'service' | 'skuOrInstance'>,
): CatalogRow => ({
  region: p.region ?? 'r',
  unit: p.unit ?? 'HOUR',
  unitPrice: p.unitPrice ?? '0',
  currency: p.currency ?? 'USD',
  ...p,
});

describe('mapAzureItems (FR-21a)', () => {
  const azRow = row({
    provider: 'AZURE',
    service: 'Virtual Machines',
    skuOrInstance: 'B2ms',
    region: 'eastus',
  });
  const item = (over: Partial<AzureRetailItem>): AzureRetailItem => ({
    serviceName: 'Virtual Machines',
    armRegionName: 'eastus',
    armSkuName: 'Standard_B2ms',
    skuName: 'B2ms',
    productName: 'Virtual Machines BS Series',
    meterName: 'B2ms',
    type: 'Consumption',
    unitOfMeasure: '1 Hour',
    retailPrice: 0.0832,
    currencyCode: 'USD',
    ...over,
  });

  it('matches the Linux on-demand hourly price by Standard_<sku>', () => {
    const m = mapAzureItems([item({})], [azRow]);
    expect(m.get(catalogKey(azRow))).toBe('0.083200');
  });

  it('ignores Spot, Windows, wrong region and non-consumption items', () => {
    const m = mapAzureItems(
      [
        item({ skuName: 'B2ms Spot' }),
        item({ productName: 'Virtual Machines BS Series Windows' }),
        item({ armRegionName: 'westus' }),
        item({ type: 'Reservation' }),
      ],
      [azRow],
    );
    expect(m.size).toBe(0);
  });
});

describe('mapAwsPriceList (FR-21a)', () => {
  const awsRow = row({
    provider: 'AWS',
    service: 'EC2',
    skuOrInstance: 't3.medium',
    region: 'us-east-1',
  });
  const product = (instanceType: string, usd: string): AwsProduct => ({
    product: { attributes: { instanceType } },
    terms: {
      OnDemand: {
        K1: { priceDimensions: { D1: { pricePerUnit: { USD: usd }, unit: 'Hrs' } } },
      },
    },
  });

  it('extracts the on-demand USD/hour price for the matching instance type', () => {
    const m = mapAwsPriceList(
      [product('t3.medium', '0.0416'), product('m5.large', '0.096')],
      [awsRow],
    );
    expect(m.get(catalogKey(awsRow))).toBe('0.041600');
  });
});

describe('mapGcpSkus (FR-21a)', () => {
  const gcpRow = row({
    provider: 'GCP',
    service: 'Compute Engine',
    skuOrInstance: 'e2-standard-2',
    region: 'us-central1',
  });
  const sku = (description: string, resourceGroup: string, nanos: number): GcpSku => ({
    description,
    category: { resourceFamily: 'Compute', resourceGroup, usageType: 'OnDemand' },
    serviceRegions: ['us-central1'],
    pricingInfo: [
      {
        pricingExpression: {
          usageUnit: 'h',
          tieredRates: [{ unitPrice: { currencyCode: 'USD', units: '0', nanos } }],
        },
      },
    ],
  });

  it('computes instance price = cores×core + ramGb×ram from separate SKUs', () => {
    // e2-standard-2 = 2 vCPU, 8 GB → 2×0.021811 + 8×0.002923 = 0.067006
    const m = mapGcpSkus(
      [
        sku('E2 Instance Core running in Americas', 'CPU', 21_811_000),
        sku('E2 Instance Ram running in Americas', 'RAM', 2_923_000),
      ],
      [gcpRow],
    );
    expect(m.get(catalogKey(gcpRow))).toBe('0.067006');
  });

  it('returns nothing when the region or a SKU is missing', () => {
    const m = mapGcpSkus(
      [sku('E2 Instance Core running in Americas', 'CPU', 21_811_000)],
      [gcpRow],
    );
    expect(m.size).toBe(0);
  });
});
