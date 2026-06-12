/**
 * Resource capacity check (FR-27).
 *
 * A human resource equals 100% of a day. A resource may be split across several
 * labor lines in percentages, but for any single calendar date the sum of a
 * resource's allocations must not exceed 100%. Only lines that name a resource
 * AND carry a start+end date are schedulable; unscheduled lines can't conflict
 * and are ignored here.
 *
 * Implementation: a per-resource sweep line over day boundaries. For each
 * resource we raise the running allocation at each interval start and drop it
 * the day after each interval end; the first day the running sum exceeds 100%
 * is reported as a violation.
 */

export interface AllocationLine {
  /** Resource identity (e.g. a person's name); null/empty → unscheduled, ignored. */
  resourceName: string | null;
  /** This line's share of the resource, 0..100. */
  allocationPercent: number;
  /** Inclusive ISO date 'YYYY-MM-DD'; null → unscheduled, ignored. */
  startDate: string | null;
  /** Inclusive ISO date 'YYYY-MM-DD'; null → unscheduled, ignored. */
  endDate: string | null;
}

export interface CapacityViolation {
  resourceName: string;
  /** The first date (inclusive) on which the resource is over-allocated. */
  date: string;
  /** Total allocation percent on that date (> 100). */
  totalPercent: number;
}

const MS_PER_DAY = 86_400_000;

function toUtcDay(iso: string): number {
  // Parse 'YYYY-MM-DD' as a UTC midnight day index (avoids TZ drift).
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d) / MS_PER_DAY;
}

function fromUtcDay(day: number): string {
  const dt = new Date(day * MS_PER_DAY);
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dt.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns one violation per over-allocated resource (its earliest offending day).
 * An empty array means every resource stays within 100% on every date.
 */
export function findCapacityViolations(lines: AllocationLine[]): CapacityViolation[] {
  const byResource = new Map<string, AllocationLine[]>();
  for (const l of lines) {
    const name = l.resourceName?.trim();
    if (!name || !l.startDate || !l.endDate) continue;
    if (toUtcDay(l.endDate) < toUtcDay(l.startDate)) continue; // malformed range; skip
    const list = byResource.get(name) ?? [];
    list.push(l);
    byResource.set(name, list);
  }

  const violations: CapacityViolation[] = [];
  for (const [name, list] of byResource) {
    // Day-boundary events: +alloc at start, -alloc the day after end.
    const events: { day: number; delta: number }[] = [];
    for (const l of list) {
      events.push({ day: toUtcDay(l.startDate as string), delta: l.allocationPercent });
      events.push({ day: toUtcDay(l.endDate as string) + 1, delta: -l.allocationPercent });
    }
    // Process drops before rises on the same day so an interval ending and another
    // starting on the same day don't double-count a phantom overlap.
    events.sort((a, b) => a.day - b.day || a.delta - b.delta);

    let running = 0;
    for (const e of events) {
      running += e.delta;
      if (running > 100) {
        violations.push({
          resourceName: name,
          date: fromUtcDay(e.day),
          totalPercent: Math.round(running * 100) / 100,
        });
        break; // earliest offending day per resource is enough to gate
      }
    }
  }
  return violations;
}
