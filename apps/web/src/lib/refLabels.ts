import { useReferenceValues } from './queries';

/**
 * Resolve display labels for a reference type (FR-29 / NFR-17). Behavioral enums
 * (billing period, provider, role, …) stay code-coupled, but their *labels* come
 * from the DB reference tables so an admin rename flows to the UI with no code
 * change. Always falls back to the raw code, so it is safe before the request
 * resolves or for an unknown value.
 */
export interface RefLabeler {
  /** Display label for a code (falls back to the code; em-dash for null/empty). */
  label: (code: string | null | undefined) => string;
  /** Active values as `{ code, label }`, in display order (for <select> options). */
  options: { code: string; label: string }[];
  /** true once the reference values have loaded. */
  ready: boolean;
}

export function useRefLabeler(typeCode: string): RefLabeler {
  const { data } = useReferenceValues(typeCode);
  const active = (data ?? []).filter((r) => r.isActive);
  const map = new Map(active.map((r) => [r.code, r.displayName]));
  return {
    label: (code) => (code ? (map.get(code) ?? code) : '—'),
    options: active.map((r) => ({ code: r.code, label: r.displayName })),
    ready: active.length > 0,
  };
}
