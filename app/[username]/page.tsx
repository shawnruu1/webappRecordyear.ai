import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { deriveVerificationTier } from "@/lib/verification";
import { timeContext } from "@/lib/recordDisplay";
import VerificationBadge from "@/components/VerificationBadge";
import {
  ROLE_OPTIONS,
  type PublicProfilePayload,
  type PublicProfileRecord,
} from "@/types";
import { categoryColor } from "@/lib/categoryColors";

// Adapt a public record's flat provenance fields into the signal shape
// deriveVerificationTier expects — one tier-derivation everywhere.
function toSignals(r: PublicProfileRecord) {
  return {
    verification: { source: r.verification_source },
    source_hash: r.has_source_file ? "present" : null,
    has_linked_artifact: r.has_linked_artifact,
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  // Public read model. The function returns null when the username
  // doesn't exist or the profile isn't public → 404.
  const { data, error } = await supabase.rpc("get_public_profile", {
    p_username: username,
  });

  if (error || !data) notFound();

  const payload = data as PublicProfilePayload;
  const records = payload.records ?? [];

  const roleLabel = payload.profile.role
    ? ROLE_OPTIONS.find((o) => o.value === payload.profile.role)?.label ?? null
    : null;

  // Honest header math — same lens as the private portfolio.
  const total = records.length;
  const withEvidence = records.filter(
    (r) => deriveVerificationTier(toSignals(r)).tier !== "self_reported"
  ).length;
  const selfReported = total - withEvidence;
  const summary = [
    `${total} ${total === 1 ? "record" : "records"}`,
    withEvidence > 0 ? `${withEvidence} with evidence` : null,
    selfReported > 0 ? `${selfReported} self-reported` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  // Group by category, preserving the function's created_at DESC order.
  const byCategory = records.reduce<Record<string, PublicProfileRecord[]>>(
    (acc, r) => {
      const cat = r.category ?? "Other";
      (acc[cat] ??= []).push(r);
      return acc;
    },
    {}
  );

  return (
    <div className="min-h-screen bg-surface-base">
      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <span className="text-lg font-bold text-text-primary">
            Record<span style={{ color: "var(--color-accent)" }}>Year</span>
          </span>
          <h1 className="text-3xl font-bold text-text-primary mt-6 mb-1">
            {payload.profile.display_name ?? `@${payload.profile.username}`}
          </h1>
          {roleLabel && (
            <p className="text-xs uppercase tracking-widest text-text-tertiary mb-2">
              {roleLabel}
            </p>
          )}
          <p className="text-sm text-text-tertiary">{summary}</p>
        </div>

        {records.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-text-faint">No public records yet.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(byCategory).map(([category, categoryRecords]) => {
              const color = categoryColor(category);
              return (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-4">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: color }}
                    />
                    <h2
                      className="text-xs font-bold uppercase tracking-widest"
                      style={{ color }}
                    >
                      {category} · {categoryRecords.length}
                    </h2>
                  </div>

                  <div className="space-y-3">
                    {categoryRecords.map((r) => {
                      const { tier } = deriveVerificationTier(toSignals(r));
                      const isBlurred = r.visibility === "blurred_public";
                      return (
                        <div
                          key={r.id}
                          className="rounded-xl p-4"
                          style={{
                            background:
                              "var(--gradient-surface-card)",
                            border: `1px solid ${color}18`,
                          }}
                        >
                          {/* Title row */}
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
                              {isBlurred && (
                                <svg
                                  width="11"
                                  height="11"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  className="flex-shrink-0"
                                  aria-label="Redacted"
                                >
                                  <rect
                                    x="3"
                                    y="11"
                                    width="18"
                                    height="11"
                                    rx="2"
                                    stroke="var(--color-text-tertiary)"
                                    strokeWidth="2"
                                  />
                                  <path
                                    d="M7 11V7a5 5 0 0 1 10 0v4"
                                    stroke="var(--color-text-tertiary)"
                                    strokeWidth="2"
                                  />
                                </svg>
                              )}
                              {r.title}
                            </h3>
                          </div>

                          {r.impact && (
                            <p className="text-xs text-text-tertiary leading-relaxed mb-2">
                              {r.impact}
                            </p>
                          )}

                          {(r.arr_range || r.arr_amount) && (
                            <p
                              className="text-xs font-semibold mb-2"
                              style={{ color: "var(--color-accent)" }}
                            >
                              {r.arr_range
                                ? `${r.arr_range} ARR`
                                : `$${new Intl.NumberFormat("en-US").format(
                                    r.arr_amount as number
                                  )} ARR`}
                            </p>
                          )}

                          {r.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {r.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[9px] px-2 py-0.5 rounded-full"
                                  style={{
                                    background: `${color}12`,
                                    color,
                                    border: `1px solid ${color}20`,
                                  }}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Footer — verification + time-of-entry */}
                          <div className="flex items-center justify-between gap-2 mt-3">
                            <VerificationBadge tier={tier} />
                            <p className="text-[10px] text-text-faint flex-shrink-0">
                              {timeContext(r)}
                            </p>
                          </div>

                          {/* Blurred records — non-functional v2 CTA */}
                          {isBlurred && (
                            <button
                              type="button"
                              disabled
                              title="Coming soon"
                              className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide px-3 py-1.5 rounded-lg cursor-not-allowed opacity-70"
                              style={{
                                background: "var(--color-surface-overlay)",
                                color: "var(--color-text-tertiary)",
                                border: "1px solid var(--color-border-default)",
                              }}
                            >
                              <svg
                                width="10"
                                height="10"
                                viewBox="0 0 24 24"
                                fill="none"
                              >
                                <rect
                                  x="3"
                                  y="11"
                                  width="18"
                                  height="11"
                                  rx="2"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                />
                                <path
                                  d="M7 11V7a5 5 0 0 1 10 0v4"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                />
                              </svg>
                              Request access
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

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
