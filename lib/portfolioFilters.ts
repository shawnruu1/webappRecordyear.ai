// ============================================================
// Portfolio filters — URL param parsing + date-period resolution.
//
// The URL is the source of truth. The server route reads these params
// and adds WHERE clauses to the wins_with_edit_status query; the client
// filter bar writes them back via router.push. Keeping the parse/format
// logic here means both sides agree on the contract.
// ============================================================

import type { WinCategory } from "@/types";

// URL token <-> stored category value. Tokens are snake_case for clean
// URLs; the DB stores Title Case.
export const CATEGORY_TOKEN_TO_VALUE: Record<string, WinCategory> = {
  deal_closed: "Deal Closed",
  recognition: "Recognition",
  milestone: "Milestone",
  relationship: "Relationship",
  skill: "Skill",
};

export const CATEGORY_VALUE_TO_TOKEN: Record<WinCategory, string> = {
  "Deal Closed": "deal_closed",
  Recognition: "recognition",
  Milestone: "milestone",
  Relationship: "relationship",
  Skill: "skill",
};

// Chip display order (spec order).
export const FILTER_CATEGORY_ORDER: WinCategory[] = [
  "Deal Closed",
  "Recognition",
  "Milestone",
  "Relationship",
  "Skill",
];

export type PeriodKey =
  | "all_time"
  | "this_year"
  | "last_year"
  | "last_12_months"
  | "last_quarter";

export const PERIOD_OPTIONS: { value: PeriodKey; label: string }[] = [
  { value: "this_year", label: "This Year" },
  { value: "last_year", label: "Last Year" },
  { value: "last_12_months", label: "Last 12 Months" },
  { value: "last_quarter", label: "Last Quarter" },
  { value: "all_time", label: "All Time" },
];

export const DEFAULT_PERIOD: PeriodKey = "all_time";

const VALID_PERIODS = new Set<string>(PERIOD_OPTIONS.map((o) => o.value));

// Half-open range [start, end) as ISO strings. end null = open-ended (up
// to now). Calendar-aligned. Applied to happened_at — because the query
// uses gte/lt on happened_at, records with a NULL happened_at are
// naturally excluded whenever a range is set (null comparisons are not
// true), which is the intended behavior for any period but All Time.
export interface DateRange {
  start: string;
  end: string | null;
}

export function resolvePeriod(
  period: PeriodKey,
  now: Date = new Date()
): DateRange | null {
  const y = now.getFullYear();

  switch (period) {
    case "all_time":
      return null;

    case "this_year":
      return { start: new Date(y, 0, 1).toISOString(), end: null };

    case "last_year":
      return {
        start: new Date(y - 1, 0, 1).toISOString(),
        end: new Date(y, 0, 1).toISOString(),
      };

    case "last_12_months": {
      const start = new Date(now);
      start.setFullYear(start.getFullYear() - 1);
      return { start: start.toISOString(), end: null };
    }

    case "last_quarter": {
      const currentQ = Math.floor(now.getMonth() / 3); // 0..3
      let pq = currentQ - 1;
      let py = y;
      if (pq < 0) {
        pq = 3;
        py = y - 1;
      }
      const startMonth = pq * 3;
      return {
        start: new Date(py, startMonth, 1).toISOString(),
        end: new Date(py, startMonth + 3, 1).toISOString(), // exclusive
      };
    }
  }
}

export function parseCategoryParam(
  param: string | undefined
): WinCategory[] {
  if (!param) return [];
  const seen = new Set<WinCategory>();
  for (const token of param.split(",")) {
    const value = CATEGORY_TOKEN_TO_VALUE[token.trim()];
    if (value) seen.add(value);
  }
  // Return in chip order for stable URLs / rendering.
  return FILTER_CATEGORY_ORDER.filter((c) => seen.has(c));
}

export function parsePeriodParam(param: string | undefined): PeriodKey {
  return param && VALID_PERIODS.has(param)
    ? (param as PeriodKey)
    : DEFAULT_PERIOD;
}
