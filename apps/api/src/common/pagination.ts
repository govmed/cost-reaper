import type { Page } from '@cost-reaper/types';

/**
 * Pagination helpers (FR-9). Pure and I/O-free so the slice math is unit-tested
 * in isolation and reused by every list endpoint (estimates, audit, …).
 * Pages are 1-based.
 */

/** Prisma `skip`/`take` for a 1-based page. */
export function pageSkipTake(page: number, pageSize: number): { skip: number; take: number } {
  return { skip: Math.max(0, (page - 1) * pageSize), take: pageSize };
}

/** The last page number for a row count (always ≥ 1, even when empty). */
export function lastPage(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

/**
 * Slice an already-loaded array into a `Page<T>`. Used for small in-memory lists
 * and as the reference implementation the DB-backed `skip`/`take` mirrors.
 */
export function paginate<T>(items: T[], page: number, pageSize: number): Page<T> {
  const { skip, take } = pageSkipTake(page, pageSize);
  return { data: items.slice(skip, skip + take), total: items.length, page, pageSize };
}
