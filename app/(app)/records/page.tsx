import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import PortfolioClient from "./PortfolioClient";
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

export default async function RecordsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  // The authenticated user's own records — resolved from the session, so the
  // URL stays clean (/records, no UUID). The UUID route lives on for public
  // profiles at /[username].
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const userId = user.id;

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
    <div className="max-w-2xl mx-auto px-6 py-16">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Career Record</h1>
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
    </div>
  );
}
