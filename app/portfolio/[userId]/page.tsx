import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import PortfolioClient from "@/app/portfolio/[userId]/PortfolioClient";
import PortfolioFilterBar from "@/components/PortfolioFilterBar";
import { deriveVerificationTier } from "@/lib/verification";
import {
  parseCategoryParam,
  parsePeriodParam,
  resolvePeriod,
  FILTER_CATEGORY_ORDER,
  DEFAULT_PERIOD,
} from "@/lib/portfolioFilters";
import type { WinWithEditStatus, WinVersion, WinCategory } from "@/types";

export default async function PortfolioPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { userId } = await params;
  const sp = await searchParams;
  const supabase = await createClient();

  // ---- Parse filters from the URL (the source of truth) ----
  const rawCategory = Array.isArray(sp.category) ? sp.category[0] : sp.category;
  const rawPeriod = Array.isArray(sp.period) ? sp.period[0] : sp.period;
  const activeCategories = parseCategoryParam(rawCategory);
  const activePeriod = parsePeriodParam(rawPeriod);
  const range = resolvePeriod(activePeriod);
  const filtersActive =
    activeCategories.length > 0 || activePeriod !== DEFAULT_PERIOD;

  // ---- Chip counts: per-category totals across ALL the user's records,
  // independent of the active filter ("what's available if you toggle"). ----
  const { data: allCategories } = await supabase
    .from("wins")
    .select("category")
    .eq("user_id", userId);

  const categoryCounts = FILTER_CATEGORY_ORDER.reduce(
    (acc, c) => ({ ...acc, [c]: 0 }),
    {} as Record<WinCategory, number>
  );
  for (const row of (allCategories ?? []) as { category: WinCategory | null }[]) {
    if (row.category && row.category in categoryCounts) {
      categoryCounts[row.category]++;
    }
  }

  // ---- Filtered records: WHERE clauses added in the data layer ----
  let query = supabase
    .from("wins_with_edit_status")
    .select("*")
    .eq("user_id", userId);

  if (activeCategories.length > 0) {
    query = query.in("category", activeCategories);
  }
  if (range) {
    query = query.gte("happened_at", range.start);
    if (range.end) query = query.lt("happened_at", range.end);
  }
  query = query.order("created_at", { ascending: false });

  const { data: wins, error } = await query;

  if (error || !wins) notFound();

  const typedWins = wins as WinWithEditStatus[];

  // Honest header math — count evidence-backed vs bare self-reported.
  // "with evidence" is the softened public term for artifact_attached
  // and the stronger tiers; the precise tier labels live in the model.
  const total = typedWins.length;
  const withEvidence = typedWins.filter(
    (w) => deriveVerificationTier(w).tier !== "self_reported"
  ).length;
  const selfReported = total - withEvidence;

  const summary = [
    `${total} ${total === 1 ? "record" : "records"}`,
    withEvidence > 0 ? `${withEvidence} with evidence` : null,
    selfReported > 0 ? `${selfReported} self-reported` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  // Fetch version history only for wins that have it — one round-trip
  const editedWinIds = typedWins
    .filter((w) => w.has_version_history)
    .map((w) => w.id);

  const versionsByWin: Record<string, WinVersion[]> = {};

  if (editedWinIds.length > 0) {
    const { data: versions } = await supabase
      .from("win_versions")
      .select("*")
      .in("win_id", editedWinIds)
      .order("changed_at", { ascending: true });

    for (const v of (versions ?? []) as WinVersion[]) {
      if (!versionsByWin[v.win_id]) versionsByWin[v.win_id] = [];
      versionsByWin[v.win_id].push(v);
    }
  }

  return (
    <div className="min-h-screen bg-surface-base">
      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <span className="text-lg font-bold text-text-primary">
            Record<span style={{ color: "var(--color-accent)" }}>Year</span>
          </span>
          <h1 className="text-3xl font-bold text-text-primary mt-6 mb-2">Career Record</h1>
          <p className="text-sm text-text-tertiary">{summary}</p>
        </div>

        <PortfolioFilterBar
          categoryCounts={categoryCounts}
          activeCategories={activeCategories}
          activePeriod={activePeriod}
        />

        <PortfolioClient
          wins={typedWins}
          versionsByWin={versionsByWin}
          filtersActive={filtersActive}
        />

        <div
          className="mt-16 pt-8 border-t text-center"
          style={{ borderColor: "var(--color-border-subtle)" }}
        >
          <p className="text-xs text-text-faint">
            Built with{" "}
            <a href="/" className="text-accent hover:underline">
              RecordYear.ai
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
