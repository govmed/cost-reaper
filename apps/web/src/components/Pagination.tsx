import { PAGE_SIZE_OPTIONS } from '../lib/usePagedSort';

/**
 * Shared list-pagination control (FR-9) — a rows-per-page dropdown
 * (10/20/25/40/50), an "X–Y of N" range, and Prev/Next with the page position.
 * Used by every list card so pagination looks and behaves the same everywhere.
 */
export function Pagination({
  page,
  lastPage,
  pageSize,
  total,
  rangeStart,
  rangeEnd,
  onPage,
  onPageSize,
}: {
  page: number;
  lastPage: number;
  pageSize: number;
  total: number;
  rangeStart: number;
  rangeEnd: number;
  onPage: (p: number) => void;
  onPageSize: (n: number) => void;
}) {
  const btn =
    'rounded border border-slate-300 px-2 py-1 text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50';
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <label className="flex items-center gap-2 text-slate-600">
        Rows per page
        <select
          value={pageSize}
          onChange={(e) => onPageSize(Number(e.target.value))}
          className="border border-slate-300 rounded px-2 py-1"
        >
          {PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <div className="flex items-center gap-3">
        <span className="text-slate-500 tabular-nums">
          {total === 0 ? '0' : `${rangeStart}–${rangeEnd}`} of {total}
        </span>
        <div className="flex items-center gap-1">
          <button className={btn} disabled={page <= 1} onClick={() => onPage(page - 1)}>
            ‹ Prev
          </button>
          <span className="px-2 text-slate-600 tabular-nums">
            {page} / {lastPage}
          </span>
          <button className={btn} disabled={page >= lastPage} onClick={() => onPage(page + 1)}>
            Next ›
          </button>
        </div>
      </div>
    </div>
  );
}
