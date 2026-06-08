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

// Compact currency for the stats hero ($480K, $1.2M).
function formatArr(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

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
  const totalArr = typedWins.reduce((sum, w) => sum + (w.arr_amount ?? 0), 0);

  const stats = [
    { value: String(total), label: total === 1 ? "Record" : "Records" },
    { value: String(withEvidence), label: "With evidence" },
    { value: formatArr(totalArr), label: "ARR captured" },
  ];

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
      {/* Header + stats hero */}
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-text-primary mb-6">Career Record</h1>
        <div className="grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl p-4"
              style={{
                background: "var(--gradient-surface-card)",
                border: "1px solid var(--color-border-subtle)",
              }}
            >
              <p className="text-3xl font-bold text-text-primary leading-none">
                {s.value}
              </p>
              <p className="text-[10px] uppercase tracking-widest text-text-faint mt-2">
                {s.label}
              </p>
            </div>
          ))}
        </div>
        {selfReported > 0 && (
          <p className="text-xs text-text-faint mt-3">{selfReported} self-reported</p>
        )}
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
