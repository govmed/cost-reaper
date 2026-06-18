import type { SortDir } from '../lib/usePagedSort';

/**
 * Shared sortable table header cell. Click to sort by its key; clicking again
 * flips direction. Shows ↕ when inactive and ▲/▼ for the active asc/desc column.
 */
export function SortableTh({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
  align = 'left',
  className = '',
}: {
  label: string;
  sortKey: string;
  activeKey: string | null;
  dir: SortDir;
  onSort: (key: string) => void;
  align?: 'left' | 'right' | 'center';
  className?: string;
}) {
  const active = activeKey === sortKey;
  const alignCls =
    align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  return (
    <th
      className={`px-4 py-2 cursor-pointer select-none ${alignCls} ${className}`}
      onClick={() => onSort(sortKey)}
      aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <span className="text-xs text-slate-400">{active ? (dir === 'asc' ? '▲' : '▼') : '↕'}</span>
      </span>
    </th>
  );
}
