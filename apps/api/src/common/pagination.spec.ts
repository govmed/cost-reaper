/**
 * Pagination — QA for the list-query contracts and the pure slice helpers
 * (FR-9). The `pageSkipTake` helper is what the real estimates/audit list
 * endpoints use, so these cover production paging, not a re-implementation.
 */
import { describe, it, expect } from 'vitest';
import { PaginationQuery, EstimateListQuery } from '@cost-reaper/types';
import { pageSkipTake, lastPage, paginate } from './pagination';

const UUID = '550e8400-e29b-41d4-a716-446655440000';
const seq = (n: number) => Array.from({ length: n }, (_, i) => i); // [0,1,…,n-1]

describe('Pagination · PaginationQuery contract', () => {
  it('PG-01 defaults to page 1, pageSize 20, order desc', () => {
    const r = PaginationQuery.parse({});
    expect(r.page).toBe(1);
    expect(r.pageSize).toBe(20);
    expect(r.order).toBe('desc');
  });
  it('PG-02 coerces numeric query strings', () => {
    const r = PaginationQuery.parse({ page: '4', pageSize: '50' });
    expect(r.page).toBe(4);
    expect(r.pageSize).toBe(50);
  });
  it('PG-03 accepts order asc', () => {
    expect(PaginationQuery.parse({ order: 'asc' }).order).toBe('asc');
  });
  it('PG-04 rejects an unknown order', () => {
    expect(PaginationQuery.safeParse({ order: 'sideways' }).success).toBe(false);
  });
  it('PG-05 accepts an optional sort field', () => {
    expect(PaginationQuery.safeParse({ sort: 'updatedAt' }).success).toBe(true);
  });
  it('PG-06 rejects page below 1', () => {
    expect(PaginationQuery.safeParse({ page: 0 }).success).toBe(false);
  });
  it('PG-07 rejects pageSize above 200', () => {
    expect(PaginationQuery.safeParse({ pageSize: 201 }).success).toBe(false);
  });
  it('PG-08 rejects pageSize below 1', () => {
    expect(PaginationQuery.safeParse({ pageSize: 0 }).success).toBe(false);
  });
  it('PG-09 rejects a non-integer page', () => {
    expect(PaginationQuery.safeParse({ page: 2.5 }).success).toBe(false);
  });
  it('PG-10 accepts pageSize at the bounds (1 and 200)', () => {
    expect(PaginationQuery.safeParse({ pageSize: 1 }).success).toBe(true);
    expect(PaginationQuery.safeParse({ pageSize: 200 }).success).toBe(true);
  });
});

describe('Pagination · EstimateListQuery contract', () => {
  it('PG-11 defaults to page 1, pageSize 20', () => {
    const r = EstimateListQuery.parse({});
    expect(r.page).toBe(1);
    expect(r.pageSize).toBe(20);
  });
  it('PG-12 coerces numeric query strings', () => {
    const r = EstimateListQuery.parse({ page: '2', pageSize: '10' });
    expect(r.page).toBe(2);
    expect(r.pageSize).toBe(10);
  });
  it('PG-13 accepts a search term, status, and ownerId', () => {
    expect(EstimateListQuery.safeParse({ q: 'bid', status: 'DRAFT', ownerId: UUID }).success).toBe(
      true,
    );
  });
  it('PG-14 rejects a non-uuid ownerId', () => {
    expect(EstimateListQuery.safeParse({ ownerId: 'me' }).success).toBe(false);
  });
  it('PG-15 rejects page below 1', () => {
    expect(EstimateListQuery.safeParse({ page: 0 }).success).toBe(false);
  });
  it('PG-16 rejects pageSize above 200', () => {
    expect(EstimateListQuery.safeParse({ pageSize: 500 }).success).toBe(false);
  });
  it('PG-17 rejects pageSize below 1', () => {
    expect(EstimateListQuery.safeParse({ pageSize: 0 }).success).toBe(false);
  });
  it('PG-18 rejects a non-integer pageSize', () => {
    expect(EstimateListQuery.safeParse({ pageSize: 3.3 }).success).toBe(false);
  });
  it('PG-19 accepts pageSize at the 200 bound', () => {
    expect(EstimateListQuery.safeParse({ pageSize: 200 }).success).toBe(true);
  });
});

describe('Pagination · pageSkipTake (DB skip/take)', () => {
  it('PG-20 page 1 starts at skip 0', () => {
    expect(pageSkipTake(1, 20)).toEqual({ skip: 0, take: 20 });
  });
  it('PG-21 page 2 skips one page', () => {
    expect(pageSkipTake(2, 20)).toEqual({ skip: 20, take: 20 });
  });
  it('PG-22 page 3 skips two pages (size 50)', () => {
    expect(pageSkipTake(3, 50)).toEqual({ skip: 100, take: 50 });
  });
  it('PG-23 take equals pageSize', () => {
    expect(pageSkipTake(5, 7).take).toBe(7);
  });
  it('PG-24 page 1 size 1', () => {
    expect(pageSkipTake(1, 1)).toEqual({ skip: 0, take: 1 });
  });
  it('PG-25 never returns a negative skip', () => {
    expect(pageSkipTake(0, 20).skip).toBe(0);
  });
});

describe('Pagination · lastPage', () => {
  it('PG-26 zero rows is still 1 page', () => {
    expect(lastPage(0, 20)).toBe(1);
  });
  it('PG-27 an exact multiple', () => {
    expect(lastPage(100, 20)).toBe(5);
  });
  it('PG-28 a partial last page rounds up', () => {
    expect(lastPage(101, 20)).toBe(6);
  });
  it('PG-29 fewer than one page is 1 page', () => {
    expect(lastPage(19, 20)).toBe(1);
  });
  it('PG-30 exactly one full page', () => {
    expect(lastPage(20, 20)).toBe(1);
  });
  it('PG-31 one over a page', () => {
    expect(lastPage(21, 20)).toBe(2);
  });
});

describe('Pagination · paginate (slice semantics)', () => {
  it('PG-32 an empty list yields no data, total 0', () => {
    expect(paginate([], 1, 20)).toEqual({ data: [], total: 0, page: 1, pageSize: 20 });
  });
  it('PG-33 returns the first page slice', () => {
    expect(paginate(seq(45), 1, 20).data).toEqual(seq(20));
  });
  it('PG-34 returns the second page slice (rows 21–40)', () => {
    expect(paginate(seq(45), 2, 20).data).toEqual(Array.from({ length: 20 }, (_, i) => 20 + i));
  });
  it('PG-35 the last page may be partial', () => {
    expect(paginate(seq(45), 3, 20).data).toEqual([40, 41, 42, 43, 44]);
  });
  it('PG-36 an out-of-range page returns no data but keeps the total', () => {
    const p = paginate(seq(45), 4, 20);
    expect(p.data).toEqual([]);
    expect(p.total).toBe(45);
  });
  it('PG-37 a page holds at most pageSize items', () => {
    expect(paginate(seq(45), 1, 20).data.length).toBeLessThanOrEqual(20);
  });
  it('PG-38 total is the full count regardless of page', () => {
    expect(paginate(seq(45), 2, 20).total).toBe(45);
  });
  it('PG-39 echoes the requested page and pageSize', () => {
    const p = paginate(seq(45), 2, 20);
    expect(p.page).toBe(2);
    expect(p.pageSize).toBe(20);
  });
  it('PG-40 a single item on page 1', () => {
    expect(paginate(['only'], 1, 20).data).toEqual(['only']);
  });
  it('PG-41 an exact page boundary fills the last page', () => {
    expect(paginate(seq(40), 2, 20).data).toHaveLength(20);
  });
  it('PG-42 pageSize 1 returns one item per page', () => {
    expect(paginate(seq(3), 2, 1).data).toEqual([1]);
  });
});
