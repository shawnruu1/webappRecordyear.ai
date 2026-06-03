"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { WinCategory } from "@/types";
import {
  FILTER_CATEGORY_ORDER,
  CATEGORY_VALUE_TO_TOKEN,
  PERIOD_OPTIONS,
  type PeriodKey,
} from "@/lib/portfolioFilters";

interface Props {
  categoryCounts: Record<WinCategory, number>;
  activeCategories: WinCategory[];
  activePeriod: PeriodKey;
}

// Sticky filter bar. Writes filter state to the URL (the source of
// truth) via router.push — the server re-reads params and re-queries.
// Category chips on the left, date period on the right.
export default function PortfolioFilterBar({
  categoryCounts,
  activeCategories,
  activePeriod,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function push(next: { categories?: WinCategory[]; period?: PeriodKey }) {
    const params = new URLSearchParams(searchParams.toString());
    const categories = next.categories ?? activeCategories;
    const period = next.period ?? activePeriod;

    if (categories.length > 0) {
      params.set(
        "category",
        categories.map((c) => CATEGORY_VALUE_TO_TOKEN[c]).join(",")
      );
    } else {
      params.delete("category");
    }

    if (period && period !== "all_time") {
      params.set("period", period);
    } else {
      params.delete("period");
    }

    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function toggleCategory(cat: WinCategory) {
    const set = new Set(activeCategories);
    if (set.has(cat)) set.delete(cat);
    else set.add(cat);
    push({ categories: FILTER_CATEGORY_ORDER.filter((c) => set.has(c)) });
  }

  return (
    <div
      className="sticky top-0 z-10 -mx-6 px-6 py-3 mb-8 flex flex-wrap items-center justify-between gap-3"
      style={{
        background: "rgba(8,11,20,0.85)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Category chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        {FILTER_CATEGORY_ORDER.map((cat) => {
          const active = activeCategories.includes(cat);
          const count = categoryCounts[cat] ?? 0;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => toggleCategory(cat)}
              aria-pressed={active}
              className="text-[10px] font-semibold px-2.5 py-1 rounded-full transition-colors"
              style={{
                background: active
                  ? "rgba(245,158,11,0.15)"
                  : "rgba(255,255,255,0.03)",
                color: active ? "#F59E0B" : "#6B7280",
                border: `1px solid ${
                  active ? "rgba(245,158,11,0.35)" : "rgba(255,255,255,0.08)"
                }`,
              }}
            >
              {cat} <span style={{ opacity: 0.55 }}>({count})</span>
            </button>
          );
        })}
      </div>

      {/* Date period */}
      <select
        value={activePeriod}
        onChange={(e) => push({ period: e.target.value as PeriodKey })}
        aria-label="Filter by date period"
        className="text-[10px] text-[#9CA3AF] rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/30"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        {PERIOD_OPTIONS.map((o) => (
          <option key={o.value} value={o.value} className="bg-[#0E1628]">
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
