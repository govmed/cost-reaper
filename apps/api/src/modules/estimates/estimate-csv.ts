import type { EngineResult } from '@cost-reaper/types';

export interface CsvLine {
  type: string;
  description: string;
  quantity: string;
  unit: string;
  rate: string;
  billingPeriod: string;
  phase: string;
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
    [
      'Type',
      'Description',
      'Quantity',
      'Unit',
      'Rate/Amount',
      'Billing',
      'SDLC phase',
      'Line total',
    ],
  ];
  for (const l of lines) {
    rows.push([
      l.type,
      l.description,
      l.quantity,
      l.unit,
      l.rate,
      l.billingPeriod,
      l.phase || 'Unassigned',
      l.lineTotal,
    ]);
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
    ['GRAND TOTAL (cost)', totals.grandTotal],
    ['Margin amount', totals.marginAmount],
    ['Sell price', totals.sellPrice],
    ['Tax amount', totals.taxAmount],
    ['CLIENT PRICE', totals.clientPrice],
  );
  if (totals.phases.length) {
    rows.push([], ['Cost by SDLC phase', 'One-time', 'Monthly', 'Yearly']);
    for (const p of totals.phases) {
      rows.push([p.phase, p.oneTime, p.monthly, p.yearly]);
    }
  }
  return rows.map((r) => r.map(esc).join(',')).join('\n') + '\n';
}

/**
 * Render an estimate as a spreadsheet (FR-20 / FE-22). An HTML table served as
 * application/vnd.ms-excel opens natively in Excel/Sheets — no dependency. The
 * same data as the CSV: lines, totals, client pricing, and per-phase summary.
 */
function he(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function toExcelHtml(
  meta: { name: string; currency: string },
  lines: CsvLine[],
  totals: EngineResult,
): string {
  const th = (cells: string[]) =>
    `<tr>${cells.map((c) => `<th align="left">${he(c)}</th>`).join('')}</tr>`;
  const tr = (cells: string[]) => `<tr>${cells.map((c) => `<td>${he(c)}</td>`).join('')}</tr>`;
  const kv = (k: string, v: string) => `<tr><td><b>${he(k)}</b></td><td>${he(v)}</td></tr>`;

  const lineRows = lines
    .map((l) =>
      tr([
        l.type,
        l.description,
        l.quantity,
        l.unit,
        l.rate,
        l.billingPeriod,
        l.phase || 'Unassigned',
        l.lineTotal,
      ]),
    )
    .join('');
  const phaseRows = totals.phases
    .map((p) => tr([p.phase, p.oneTime, p.monthly, p.yearly]))
    .join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>
<table border="1">
${kv('Estimate', meta.name)}
${kv('Currency', meta.currency)}
<tr></tr>
${th(['Type', 'Description', 'Quantity', 'Unit', 'Rate/Amount', 'Billing', 'SDLC phase', 'Line total'])}
${lineRows}
<tr></tr>
${kv('One-time total', totals.oneTimeTotal)}
${kv('Monthly total', totals.monthlyTotal)}
${kv('Yearly total', totals.yearlyTotal)}
${kv('Upcharge', totals.upchargeAmount)}
${kv('Contingency', totals.contingencyAmount)}
${kv('GRAND TOTAL (cost)', totals.grandTotal)}
${kv('Margin', totals.marginAmount)}
${kv('Sell price', totals.sellPrice)}
${kv('Tax', totals.taxAmount)}
${kv('CLIENT PRICE', totals.clientPrice)}
${totals.phases.length ? `<tr></tr>${th(['Cost by SDLC phase', 'One-time', 'Monthly', 'Yearly'])}${phaseRows}` : ''}
</table></body></html>`;
}
