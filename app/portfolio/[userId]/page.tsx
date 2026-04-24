import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import PortfolioClient from "@/app/portfolio/[userId]/PortfolioClient";
import type { WinWithEditStatus, WinVersion } from "@/types";

export default async function PortfolioPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const supabase = await createClient();

  // Query the view so each win carries has_version_history
  const { data: wins, error } = await supabase
    .from("wins_with_edit_status")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !wins) notFound();

  const typedWins = wins as WinWithEditStatus[];

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
    <div className="min-h-screen bg-[#080B14]">
      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <span className="text-lg font-bold text-[#F8F4EC]">
            Record<span style={{ color: "#F59E0B" }}>Year</span>
          </span>
          <h1 className="text-3xl font-bold text-[#F8F4EC] mt-6 mb-2">Career Record</h1>
          <p className="text-sm text-[#6B7280]">
            {typedWins.length} verified wins · Built with RecordYear.ai
          </p>
        </div>

        <PortfolioClient wins={typedWins} versionsByWin={versionsByWin} />

        <div
          className="mt-16 pt-8 border-t text-center"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <p className="text-xs text-[#374151]">
            Built with{" "}
            <a href="/" className="text-[#F59E0B] hover:underline">
              RecordYear.ai
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
