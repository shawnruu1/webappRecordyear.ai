// ============================================================
// Record display helpers — shared by the private portfolio and the
// public profile so the "time-of-entry" lens is rendered identically
// in both places.
// ============================================================

// When a record was logged long after it happened (backfill), show
// both dates so a viewer can pattern-match honestly. Real-time entries
// (happened ≈ logged) collapse to a single date.
const BACKFILL_GAP_MS = 45 * 24 * 60 * 60 * 1000; // ~45 days

export function monthYear(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

export function timeContext(record: {
  happened_at: string | null;
  created_at: string;
}): string {
  const logged = record.created_at;
  const happened = record.happened_at;
  if (happened) {
    const gap = Math.abs(
      new Date(logged).getTime() - new Date(happened).getTime()
    );
    if (gap > BACKFILL_GAP_MS) {
      return `Happened ${monthYear(happened)} · Logged ${monthYear(logged)}`;
    }
    return monthYear(happened);
  }
  return monthYear(logged);
}
