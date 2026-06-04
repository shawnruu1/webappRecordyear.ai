import type { WinCategory } from "@/types";

/**
 * Single source of truth for win-category accent colors.
 *
 * These stay as raw hex (not CSS custom properties) on purpose: the
 * portfolio / profile cards build translucent variants by string-
 * concatenating an alpha suffix onto the value (e.g. `${color}18`),
 * which only works with a hex literal — a `var(--…)` reference would
 * produce invalid CSS. Keeping them here means every surface shares
 * one map instead of redefining it.
 */
export const categoryColors: Record<WinCategory, string> = {
  "Deal Closed": "#10B981",
  Recognition: "#EC4899",
  Skill: "#818CF8",
  Milestone: "#F59E0B",
  Relationship: "#06B6D4",
};

/** Fallback accent for unknown / missing categories (matches text-tertiary). */
export const FALLBACK_CATEGORY_COLOR = "#6B7280";

/** Resolve a category to its accent color, with a safe fallback. */
export function categoryColor(category?: string | null): string {
  return categoryColors[category as WinCategory] ?? FALLBACK_CATEGORY_COLOR;
}
