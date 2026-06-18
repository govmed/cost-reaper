import { useMemo, useState } from 'react';

/** Standard page-size choices offered across every list card (FR-9, usability). */
export const PAGE_SIZE_OPTIONS = [10, 20, 25, 40, 50];

export type SortDir = 'asc' | 'desc';

/** Stable, type-aware comparison: numbers (and numeric strings like money) sort
 *  numerically; nulls sort first; everything else by locale string compare. */
function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  const as = String(a).trim();
  const bs = String(b).trim();
  const an = Number(as);
  const bn = Number(bs);
  if (as !== '' && bs !== '' && !Number.isNaN(an) && !Number.isNaN(bn)) return an - bn;
  return as.localeCompare(bs);
}

/**
 * Client-side sort + pagination for list cards (FR-9). Give it the (already
 * filtered) rows; it returns the current page's rows plus the controls a
 * `<Pagination>` and `<SortableTh>` need. Changing the sort or page size resets
 * to page 1; the page is clamped so it never points past the last page.
 */
export function usePagedSort<T>(
  rows: T[],
  opts: {
    initialSort?: string;
    initialDir?: SortDir;
    initialPageSize?: number;
    /** Pull the sortable value for a column key; defaults to `row[key]`. */
    getValue?: (row: T, key: string) => unknown;
  } = {},
) {
  const [sortKey, setSortKey] = useState<string | null>(opts.initialSort ?? null);
  const [dir, setDir] = useState<SortDir>(opts.initialDir ?? 'asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(opts.initialPageSize ?? 20);
  const getValue = opts.getValue;

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    const get = getValue ?? ((row: T, key: string) => (row as Record<string, unknown>)[key]);
    return [...rows].sort((a, b) => {
      const cmp = compareValues(get(a, sortKey), get(b, sortKey));
      return dir === 'asc' ? cmp : -cmp;
    });
  }, [rows, sortKey, dir, getValue]);

  const total = sorted.length;
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, lastPage);
  const start = (current - 1) * pageSize;
  const pageRows = useMemo(() => sorted.slice(start, start + pageSize), [sorted, start, pageSize]);

  function toggleSort(key: string): void {
    if (sortKey === key) {
      setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setDir('asc');
    }
    setPage(1);
  }

  function changePageSize(n: number): void {
    setPageSize(n);
    setPage(1);
  }

  return {
    pageRows,
    total,
    page: current,
    lastPage,
    pageSize,
    sortKey,
    dir,
    toggleSort,
    setPage,
    setPageSize: changePageSize,
    rangeStart: total === 0 ? 0 : start + 1,
    rangeEnd: Math.min(start + pageSize, total),
  };
}
