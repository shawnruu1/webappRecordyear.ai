import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardClient from "@/app/dashboard/DashboardClient";
import VisibilityToggle from "@/components/VisibilityToggle";
import UsernameClaim from "@/components/UsernameClaim";
import type { Win, Artifact } from "@/types";
import { categoryColor } from "@/lib/categoryColors";

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

  // Profile — drives the username-claim prompt / public-link state.
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, public_profile_enabled")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-surface-base">
      {/* Header */}
      <header
        className="border-b px-6 py-4 flex justify-between items-center"
        style={{ borderColor: "var(--color-border-subtle)", background: "color-mix(in srgb, var(--color-surface-raised) 80%, transparent)" }}
      >
        <span className="text-lg font-bold text-text-primary">
          Record<span style={{ color: "var(--color-accent)" }}>Year</span>
        </span>
        <div className="flex items-center gap-4">
          <a
            href={`/portfolio/${user.id}`}
            target="_blank"
            className="text-xs text-text-tertiary hover:text-accent transition-colors"
          >
            View portfolio →
          </a>
          <span className="text-xs text-text-faint">{user.email}</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
        {/* Public profile — claim prompt or live link */}
        <UsernameClaim
          initialUsername={profile?.username ?? null}
          initialDisplayName={profile?.display_name ?? null}
        />

        {/* Interactive top section — wins + vault */}
        <DashboardClient initialArtifacts={(artifacts ?? []) as Artifact[]} />

        {/* Win feed — server-rendered, refreshed by router.refresh() after saves */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-text-faint mb-4">
            Your record — {wins?.length ?? 0} entries
          </h2>

          {(!wins || wins.length === 0) ? (
            <div
              className="rounded-2xl p-10 text-center"
              style={{ border: "1px dashed var(--color-border-default)" }}
            >
              <p className="text-text-faint text-sm">No wins logged yet. Add your first one above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(wins as Win[]).map((win) => {
                const color = categoryColor(win.category);
                const isArtifact = win.verification?.source === "artifact";
                return (
                  <div
                    key={win.id}
                    className="rounded-xl p-4"
                    style={{
                      background: "var(--gradient-surface-card)",
                      border: "1px solid var(--color-border-subtle)",
                    }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <h3 className="text-sm font-semibold text-text-primary truncate">
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
                                stroke="var(--color-accent)"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                fill="color-mix(in srgb, var(--color-accent) 10%, transparent)"
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
                      <p className="text-xs text-text-tertiary leading-relaxed mb-2">{win.impact}</p>
                    )}

                    {win.arr_amount && (
                      <p className="text-xs font-semibold mb-2" style={{ color: "var(--color-accent)" }}>
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
                              background: "var(--color-surface-overlay)",
                              color: "var(--color-text-tertiary)",
                              border: "1px solid var(--color-border-subtle)",
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 mt-3">
                      <p className="text-[10px] text-text-faint">
                        {new Date(win.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      <VisibilityToggle winId={win.id} initial={win.visibility} />
                    </div>
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
