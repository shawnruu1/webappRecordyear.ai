import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardClient from "@/app/dashboard/DashboardClient";
import type { Win, Artifact } from "@/types";

const categoryColors: Record<string, string> = {
  "Deal Closed": "#10B981",
  "Recognition": "#EC4899",
  "Skill": "#818CF8",
  "Milestone": "#F59E0B",
  "Relationship": "#06B6D4",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: wins } = await supabase
    .from("wins")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  // Fetch vault artifacts for this user — non-archived, newest first
  const { data: artifacts } = await supabase
    .from("artifacts")
    .select("*")
    .eq("user_id", user.id)
    .eq("archived", false)
    .order("uploaded_at", { ascending: false });

  return (
    <div className="min-h-screen bg-[#080B14]">
      {/* Header */}
      <header
        className="border-b px-6 py-4 flex justify-between items-center"
        style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(14,22,40,0.8)" }}
      >
        <span className="text-lg font-bold text-[#F8F4EC]">
          Record<span style={{ color: "#F59E0B" }}>Year</span>
        </span>
        <div className="flex items-center gap-4">
          <a
            href={`/portfolio/${user.id}`}
            target="_blank"
            className="text-xs text-[#6B7280] hover:text-[#F59E0B] transition-colors"
          >
            View portfolio →
          </a>
          <span className="text-xs text-[#374151]">{user.email}</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
        {/* Interactive top section — wins + vault */}
        <DashboardClient initialArtifacts={(artifacts ?? []) as Artifact[]} />

        {/* Win feed — server-rendered, refreshed by router.refresh() after saves */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-[#374151] mb-4">
            Your record — {wins?.length ?? 0} entries
          </h2>

          {(!wins || wins.length === 0) ? (
            <div
              className="rounded-2xl p-10 text-center"
              style={{ border: "1px dashed rgba(255,255,255,0.08)" }}
            >
              <p className="text-[#374151] text-sm">No wins logged yet. Add your first one above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(wins as Win[]).map((win) => {
                const color = categoryColors[win.category ?? ""] ?? "#6B7280";
                const isArtifact = win.verification?.source === "artifact";
                return (
                  <div
                    key={win.id}
                    className="rounded-xl p-4"
                    style={{
                      background: "linear-gradient(160deg,#0E1628 0%,#080B14 100%)",
                      border: "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <h3 className="text-sm font-semibold text-[#F8F4EC] truncate">
                          {win.title}
                        </h3>
                        {/* Artifact-backed indicator */}
                        {isArtifact && (
                          <span
                            title="Artifact-backed — sourced from an uploaded file"
                            className="flex-shrink-0"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                              <path
                                d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                                stroke="#F59E0B"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                fill="rgba(245,158,11,0.1)"
                              />
                            </svg>
                          </span>
                        )}
                      </div>
                      {win.category && (
                        <span
                          className="text-[9px] font-bold px-2 py-1 rounded-full flex-shrink-0 uppercase tracking-wide"
                          style={{
                            background: `${color}15`,
                            color,
                            border: `1px solid ${color}25`,
                          }}
                        >
                          {win.category}
                        </span>
                      )}
                    </div>

                    {win.impact && (
                      <p className="text-xs text-[#6B7280] leading-relaxed mb-2">{win.impact}</p>
                    )}

                    {win.arr_amount && (
                      <p className="text-xs font-semibold mb-2" style={{ color: "#F59E0B" }}>
                        ${new Intl.NumberFormat("en-US").format(win.arr_amount)} ARR
                      </p>
                    )}

                    {win.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {win.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[9px] px-2 py-0.5 rounded-full"
                            style={{
                              background: "rgba(255,255,255,0.04)",
                              color: "#6B7280",
                              border: "1px solid rgba(255,255,255,0.06)",
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="text-[10px] text-[#374151] mt-2">
                      {new Date(win.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
