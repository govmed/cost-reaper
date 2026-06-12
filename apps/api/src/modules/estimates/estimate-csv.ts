import type { EngineResult } from '@cost-reaper/types';

export interface CsvLine {
  type: string;
  description: string;
  quantity: string;
  unit: string;
  rate: string;
  billingPeriod: string;
  lineTotal: string;
}

function esc(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/** Render an estimate (lines + totals) as CSV (FR-10, FE-21). */
export function toCsv(
  meta: { name: string; currency: string },
  lines: CsvLine[],
  totals: EngineResult,
): string {
  const rows: string[][] = [
    ['Estimate', meta.name],
    ['Currency', meta.currency],
    [],
    ['Type', 'Description', 'Quantity', 'Unit', 'Rate/Amount', 'Billing', 'Line total'],
  ];
  for (const l of lines) {
    rows.push([l.type, l.description, l.quantity, l.unit, l.rate, l.billingPeriod, l.lineTotal]);
  }
  rows.push(
    [],
    ['One-time subtotal', totals.oneTimeSubtotal],
    ['Monthly subtotal', totals.monthlySubtotal],
    ['Yearly subtotal', totals.yearlySubtotal],
    ['Upcharge amount', totals.upchargeAmount],
    ['Contingency amount', totals.contingencyAmount],
    ['One-time total', totals.oneTimeTotal],
    ['Monthly total', totals.monthlyTotal],
    ['Yearly total', totals.yearlyTotal],
    ['GRAND TOTAL', totals.grandTotal],
  );
  return rows.map((r) => r.map(esc).join(',')).join('\n') + '\n';
}
