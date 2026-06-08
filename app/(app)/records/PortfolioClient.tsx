"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { WinWithEditStatus, WinVersion } from "@/types";
import { deriveVerificationTier } from "@/lib/verification";
import { timeContext } from "@/lib/recordDisplay";
import { categoryColor } from "@/lib/categoryColors";
import VerificationBadge from "@/components/VerificationBadge";

// ------------------------------------------------------------
// Config
// ------------------------------------------------------------
const FIELD_LABELS: Record<string, string> = {
  title: "Title",
  impact: "Impact",
  category: "Category",
  tags: "Tags",
  arr_amount: "ARR",
  happened_at: "Date",
};

// ------------------------------------------------------------
// Props
// ------------------------------------------------------------
interface Props {
  wins: WinWithEditStatus[];
  versionsByWin: Record<string, WinVersion[]>;
  filtersActive?: boolean;
}

// ------------------------------------------------------------
// Component
// ------------------------------------------------------------
export default function PortfolioClient({
  wins,
  versionsByWin,
  filtersActive = false,
}: Props) {
  const router = useRouter();
  const [openChangelog, setOpenChangelog] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    const res = await fetch(`/api/wins/${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) {
      setConfirmId(null);
      router.refresh();
    }
  }

  if (wins.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-text-faint">
          {filtersActive
            ? "No records match these filters."
            : "No wins recorded yet."}
        </p>
      </div>
    );
  }

  const byCategory = wins.reduce<Record<string, WinWithEditStatus[]>>((acc, win) => {
    const cat = win.category ?? "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(win);
    return acc;
  }, {});

  return (
    <div className="space-y-10">
      {Object.entries(byCategory).map(([category, categoryWins]) => {
        const color = categoryColor(category);
        return (
          <div key={category}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full" style={{ background: color }} />
              <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color }}>
                {category} · {categoryWins.length}
              </h2>
            </div>

            <div className="space-y-3">
              {categoryWins.map((win) => {
                const versions = versionsByWin[win.id] ?? [];
                const isOpen = openChangelog === win.id;
                const { tier, vouched } = deriveVerificationTier(win);

                return (
                  <div key={win.id}>
                    {/* Win card */}
                    <div
                      className="rounded-xl p-4"
                      style={{
                        background: "var(--gradient-surface-card)",
                        border: `1px solid ${color}18`,
                      }}
                    >
                      {/* Title row */}
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-text-primary">{win.title}</h3>

                        <div className="flex items-center gap-3 flex-shrink-0">
                          {/* Edited indicator — only on wins with version history */}
                          {win.has_version_history && (
                            <button
                              onClick={() => setOpenChangelog(isOpen ? null : win.id)}
                              title="This record has been edited — view changelog"
                              className="flex items-center gap-1 transition-colors"
                              style={{ color: isOpen ? "var(--color-accent)" : "var(--color-text-faint)" }}
                            >
                              {/* Pencil icon */}
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                                <path
                                  d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              <span className="text-[9px] font-semibold uppercase tracking-wide">
                                {isOpen ? "Hide" : "Edited"}
                              </span>
                            </button>
                          )}

                          {/* Delete — two-step inline confirm; soft delete */}
                          {confirmId === win.id ? (
                            <span className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-wide">
                              <button
                                onClick={() => handleDelete(win.id)}
                                disabled={deletingId === win.id}
                                className="text-danger-soft hover:opacity-80 transition-opacity disabled:opacity-50"
                              >
                                {deletingId === win.id ? "Deleting…" : "Delete"}
                              </button>
                              <button
                                onClick={() => setConfirmId(null)}
                                className="text-text-faint hover:text-text-tertiary transition-colors"
                              >
                                Cancel
                              </button>
                            </span>
                          ) : (
                            <button
                              onClick={() => setConfirmId(win.id)}
                              title="Delete record"
                              aria-label="Delete record"
                              className="text-text-faint hover:text-danger-soft transition-colors"
                            >
                              {/* Trash icon */}
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path
                                  d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>

                      {win.impact && (
                        <p className="text-xs text-text-tertiary leading-relaxed mb-2">{win.impact}</p>
                      )}

                      {win.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {win.tags.map((tag) => (
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

                      {/* Footer — honest verification tier + time-of-entry */}
                      <div className="flex items-center justify-between gap-2 mt-3">
                        <VerificationBadge tier={tier} vouched={vouched} />
                        <p className="text-[10px] text-text-faint flex-shrink-0">
                          {timeContext(win)}
                        </p>
                      </div>
                    </div>

                    {/* Inline changelog — shown when edited indicator is clicked */}
                    {isOpen && versions.length > 0 && (
                      <div
                        className="mt-1 rounded-xl px-4 py-4 space-y-4"
                        style={{
                          background: "color-mix(in srgb, var(--color-accent) 3%, transparent)",
                          border: "1px solid color-mix(in srgb, var(--color-accent) 12%, transparent)",
                        }}
                      >
                        <p className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">
                          Edit history
                        </p>

                        {versions.map((v) => (
                          <div key={v.id} className="space-y-1.5">
                            {/* Date + field badge */}
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] text-text-faint">
                                {new Date(v.changed_at).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                              <span
                                className="text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide"
                                style={{
                                  background: "color-mix(in srgb, var(--color-accent) 10%, transparent)",
                                  color: "var(--color-accent)",
                                }}
                              >
                                {FIELD_LABELS[v.field_name] ?? v.field_name}
                              </span>
                            </div>

                            {/* Old → new values */}
                            <div
                              className="space-y-0.5 pl-2"
                              style={{ borderLeft: "1.5px solid var(--color-border-subtle)" }}
                            >
                              {v.old_value && (
                                <p
                                  className="text-[10px] leading-relaxed line-through"
                                  style={{ color: "var(--color-text-quaternary)" }}
                                >
                                  {v.old_value}
                                </p>
                              )}
                              {v.new_value && (
                                <p className="text-[10px] text-text-secondary leading-relaxed">
                                  {v.new_value}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
