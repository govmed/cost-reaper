/**
 * Seed baseline data (setup step 6):
 *   - one Admin from env (FR-26 / Section 0.1 — never hardcoded)
 *   - a sample rate card (FR-3)
 *   - a cloud price catalog for AWS / GCP / Azure (FR-21, source CATALOG_SEED)
 *   - the default approval workflow (FR-24)
 *   - the built-in smart-checklist rules (FR-25)
 *
 * Idempotent: safe to re-run (upserts / find-or-create).
 */
import {
  ChecklistScope,
  ChecklistSeverity,
  CloudPriceSource,
  CloudPriceUnit,
  CloudProvider,
  PrismaClient,
  RateUnit,
  Role,
} from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'change_me';
  const passwordHash = await argon2.hash(password);
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      role: Role.ADMIN,
      displayName: 'Administrator',
      isActive: true,
    },
  });
}

async function seedRateCard(adminId: string) {
  const existing = await prisma.rateCard.findFirst({ where: { name: 'Standard Rate Card 2026' } });
  if (existing) return existing;
  return prisma.rateCard.create({
    data: {
      name: 'Standard Rate Card 2026',
      currency: 'USD',
      createdById: adminId,
      roles: {
        create: [
          { roleName: 'Solution Architect', unit: RateUnit.HOUR, rate: '210.0000' },
          { roleName: 'Senior Engineer', unit: RateUnit.HOUR, rate: '165.0000' },
          { roleName: 'Engineer', unit: RateUnit.HOUR, rate: '130.0000' },
          { roleName: 'QA Engineer', unit: RateUnit.HOUR, rate: '110.0000' },
          { roleName: 'Project Manager', unit: RateUnit.DAY, rate: '1200.0000' },
        ],
      },
    },
  });
}

interface SeedPrice {
  provider: CloudProvider;
  category: string;
  region: string;
  service: string;
  skuOrInstance: string;
  unit: CloudPriceUnit;
  unitPrice: string;
}

// Enterprise category for each service — everything an architect needs to model
// a cloud build. Service names are unique per category across providers (FR-21).
const SERVICE_CATEGORY: Record<string, string> = {
  // Compute
  EC2: 'Compute',
  'Compute Engine': 'Compute',
  'Virtual Machines': 'Compute',
  // Storage
  S3: 'Storage',
  EBS: 'Storage',
  EFS: 'Storage',
  'Cloud Storage': 'Storage',
  Filestore: 'Storage',
  'Blob Storage': 'Storage',
  'Managed Disks': 'Storage',
  'Azure Files': 'Storage',
  // Networking
  'Data Transfer': 'Networking',
  'Elastic Load Balancing': 'Networking',
  'NAT Gateway': 'Networking',
  CloudFront: 'Networking',
  'Route 53': 'Networking',
  'VPN / Direct Connect': 'Networking',
  'Cloud Load Balancing': 'Networking',
  'Cloud NAT': 'Networking',
  'Cloud CDN': 'Networking',
  'Cloud DNS': 'Networking',
  'Cloud VPN / Interconnect': 'Networking',
  'Network Egress': 'Networking',
  'Load Balancer': 'Networking',
  'Application Gateway': 'Networking',
  'Front Door / CDN': 'Networking',
  'DNS / VPN Gateway': 'Networking',
  // Database
  RDS: 'Database',
  DynamoDB: 'Database',
  ElastiCache: 'Database',
  'Cloud SQL': 'Database',
  Firestore: 'Database',
  Memorystore: 'Database',
  'Azure SQL Database': 'Database',
  'Cosmos DB': 'Database',
  'Cache for Redis': 'Database',
  // Containers & Serverless
  Lambda: 'Containers & Serverless',
  Fargate: 'Containers & Serverless',
  EKS: 'Containers & Serverless',
  'Cloud Functions': 'Containers & Serverless',
  'Cloud Run': 'Containers & Serverless',
  GKE: 'Containers & Serverless',
  'Azure Functions': 'Containers & Serverless',
  'Container Instances': 'Containers & Serverless',
  AKS: 'Containers & Serverless',
  // Analytics & Big Data
  Athena: 'Analytics & Big Data',
  'Kinesis Data Streams': 'Analytics & Big Data',
  BigQuery: 'Analytics & Big Data',
  Dataflow: 'Analytics & Big Data',
  'Synapse Analytics': 'Analytics & Big Data',
  'Event Hubs': 'Analytics & Big Data',
  // AI & Machine Learning
  SageMaker: 'AI & Machine Learning',
  Bedrock: 'AI & Machine Learning',
  'Vertex AI': 'AI & Machine Learning',
  'Azure OpenAI': 'AI & Machine Learning',
  'Azure ML': 'AI & Machine Learning',
  // Security, Identity & Tools
  WAF: 'Security & Tools',
  KMS: 'Security & Tools',
  'Secrets Manager': 'Security & Tools',
  'Cloud Armor': 'Security & Tools',
  'Secret Manager': 'Security & Tools',
  'Key Vault': 'Security & Tools',
  'Defender for Cloud': 'Security & Tools',
  // Management & Monitoring
  CloudWatch: 'Management & Monitoring',
  'Cloud Monitoring': 'Management & Monitoring',
  'Azure Monitor': 'Management & Monitoring',
};

function categoryFor(service: string): string {
  return SERVICE_CATEGORY[service] ?? 'Compute';
}

/** Expand `[sku, price]` pairs into categorized catalog rows for a service. */
function catalogRows(
  provider: CloudProvider,
  region: string,
  service: string,
  unit: CloudPriceUnit,
  entries: [string, string][],
  categoryOverride?: string,
): SeedPrice[] {
  const category = categoryOverride ?? categoryFor(service);
  return entries.map(([skuOrInstance, unitPrice]) => ({
    provider,
    category,
    region,
    service,
    skuOrInstance,
    unit,
    unitPrice,
  }));
}

/** Third-party SaaS subscriptions (provider SAAS, region-agnostic). */
function saasRows(entries: [string, string, string, CloudPriceUnit][]): SeedPrice[] {
  return entries.map(([service, skuOrInstance, unitPrice, unit]) => ({
    provider: CloudProvider.SAAS,
    category: 'SaaS',
    region: 'global',
    service,
    skuOrInstance,
    unit,
    unitPrice,
  }));
}

const HOUR = CloudPriceUnit.HOUR;
const MONTH = CloudPriceUnit.MONTH;
const GB_MONTH = CloudPriceUnit.GB_MONTH;
const GB = CloudPriceUnit.GB;
const REQUEST = CloudPriceUnit.REQUEST;

// A broad compute catalog (FR-21) across AWS / GCP / Azure — general purpose,
// compute/memory/storage optimized, and accelerated (GPU/ML) families, plus
// representative storage. Prices are approximate on-demand USD; an admin "Refresh"
// (FR-21a) re-stamps live prices without touching saved estimate snapshots.
const CLOUD_PRICES: SeedPrice[] = [
  // ── AWS EC2 — us-east-1 (Linux on-demand, USD/hr) ──
  ...catalogRows(CloudProvider.AWS, 'us-east-1', 'EC2', HOUR, [
    // General purpose — burstable (T3 / T4g Graviton)
    ['t3.micro', '0.010400'],
    ['t3.small', '0.020800'],
    ['t3.medium', '0.041600'],
    ['t3.large', '0.083200'],
    ['t3.xlarge', '0.166400'],
    ['t3.2xlarge', '0.332800'],
    ['t4g.medium', '0.033600'],
    ['t4g.large', '0.067200'],
    // General purpose — M5 / M6i / M7i / M7g
    ['m5.large', '0.096000'],
    ['m5.xlarge', '0.192000'],
    ['m5.2xlarge', '0.384000'],
    ['m5.4xlarge', '0.768000'],
    ['m5.8xlarge', '1.536000'],
    ['m5.12xlarge', '2.304000'],
    ['m5.16xlarge', '3.072000'],
    ['m5.24xlarge', '4.608000'],
    ['m6i.large', '0.096000'],
    ['m6i.xlarge', '0.192000'],
    ['m6i.2xlarge', '0.384000'],
    ['m6i.4xlarge', '0.768000'],
    ['m6i.8xlarge', '1.536000'],
    ['m7i.large', '0.100800'],
    ['m7i.xlarge', '0.201600'],
    ['m7i.2xlarge', '0.403200'],
    ['m7g.large', '0.081600'],
    ['m7g.xlarge', '0.163200'],
    // Compute optimized — C5 / C6i / C7g
    ['c5.large', '0.085000'],
    ['c5.xlarge', '0.170000'],
    ['c5.2xlarge', '0.340000'],
    ['c5.4xlarge', '0.680000'],
    ['c5.9xlarge', '1.530000'],
    ['c5.12xlarge', '2.040000'],
    ['c5.18xlarge', '3.060000'],
    ['c5.24xlarge', '4.080000'],
    ['c6i.large', '0.085000'],
    ['c6i.xlarge', '0.170000'],
    ['c6i.2xlarge', '0.340000'],
    ['c6i.4xlarge', '0.680000'],
    ['c7g.large', '0.072500'],
    ['c7g.xlarge', '0.145000'],
    // Memory optimized — R5 / R6i / X2idn
    ['r5.large', '0.126000'],
    ['r5.xlarge', '0.252000'],
    ['r5.2xlarge', '0.504000'],
    ['r5.4xlarge', '1.008000'],
    ['r5.8xlarge', '2.016000'],
    ['r5.12xlarge', '3.024000'],
    ['r5.16xlarge', '4.032000'],
    ['r5.24xlarge', '6.048000'],
    ['r6i.large', '0.126000'],
    ['r6i.xlarge', '0.252000'],
    ['r6i.2xlarge', '0.504000'],
    ['x2idn.16xlarge', '6.668160'],
    ['x2idn.32xlarge', '13.336320'],
    // Storage optimized — I3 / I4i / D3
    ['i3.large', '0.156000'],
    ['i3.xlarge', '0.312000'],
    ['i3.2xlarge', '0.624000'],
    ['i3.4xlarge', '1.248000'],
    ['i4i.large', '0.171600'],
    ['i4i.xlarge', '0.343200'],
    ['d3.xlarge', '0.499000'],
    ['d3.2xlarge', '0.998000'],
    // Accelerated computing — GPU / ML (G / P / Inf / Trn)
    ['g4dn.xlarge', '0.526000'],
    ['g4dn.2xlarge', '0.752000'],
    ['g4dn.12xlarge', '3.912000'],
    ['g5.xlarge', '1.006000'],
    ['g5.2xlarge', '1.212000'],
    ['g5.12xlarge', '5.672000'],
    ['p3.2xlarge', '3.060000'],
    ['p3.8xlarge', '12.240000'],
    ['p4d.24xlarge', '32.772600'],
    ['inf2.xlarge', '0.758200'],
    ['trn1.2xlarge', '1.343800'],
  ]),
  ...catalogRows(CloudProvider.AWS, 'us-east-1', 'S3', GB_MONTH, [
    ['Standard Storage', '0.023000'],
  ]),
  ...catalogRows(CloudProvider.AWS, 'us-east-1', 'EBS', GB_MONTH, [
    ['gp3 SSD', '0.080000'],
    ['io2 SSD', '0.125000'],
  ]),
  ...catalogRows(CloudProvider.AWS, 'eu-west-1', 'EC2', HOUR, [
    ['t3.medium', '0.047040'],
    ['m5.large', '0.107000'],
    ['c5.xlarge', '0.192000'],
  ]),

  // ── GCP Compute Engine — us-central1 (on-demand, USD/hr) ──
  ...catalogRows(CloudProvider.GCP, 'us-central1', 'Compute Engine', HOUR, [
    // General purpose — E2
    ['e2-micro', '0.008376'],
    ['e2-small', '0.016751'],
    ['e2-medium', '0.033503'],
    ['e2-standard-2', '0.067006'],
    ['e2-standard-4', '0.134012'],
    ['e2-standard-8', '0.268024'],
    ['e2-standard-16', '0.536048'],
    ['e2-standard-32', '1.072096'],
    // General purpose — N1
    ['n1-standard-1', '0.047500'],
    ['n1-standard-2', '0.095000'],
    ['n1-standard-4', '0.190000'],
    ['n1-standard-8', '0.380000'],
    ['n1-standard-16', '0.760000'],
    ['n1-standard-32', '1.520000'],
    // General purpose — N2 / N2D / T2D
    ['n2-standard-2', '0.097118'],
    ['n2-standard-4', '0.194240'],
    ['n2-standard-8', '0.388480'],
    ['n2-standard-16', '0.776960'],
    ['n2-standard-32', '1.553920'],
    ['n2-standard-64', '3.107840'],
    ['n2d-standard-2', '0.084528'],
    ['n2d-standard-4', '0.169056'],
    ['n2d-standard-8', '0.338112'],
    ['t2d-standard-2', '0.075738'],
    ['t2d-standard-4', '0.151476'],
    ['t2d-standard-8', '0.302952'],
    // Compute optimized — C2 / C3
    ['c2-standard-4', '0.208800'],
    ['c2-standard-8', '0.417600'],
    ['c2-standard-16', '0.835200'],
    ['c2-standard-30', '1.566000'],
    ['c2-standard-60', '3.132000'],
    ['c3-standard-4', '0.209840'],
    ['c3-standard-8', '0.419680'],
    ['c3-standard-22', '1.154120'],
    // Memory optimized / high-cpu
    ['n2-highmem-2', '0.131036'],
    ['n2-highmem-4', '0.262072'],
    ['n2-highmem-8', '0.524144'],
    ['n2-highcpu-4', '0.143488'],
    ['n2-highcpu-8', '0.286976'],
    ['n2-highcpu-16', '0.573952'],
    ['m1-megamem-96', '10.674000'],
    ['m1-ultramem-40', '6.303850'],
    ['m2-ultramem-208', '42.186380'],
    // Accelerated — A100 / L4
    ['a2-highgpu-1g', '3.673385'],
    ['a2-highgpu-2g', '7.346770'],
    ['g2-standard-4', '0.850330'],
    ['g2-standard-8', '1.022350'],
  ]),
  ...catalogRows(CloudProvider.GCP, 'us-central1', 'Cloud Storage', GB_MONTH, [
    ['Standard Storage', '0.020000'],
    ['SSD Persistent Disk', '0.170000'],
    ['Balanced PD', '0.100000'],
  ]),
  ...catalogRows(CloudProvider.GCP, 'europe-west1', 'Compute Engine', HOUR, [
    ['e2-standard-2', '0.073700'],
    ['n2-standard-4', '0.213660'],
  ]),

  // ── Azure Virtual Machines — eastus (Linux pay-as-you-go, USD/hr) ──
  ...catalogRows(CloudProvider.AZURE, 'eastus', 'Virtual Machines', HOUR, [
    // Burstable B
    ['B1s', '0.010400'],
    ['B1ms', '0.020700'],
    ['B2s', '0.041600'],
    ['B2ms', '0.083200'],
    ['B4ms', '0.166000'],
    ['B8ms', '0.333000'],
    // General purpose D-series (v5 / v3 / AMD as_v5)
    ['D2s_v5', '0.096000'],
    ['D4s_v5', '0.192000'],
    ['D8s_v5', '0.384000'],
    ['D16s_v5', '0.768000'],
    ['D32s_v5', '1.536000'],
    ['D48s_v5', '2.304000'],
    ['D64s_v5', '3.072000'],
    ['D2s_v3', '0.096000'],
    ['D4s_v3', '0.192000'],
    ['D8s_v3', '0.384000'],
    ['D16s_v3', '0.768000'],
    ['D2as_v5', '0.086000'],
    ['D4as_v5', '0.172000'],
    ['D8as_v5', '0.344000'],
    // Compute optimized F
    ['F2s_v2', '0.084600'],
    ['F4s_v2', '0.169000'],
    ['F8s_v2', '0.338000'],
    ['F16s_v2', '0.676000'],
    ['F32s_v2', '1.352000'],
    ['F64s_v2', '2.704000'],
    // Memory optimized E / M
    ['E2s_v5', '0.126000'],
    ['E4s_v5', '0.252000'],
    ['E8s_v5', '0.504000'],
    ['E16s_v5', '1.008000'],
    ['E32s_v5', '2.016000'],
    ['E64s_v5', '4.032000'],
    ['E2as_v5', '0.113400'],
    ['E4as_v5', '0.226800'],
    ['M64s', '8.111000'],
    ['M128s', '16.222000'],
    // Storage optimized L
    ['L8s_v3', '0.624000'],
    ['L16s_v3', '1.248000'],
    ['L32s_v3', '2.496000'],
    // GPU N-series
    ['NC4as_T4_v3', '0.526000'],
    ['NC8as_T4_v3', '0.752000'],
    ['NC24ads_A100_v4', '3.672600'],
    ['ND96asr_A100_v4', '27.197000'],
    ['NV6', '1.140000'],
    ['NV12', '2.280000'],
  ]),
  ...catalogRows(CloudProvider.AZURE, 'eastus', 'Blob Storage', GB_MONTH, [
    ['Hot LRS', '0.018400'],
  ]),
  ...catalogRows(CloudProvider.AZURE, 'eastus', 'Managed Disks', GB_MONTH, [
    ['Premium SSD', '0.135000'],
    ['Standard SSD', '0.075000'],
  ]),
  ...catalogRows(CloudProvider.AZURE, 'westeurope', 'Virtual Machines', HOUR, [
    ['B2ms', '0.091500'],
    ['D2s_v5', '0.105000'],
  ]),

  // ═══ AWS — beyond compute (us-east-1) ═══
  ...catalogRows(CloudProvider.AWS, 'us-east-1', 'S3', GB_MONTH, [
    ['Infrequent Access', '0.012500'],
    ['Glacier Flexible', '0.003600'],
    ['Glacier Deep Archive', '0.000990'],
  ]),
  ...catalogRows(CloudProvider.AWS, 'us-east-1', 'EFS', GB_MONTH, [['Standard', '0.300000']]),
  ...catalogRows(CloudProvider.AWS, 'us-east-1', 'Data Transfer', GB, [
    ['Data Out to Internet', '0.090000'],
  ]),
  ...catalogRows(CloudProvider.AWS, 'us-east-1', 'Elastic Load Balancing', HOUR, [
    ['Application Load Balancer', '0.022500'],
    ['Network Load Balancer', '0.022500'],
  ]),
  ...catalogRows(CloudProvider.AWS, 'us-east-1', 'NAT Gateway', HOUR, [
    ['NAT Gateway', '0.045000'],
  ]),
  ...catalogRows(CloudProvider.AWS, 'us-east-1', 'CloudFront', GB, [
    ['Data Transfer Out', '0.085000'],
  ]),
  ...catalogRows(CloudProvider.AWS, 'us-east-1', 'Route 53', MONTH, [['Hosted Zone', '0.500000']]),
  ...catalogRows(CloudProvider.AWS, 'us-east-1', 'VPN / Direct Connect', HOUR, [
    ['Site-to-Site VPN', '0.050000'],
    ['Direct Connect 1Gbps', '0.300000'],
  ]),
  ...catalogRows(CloudProvider.AWS, 'us-east-1', 'RDS', HOUR, [
    ['db.m5.large MySQL', '0.171000'],
    ['db.r5.large PostgreSQL', '0.250000'],
    ['Aurora db.r5.large', '0.290000'],
  ]),
  ...catalogRows(CloudProvider.AWS, 'us-east-1', 'DynamoDB', GB_MONTH, [
    ['On-Demand Storage', '0.250000'],
  ]),
  ...catalogRows(CloudProvider.AWS, 'us-east-1', 'ElastiCache', HOUR, [
    ['cache.m5.large', '0.156000'],
  ]),
  ...catalogRows(CloudProvider.AWS, 'us-east-1', 'Lambda', REQUEST, [
    ['Requests (per 1M)', '0.200000'],
  ]),
  ...catalogRows(CloudProvider.AWS, 'us-east-1', 'Fargate', HOUR, [
    ['vCPU', '0.040480'],
    ['Memory GB', '0.004445'],
  ]),
  ...catalogRows(CloudProvider.AWS, 'us-east-1', 'EKS', HOUR, [['Cluster', '0.100000']]),
  ...catalogRows(CloudProvider.AWS, 'us-east-1', 'Athena', GB, [['Data Scanned', '0.005000']]),
  ...catalogRows(CloudProvider.AWS, 'us-east-1', 'Kinesis Data Streams', HOUR, [
    ['Shard', '0.015000'],
  ]),
  ...catalogRows(CloudProvider.AWS, 'us-east-1', 'SageMaker', HOUR, [['ml.m5.xlarge', '0.230000']]),
  ...catalogRows(CloudProvider.AWS, 'us-east-1', 'Bedrock', REQUEST, [
    ['Claude (per 1K tokens)', '0.008000'],
  ]),
  ...catalogRows(CloudProvider.AWS, 'us-east-1', 'WAF', MONTH, [['Web ACL', '5.000000']]),
  ...catalogRows(CloudProvider.AWS, 'us-east-1', 'KMS', MONTH, [['Customer Key', '1.000000']]),
  ...catalogRows(CloudProvider.AWS, 'us-east-1', 'Secrets Manager', MONTH, [
    ['Secret', '0.400000'],
  ]),
  ...catalogRows(CloudProvider.AWS, 'us-east-1', 'CloudWatch', MONTH, [
    ['Custom Metric', '0.300000'],
  ]),

  // ═══ GCP — beyond compute (us-central1) ═══
  ...catalogRows(CloudProvider.GCP, 'us-central1', 'Cloud Storage', GB_MONTH, [
    ['Nearline', '0.010000'],
    ['Coldline', '0.004000'],
    ['Archive', '0.001200'],
  ]),
  ...catalogRows(CloudProvider.GCP, 'us-central1', 'Filestore', GB_MONTH, [
    ['Basic HDD', '0.200000'],
  ]),
  ...catalogRows(CloudProvider.GCP, 'us-central1', 'Network Egress', GB, [
    ['Internet Egress', '0.120000'],
  ]),
  ...catalogRows(CloudProvider.GCP, 'us-central1', 'Cloud Load Balancing', HOUR, [
    ['Forwarding Rule', '0.025000'],
  ]),
  ...catalogRows(CloudProvider.GCP, 'us-central1', 'Cloud NAT', HOUR, [['Gateway', '0.044000']]),
  ...catalogRows(CloudProvider.GCP, 'us-central1', 'Cloud CDN', GB, [['Cache Egress', '0.080000']]),
  ...catalogRows(CloudProvider.GCP, 'us-central1', 'Cloud DNS', MONTH, [
    ['Managed Zone', '0.200000'],
  ]),
  ...catalogRows(CloudProvider.GCP, 'us-central1', 'Cloud VPN / Interconnect', HOUR, [
    ['HA VPN Tunnel', '0.050000'],
    ['Interconnect 10Gbps', '1.640000'],
  ]),
  ...catalogRows(CloudProvider.GCP, 'us-central1', 'Cloud SQL', HOUR, [
    ['db-n1-standard-2', '0.098500'],
    ['db-n1-standard-4', '0.197000'],
  ]),
  ...catalogRows(CloudProvider.GCP, 'us-central1', 'Firestore', GB_MONTH, [
    ['Stored Data', '0.180000'],
  ]),
  ...catalogRows(CloudProvider.GCP, 'us-central1', 'Memorystore', GB_MONTH, [
    ['Redis GB', '0.049000'],
  ]),
  ...catalogRows(CloudProvider.GCP, 'us-central1', 'Cloud Functions', REQUEST, [
    ['Invocations (per 1M)', '0.400000'],
  ]),
  ...catalogRows(CloudProvider.GCP, 'us-central1', 'Cloud Run', HOUR, [
    ['vCPU', '0.086400'],
    ['Memory GB', '0.009000'],
  ]),
  ...catalogRows(CloudProvider.GCP, 'us-central1', 'GKE', HOUR, [
    ['Cluster Management', '0.100000'],
  ]),
  ...catalogRows(CloudProvider.GCP, 'us-central1', 'BigQuery', GB, [['Query Scanned', '0.006250']]),
  ...catalogRows(CloudProvider.GCP, 'us-central1', 'Dataflow', HOUR, [['vCPU', '0.069000']]),
  ...catalogRows(CloudProvider.GCP, 'us-central1', 'Vertex AI', HOUR, [
    ['Training n1-standard-4', '0.490000'],
  ]),
  ...catalogRows(CloudProvider.GCP, 'us-central1', 'Cloud Armor', MONTH, [
    ['Security Policy', '5.000000'],
  ]),
  ...catalogRows(CloudProvider.GCP, 'us-central1', 'Secret Manager', MONTH, [
    ['Secret Version', '0.060000'],
  ]),
  ...catalogRows(CloudProvider.GCP, 'us-central1', 'Cloud Monitoring', GB, [
    ['Log Ingestion', '0.500000'],
  ]),

  // ═══ Azure — beyond compute (eastus) ═══
  ...catalogRows(CloudProvider.AZURE, 'eastus', 'Blob Storage', GB_MONTH, [
    ['Cool LRS', '0.010000'],
    ['Archive LRS', '0.000990'],
  ]),
  ...catalogRows(CloudProvider.AZURE, 'eastus', 'Azure Files', GB_MONTH, [
    ['Standard', '0.060000'],
  ]),
  ...catalogRows(CloudProvider.AZURE, 'eastus', 'Load Balancer', HOUR, [
    ['Standard Rule', '0.025000'],
  ]),
  ...catalogRows(CloudProvider.AZURE, 'eastus', 'Application Gateway', HOUR, [
    ['Standard_v2', '0.025200'],
  ]),
  ...catalogRows(CloudProvider.AZURE, 'eastus', 'Front Door / CDN', GB, [
    ['Data Transfer Out', '0.081000'],
  ]),
  ...catalogRows(CloudProvider.AZURE, 'eastus', 'DNS / VPN Gateway', HOUR, [
    ['VPN Gateway VpnGw1', '0.190000'],
  ]),
  ...catalogRows(CloudProvider.AZURE, 'eastus', 'DNS / VPN Gateway', MONTH, [
    ['DNS Zone', '0.500000'],
  ]),
  ...catalogRows(CloudProvider.AZURE, 'eastus', 'Azure SQL Database', HOUR, [
    ['S3 (100 DTU)', '0.201600'],
    ['GP Gen5 2 vCore', '0.252800'],
  ]),
  ...catalogRows(CloudProvider.AZURE, 'eastus', 'Cosmos DB', HOUR, [
    ['Provisioned (per 100 RU/s)', '0.008000'],
  ]),
  ...catalogRows(CloudProvider.AZURE, 'eastus', 'Cache for Redis', HOUR, [
    ['C1 Standard', '0.055000'],
  ]),
  ...catalogRows(CloudProvider.AZURE, 'eastus', 'Azure Functions', REQUEST, [
    ['Executions (per 1M)', '0.200000'],
  ]),
  ...catalogRows(CloudProvider.AZURE, 'eastus', 'Container Instances', HOUR, [
    ['vCPU', '0.050600'],
  ]),
  ...catalogRows(CloudProvider.AZURE, 'eastus', 'AKS', HOUR, [
    ['Cluster (Standard tier)', '0.100000'],
  ]),
  ...catalogRows(CloudProvider.AZURE, 'eastus', 'Synapse Analytics', GB, [
    ['Data Scanned', '0.005000'],
  ]),
  ...catalogRows(CloudProvider.AZURE, 'eastus', 'Event Hubs', HOUR, [
    ['Throughput Unit', '0.030000'],
  ]),
  ...catalogRows(CloudProvider.AZURE, 'eastus', 'Azure OpenAI', REQUEST, [
    ['GPT-4o (per 1K tokens)', '0.005000'],
  ]),
  ...catalogRows(CloudProvider.AZURE, 'eastus', 'Azure ML', HOUR, [['Compute D3 v2', '0.230000']]),
  ...catalogRows(CloudProvider.AZURE, 'eastus', 'Key Vault', REQUEST, [
    ['Operations (per 10K)', '0.030000'],
  ]),
  ...catalogRows(CloudProvider.AZURE, 'eastus', 'Defender for Cloud', MONTH, [
    ['Per Server', '15.000000'],
  ]),
  ...catalogRows(CloudProvider.AZURE, 'eastus', 'Azure Monitor', GB, [
    ['Log Ingestion', '2.300000'],
  ]),

  // ═══ Managed Services (cloud-vendor managed offerings) ═══
  ...catalogRows(CloudProvider.AWS, 'us-east-1', 'Amazon MSK', HOUR, [['kafka.m5.large broker', '0.210000']], 'Managed Services'), // prettier-ignore
  ...catalogRows(CloudProvider.AWS, 'us-east-1', 'Amazon MQ', HOUR, [['mq.m5.large', '0.300000']], 'Managed Services'), // prettier-ignore
  ...catalogRows(CloudProvider.AWS, 'us-east-1', 'Amazon MWAA', HOUR, [['Small Environment', '0.490000']], 'Managed Services'), // prettier-ignore
  ...catalogRows(CloudProvider.AWS, 'us-east-1', 'Managed Grafana', MONTH, [['Active User', '9.000000']], 'Managed Services'), // prettier-ignore
  ...catalogRows(CloudProvider.AWS, 'us-east-1', 'AWS Backup', GB_MONTH, [['Backup Storage', '0.050000']], 'Managed Services'), // prettier-ignore
  ...catalogRows(CloudProvider.AWS, 'us-east-1', 'AWS Support', MONTH, [['Business (minimum)', '100.000000']], 'Managed Services'), // prettier-ignore
  ...catalogRows(CloudProvider.GCP, 'us-central1', 'Cloud Composer', HOUR, [['Small Environment', '0.074000']], 'Managed Services'), // prettier-ignore
  ...catalogRows(CloudProvider.GCP, 'us-central1', 'Anthos', MONTH, [['Per vCPU', '6.000000']], 'Managed Services'), // prettier-ignore
  ...catalogRows(CloudProvider.GCP, 'us-central1', 'Apigee', REQUEST, [['API Calls (per 1M)', '20.000000']], 'Managed Services'), // prettier-ignore
  ...catalogRows(CloudProvider.GCP, 'us-central1', 'Backup for GKE', GB_MONTH, [['Protected Data', '0.080000']], 'Managed Services'), // prettier-ignore
  ...catalogRows(CloudProvider.GCP, 'us-central1', 'Google Cloud Support', MONTH, [['Standard (minimum)', '29.000000']], 'Managed Services'), // prettier-ignore
  ...catalogRows(CloudProvider.AZURE, 'eastus', 'Azure Backup', MONTH, [['Protected Instance', '5.000000']], 'Managed Services'), // prettier-ignore
  ...catalogRows(CloudProvider.AZURE, 'eastus', 'Site Recovery', MONTH, [['Protected Instance', '25.000000']], 'Managed Services'), // prettier-ignore
  ...catalogRows(CloudProvider.AZURE, 'eastus', 'API Management', HOUR, [['Standard (per unit)', '0.952000']], 'Managed Services'), // prettier-ignore
  ...catalogRows(CloudProvider.AZURE, 'eastus', 'Azure Arc', MONTH, [['Managed Server', '6.000000']], 'Managed Services'), // prettier-ignore
  ...catalogRows(CloudProvider.AZURE, 'eastus', 'Azure Support', MONTH, [['Standard (minimum)', '100.000000']], 'Managed Services'), // prettier-ignore

  // ═══ SaaS (third-party subscriptions; provider SAAS, region-agnostic) ═══
  ...saasRows([
    // Observability & operations
    ['Datadog', 'Pro (per host/mo)', '15.000000', MONTH],
    ['New Relic', 'Standard (per user/mo)', '49.000000', MONTH],
    ['Grafana Cloud', 'Pro (per user/mo)', '8.000000', MONTH],
    ['PagerDuty', 'Professional (per user/mo)', '21.000000', MONTH],
    ['Splunk Cloud', 'Ingest (per GB/mo)', '2.000000', GB_MONTH],
    // Data & analytics
    ['Snowflake', 'Standard (per credit)', '2.000000', REQUEST],
    ['Databricks', 'Jobs Compute (per DBU)', '0.150000', REQUEST],
    ['MongoDB Atlas', 'M10 Dedicated', '0.080000', HOUR],
    ['Confluent Cloud', 'Standard (per CKU/hr)', '2.250000', HOUR],
    // Identity & security
    ['Okta', 'SSO (per user/mo)', '2.000000', MONTH],
    ['Auth0', 'B2B Essentials (base/mo)', '150.000000', MONTH],
    ['1Password', 'Business (per user/mo)', '7.990000', MONTH],
    ['CrowdStrike Falcon', 'Pro (per endpoint/mo)', '8.000000', MONTH],
    ['Cloudflare', 'Business (per domain/mo)', '200.000000', MONTH],
    // Productivity & collaboration
    ['Microsoft 365', 'E3 (per user/mo)', '36.000000', MONTH],
    ['Google Workspace', 'Business Standard (per user/mo)', '12.000000', MONTH],
    ['Slack', 'Business+ (per user/mo)', '12.500000', MONTH],
    ['Zoom', 'Business (per user/mo)', '18.320000', MONTH],
    // Developer & project
    ['GitHub Enterprise', 'Per user/mo', '21.000000', MONTH],
    ['GitLab', 'Ultimate (per user/mo)', '99.000000', MONTH],
    ['Atlassian Jira', 'Standard (per user/mo)', '8.150000', MONTH],
    ['Atlassian Confluence', 'Standard (per user/mo)', '6.050000', MONTH],
    // Business
    ['Salesforce', 'Enterprise (per user/mo)', '165.000000', MONTH],
    ['HubSpot', 'Professional (base/mo)', '800.000000', MONTH],
    // Communications
    ['Twilio', 'SMS (per message)', '0.007900', REQUEST],
    ['SendGrid', 'Pro (base/mo)', '89.950000', MONTH],
  ]),
];

async function seedCloudPrices() {
  for (const p of CLOUD_PRICES) {
    await prisma.cloudPrice.upsert({
      where: {
        provider_region_service_skuOrInstance_unit: {
          provider: p.provider,
          region: p.region,
          service: p.service,
          skuOrInstance: p.skuOrInstance,
          unit: p.unit,
        },
      },
      update: { unitPrice: p.unitPrice, category: p.category },
      create: {
        provider: p.provider,
        category: p.category,
        region: p.region,
        service: p.service,
        skuOrInstance: p.skuOrInstance,
        unit: p.unit,
        unitPrice: p.unitPrice,
        currency: 'USD',
        source: CloudPriceSource.CATALOG_SEED,
      },
    });
  }
}

async function seedDefaultWorkflow(adminId: string) {
  const existing = await prisma.workflowDefinition.findFirst({ where: { isDefault: true } });
  if (existing) return existing;

  const def = await prisma.workflowDefinition.create({
    data: {
      key: 'WF-DEFAULT',
      name: 'Default Approval Workflow',
      description: 'The standard estimate approval lifecycle.',
      isDefault: true,
      isActive: true,
      createdById: adminId,
    },
  });

  const stagesData = [
    { key: 'DRAFT', label: 'Draft', sortOrder: 1, isInitial: true, isTerminal: false },
    { key: 'IN_REVIEW', label: 'In Review', sortOrder: 2, isInitial: false, isTerminal: false },
    { key: 'APPROVED', label: 'Approved', sortOrder: 3, isInitial: false, isTerminal: false },
    { key: 'FINAL', label: 'Final', sortOrder: 4, isInitial: false, isTerminal: true },
    { key: 'ARCHIVED', label: 'Archived', sortOrder: 5, isInitial: false, isTerminal: true },
  ];
  const stageIds: Record<string, string> = {};
  for (const s of stagesData) {
    const created = await prisma.workflowStage.create({
      data: { ...s, workflowDefinitionId: def.id },
    });
    stageIds[s.key] = created.id;
  }

  const transitions = [
    {
      from: 'DRAFT',
      to: 'IN_REVIEW',
      allowedRole: Role.ESTIMATOR,
      label: 'Submit for review',
      requiresChecklistPass: true,
    },
    {
      from: 'IN_REVIEW',
      to: 'DRAFT',
      allowedRole: Role.ESTIMATOR,
      label: 'Return to draft',
      requiresChecklistPass: false,
    },
    {
      from: 'IN_REVIEW',
      to: 'APPROVED',
      allowedRole: Role.ADMIN,
      label: 'Approve',
      requiresChecklistPass: true,
    },
    {
      from: 'APPROVED',
      to: 'FINAL',
      allowedRole: Role.ADMIN,
      label: 'Finalize',
      requiresChecklistPass: true,
    },
    {
      from: 'FINAL',
      to: 'ARCHIVED',
      allowedRole: Role.ADMIN,
      label: 'Archive',
      requiresChecklistPass: false,
    },
  ];
  for (const t of transitions) {
    await prisma.workflowTransition.create({
      data: {
        key: `TR-${t.from}__${t.to}`,
        workflowDefinitionId: def.id,
        fromStageId: stageIds[t.from],
        toStageId: stageIds[t.to],
        allowedRole: t.allowedRole,
        label: t.label,
        requiresChecklistPass: t.requiresChecklistPass,
      },
    });
  }
  return def;
}

const CHECKLIST_RULES = [
  {
    key: 'rate_card_selected',
    description: 'A rate card is selected for the estimate',
    severity: ChecklistSeverity.BLOCKER,
    scope: ChecklistScope.ESTIMATE,
  },
  {
    key: 'labor_role_assigned',
    description: 'Every labor line has a role/resource assigned with quantity and units',
    severity: ChecklistSeverity.BLOCKER,
    scope: ChecklistScope.LABOR,
  },
  {
    key: 'cloud_line_complete',
    description:
      'Every cloud line has provider, region, instance, usage and a snapshotted unit price',
    severity: ChecklistSeverity.BLOCKER,
    scope: ChecklistScope.CLOUD,
  },
  {
    key: 'nonlabor_amount_period',
    description: 'Every non-labor line has an amount and a billing period',
    severity: ChecklistSeverity.BLOCKER,
    scope: ChecklistScope.NONLABOR,
  },
  {
    key: 'billing_period_set',
    description: 'No recurring line is missing a billing period',
    severity: ChecklistSeverity.BLOCKER,
    scope: ChecklistScope.ESTIMATE,
  },
  {
    key: 'resource_capacity',
    description: 'No resource is allocated over 100% on any date',
    severity: ChecklistSeverity.BLOCKER,
    scope: ChecklistScope.RESOURCE,
  },
  {
    key: 'upcharge_set',
    description: 'An upcharge percentage is set (or explicitly zero)',
    severity: ChecklistSeverity.WARNING,
    scope: ChecklistScope.ESTIMATE,
  },
  {
    key: 'contingency_set',
    description: 'A contingency percentage is set (or explicitly zero)',
    severity: ChecklistSeverity.WARNING,
    scope: ChecklistScope.ESTIMATE,
  },
  {
    key: 'totals_reconcile',
    description: 'One-time, monthly and yearly totals reconcile',
    severity: ChecklistSeverity.INFO,
    scope: ChecklistScope.ESTIMATE,
  },
];

async function seedChecklistRules() {
  for (const r of CHECKLIST_RULES) {
    await prisma.checklistRule.upsert({
      where: { key: r.key },
      update: { description: r.description, severity: r.severity, scope: r.scope },
      create: {
        key: r.key,
        description: r.description,
        severity: r.severity,
        scope: r.scope,
        isBuiltin: true,
      },
    });
  }
}

// ─── Reference data (FR-29, NFR-17) ──────────────────────────────────────────
// Baseline DB-driven reference/lookup values. Built-ins (is_builtin) may be
// deactivated/renamed/re-sequenced by admins but not deleted. Idempotent.

interface RefVal {
  code: string;
  name: string;
  children?: { code: string; name: string }[];
}
interface RefType {
  code: string;
  name: string;
  desc?: string;
  values: RefVal[];
}

const REFERENCE_DATA: RefType[] = [
  {
    code: 'SDLC_PHASE',
    name: 'SDLC Phase',
    desc: 'Software delivery lifecycle phases and their tasks',
    values: [
      {
        code: 'PLANNING',
        name: 'Planning',
        children: [
          { code: 'REQUIREMENTS', name: 'Requirements' },
          { code: 'ESTIMATION', name: 'Estimation' },
        ],
      },
      {
        code: 'DESIGN',
        name: 'Design',
        children: [
          { code: 'ARCHITECTURE', name: 'Architecture' },
          { code: 'UX_DESIGN', name: 'UX Design' },
        ],
      },
      {
        code: 'DEVELOPMENT',
        name: 'Development',
        children: [
          { code: 'CODING', name: 'Coding' },
          { code: 'CODE_REVIEW', name: 'Code Review' },
        ],
      },
      {
        code: 'TESTING',
        name: 'Testing',
        children: [
          { code: 'UNIT_TESTING', name: 'Unit Testing' },
          { code: 'INTEGRATION_TESTING', name: 'Integration Testing' },
          { code: 'UAT', name: 'User Acceptance Testing' },
        ],
      },
      {
        code: 'DEPLOYMENT',
        name: 'Deployment',
        children: [
          { code: 'RELEASE', name: 'Release' },
          { code: 'CUTOVER', name: 'Cutover' },
        ],
      },
      {
        code: 'MAINTENANCE',
        name: 'Maintenance',
        children: [
          { code: 'SUPPORT', name: 'Support' },
          { code: 'ENHANCEMENTS', name: 'Enhancements' },
        ],
      },
    ],
  },
  {
    code: 'ESTIMATE_STATUS',
    name: 'Estimate Status',
    values: [
      { code: 'DRAFT', name: 'Draft' },
      { code: 'FINAL', name: 'Final' },
    ],
  },
  {
    code: 'BILLING_PERIOD',
    name: 'Billing Period',
    values: [
      { code: 'ONE_TIME', name: 'One-time' },
      { code: 'MONTHLY', name: 'Monthly' },
      { code: 'YEARLY', name: 'Yearly' },
    ],
  },
  {
    code: 'RATE_UNIT',
    name: 'Rate Unit',
    values: [
      { code: 'HOUR', name: 'Hour' },
      { code: 'DAY', name: 'Day' },
    ],
  },
  {
    code: 'CLOUD_PROVIDER',
    name: 'Cloud Provider',
    values: [
      { code: 'AWS', name: 'Amazon Web Services' },
      { code: 'GCP', name: 'Google Cloud' },
      { code: 'AZURE', name: 'Microsoft Azure' },
    ],
  },
  {
    code: 'CLOUD_PRICE_UNIT',
    name: 'Cloud Price Unit',
    values: [
      { code: 'HOUR', name: 'Hour' },
      { code: 'MONTH', name: 'Month' },
      { code: 'GB_MONTH', name: 'GB-month' },
      { code: 'REQUEST', name: 'Request' },
    ],
  },
  {
    code: 'NON_LABOR_TYPE',
    name: 'Non-Labor Type',
    values: [
      { code: 'FIXED', name: 'Fixed' },
      { code: 'RECURRING', name: 'Recurring' },
    ],
  },
  {
    code: 'ROLE',
    name: 'User Role',
    values: [
      { code: 'ADMIN', name: 'Administrator' },
      { code: 'ESTIMATOR', name: 'Estimator' },
      { code: 'VIEWER', name: 'Viewer' },
    ],
  },
  {
    code: 'COST_CATEGORY',
    name: 'Cost Category',
    values: [
      { code: 'LABOR', name: 'Labor' },
      { code: 'LICENSES', name: 'Licenses' },
      { code: 'INFRASTRUCTURE', name: 'Infrastructure' },
      { code: 'THIRD_PARTY', name: 'Third-party Services' },
      { code: 'TRAVEL', name: 'Travel' },
      { code: 'OTHER', name: 'Other' },
    ],
  },
  {
    code: 'CHECKLIST_SEVERITY',
    name: 'Checklist Severity',
    values: [
      { code: 'BLOCKER', name: 'Blocker' },
      { code: 'WARNING', name: 'Warning' },
      { code: 'INFO', name: 'Info' },
    ],
  },
  {
    code: 'CHECKLIST_SCOPE',
    name: 'Checklist Scope',
    values: [
      { code: 'ESTIMATE', name: 'Estimate' },
      { code: 'LABOR', name: 'Labor' },
      { code: 'NONLABOR', name: 'Non-labor' },
      { code: 'CLOUD', name: 'Cloud' },
      { code: 'RESOURCE', name: 'Resource' },
    ],
  },
  {
    code: 'WORKFLOW_STAGE',
    name: 'Workflow Stage',
    values: [
      { code: 'DRAFT', name: 'Draft' },
      { code: 'IN_REVIEW', name: 'In Review' },
      { code: 'APPROVED', name: 'Approved' },
      { code: 'FINAL', name: 'Final' },
      { code: 'ARCHIVED', name: 'Archived' },
    ],
  },
  {
    code: 'PRIORITY',
    name: 'Priority',
    values: [
      { code: 'LOW', name: 'Low' },
      { code: 'MEDIUM', name: 'Medium' },
      { code: 'HIGH', name: 'High' },
      { code: 'CRITICAL', name: 'Critical' },
    ],
  },
  {
    code: 'RESOURCE_TYPE',
    name: 'Resource Type',
    values: [
      { code: 'EMPLOYEE', name: 'Employee' },
      { code: 'CONTRACTOR', name: 'Contractor' },
      { code: 'VENDOR', name: 'Vendor' },
    ],
  },
  {
    code: 'TESTING_PHASE',
    name: 'Testing Phase',
    desc: 'Testing phases and their testing types',
    values: [
      { code: 'UNIT', name: 'Unit', children: [{ code: 'COMPONENT', name: 'Component' }] },
      {
        code: 'INTEGRATION',
        name: 'Integration',
        children: [
          { code: 'API_TESTING', name: 'API Testing' },
          { code: 'CONTRACT_TESTING', name: 'Contract Testing' },
        ],
      },
      {
        code: 'SYSTEM',
        name: 'System',
        children: [
          { code: 'E2E', name: 'End-to-end' },
          { code: 'REGRESSION', name: 'Regression' },
        ],
      },
      {
        code: 'ACCEPTANCE',
        name: 'Acceptance',
        children: [
          { code: 'UAT', name: 'User Acceptance' },
          { code: 'PERFORMANCE', name: 'Performance' },
          { code: 'SECURITY', name: 'Security' },
        ],
      },
    ],
  },
  {
    code: 'DOCUMENT_TYPE',
    name: 'Document Type',
    values: [
      { code: 'SOW', name: 'Statement of Work' },
      { code: 'PROPOSAL', name: 'Proposal' },
      { code: 'ESTIMATE_SUMMARY', name: 'Estimate Summary' },
      { code: 'ARCHITECTURE', name: 'Architecture Document' },
    ],
  },
];

async function seedReferenceData(adminId: string): Promise<void> {
  for (let ti = 0; ti < REFERENCE_DATA.length; ti++) {
    const t = REFERENCE_DATA[ti];
    const type = await prisma.referenceType.upsert({
      where: { code: t.code },
      update: { displayName: t.name, description: t.desc ?? null, displayOrder: ti + 1 },
      create: {
        code: t.code,
        displayName: t.name,
        description: t.desc ?? null,
        displayOrder: ti + 1,
        createdById: adminId,
        updatedById: adminId,
      },
    });
    for (let vi = 0; vi < t.values.length; vi++) {
      const v = t.values[vi];
      const parent = await prisma.referenceValue.upsert({
        where: { referenceTypeId_code: { referenceTypeId: type.id, code: v.code } },
        update: { displayName: v.name, displayOrder: vi + 1, parentId: null, isBuiltin: true },
        create: {
          referenceTypeId: type.id,
          code: v.code,
          displayName: v.name,
          displayOrder: vi + 1,
          isBuiltin: true,
          createdById: adminId,
          updatedById: adminId,
        },
      });
      const children = v.children ?? [];
      for (let ci = 0; ci < children.length; ci++) {
        const c = children[ci];
        await prisma.referenceValue.upsert({
          where: { referenceTypeId_code: { referenceTypeId: type.id, code: c.code } },
          update: {
            displayName: c.name,
            displayOrder: ci + 1,
            parentId: parent.id,
            isBuiltin: true,
          },
          create: {
            referenceTypeId: type.id,
            parentId: parent.id,
            code: c.code,
            displayName: c.name,
            displayOrder: ci + 1,
            isBuiltin: true,
            createdById: adminId,
            updatedById: adminId,
          },
        });
      }
    }
  }
}

// FX rates vs base USD (FR-17): base units per 1 unit of the currency. Idempotent.
const FX_RATES: { currency: string; rateToBase: string }[] = [
  { currency: 'USD', rateToBase: '1.000000' },
  { currency: 'EUR', rateToBase: '1.080000' },
  { currency: 'GBP', rateToBase: '1.270000' },
  { currency: 'CAD', rateToBase: '0.740000' },
  { currency: 'AUD', rateToBase: '0.660000' },
  { currency: 'JPY', rateToBase: '0.006700' },
];

async function seedFxRates(): Promise<void> {
  for (const r of FX_RATES) {
    await prisma.fxRate.upsert({
      where: { currency: r.currency },
      update: { rateToBase: r.rateToBase },
      create: { currency: r.currency, rateToBase: r.rateToBase },
    });
  }
}

async function main(): Promise<void> {
  const admin = await seedAdmin();
  await seedRateCard(admin.id);
  await seedCloudPrices();
  await seedDefaultWorkflow(admin.id);
  await seedChecklistRules();
  await seedReferenceData(admin.id);
  await seedFxRates();
  console.log(`Seed complete. Admin: ${admin.email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
