// Money formatting shared across the app (FR-7/FR-23). Monetary values render
// with their currency symbol (USD → "$") and grouped 2 decimals: "1234.5" → "$1,234.50".

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  CAD: '$',
  AUD: '$',
  NZD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
  INR: '₹',
};

/** Currency symbol for a code (USD → "$"); falls back to the code itself. */
export function currencySymbol(code: string | null | undefined): string {
  return CURRENCY_SYMBOLS[(code ?? '').toUpperCase()] ?? code ?? '$';
}

/** Format a money value with its currency symbol + grouped 2 decimals. */
export function formatMoney(value: string | number, currency?: string | null): string {
  const sym = currencySymbol(currency);
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return `${sym}${value}`;
  return `${sym}${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
