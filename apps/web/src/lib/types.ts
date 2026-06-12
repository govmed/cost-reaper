export type Role = 'ADMIN' | 'ESTIMATOR' | 'VIEWER';
export type BillingPeriod = 'ONE_TIME' | 'MONTHLY' | 'YEARLY';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  displayName: string | null;
}
export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface EngineResult {
  oneTimeSubtotal: string;
  monthlySubtotal: string;
  yearlySubtotal: string;
  upchargeAmount: string;
  contingencyAmount: string;
  oneTimeTotal: string;
  monthlyTotal: string;
  yearlyTotal: string;
  grandTotal: string;
  categories: { category: string; oneTime: string; monthly: string; yearly: string }[];
}

export interface LaborLine {
  id: string;
  roleName: string | null;
  description: string | null;
  quantity: string;
  units: string;
  rateSnapshot: string;
  upchargePercentOverride: number | null;
  billingPeriod: BillingPeriod;
  lineTotal: string;
}
export interface NonLaborLine {
  id: string;
  category: string;
  description: string | null;
  type: string;
  amount: string;
  upchargePercentOverride: number | null;
  billingPeriod: BillingPeriod;
  periods: number;
  lineTotal: string;
}
export interface CloudLine {
  id: string;
  provider: string;
  region: string;
  service: string;
  skuOrInstance: string;
  quantity: string;
  usageHoursPerMonth: string;
  unitPriceSnapshot: string;
  upchargePercentOverride: number | null;
  billingPeriod: BillingPeriod;
  lineTotal: string;
}
export interface Assumption {
  id: string;
  text: string;
  createdAt: string;
}

export interface EstimateDetail {
  id: string;
  name: string;
  description: string | null;
  status: string;
  currency: string;
  rateCardId: string | null;
  ownerId: string;
  globalUpchargePercent: number;
  contingencyPercent: number;
  laborItems: LaborLine[];
  nonLaborItems: NonLaborLine[];
  cloudItems: CloudLine[];
  assumptions: Assumption[];
  totals: EngineResult;
}

export interface EstimateSummary {
  id: string;
  name: string;
  status: string;
  currency: string;
  ownerId: string;
  grandTotal: string;
  updatedAt: string;
}
export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface RateCardRole {
  id: string;
  roleName: string;
  unit: string;
  rate: string;
}
export interface RateCard {
  id: string;
  name: string;
  currency: string;
  isActive: boolean;
  roles: RateCardRole[];
}
export interface CloudPrice {
  id: string;
  provider: string;
  region: string;
  service: string;
  skuOrInstance: string;
  unit: string;
  unitPrice: string;
  currency: string;
}
