/**
 * Pure mapping for FX refresh (FR-17). Public rate sources (e.g. frankfurter.app
 * `?from=USD`) return **foreign units per 1 USD**. Our `rateToBase` convention is
 * **base (USD) units per 1 unit of the foreign currency**, i.e. the inverse.
 *
 * Returns currency → 6-dp string, only for requested currencies the source
 * provides with a positive, finite rate. USD is always omitted (it is the base,
 * fixed at 1).
 */
export function mapFxRates(
  foreignPerUsd: Record<string, number>,
  currencies: string[],
): Map<string, string> {
  const out = new Map<string, string>();
  for (const cur of currencies) {
    if (cur === 'USD') continue;
    const r = foreignPerUsd[cur];
    if (typeof r === 'number' && r > 0 && Number.isFinite(r)) {
      out.set(cur, (1 / r).toFixed(6));
    }
  }
  return out;
}
