"use client";

import { useState } from "react";
import type { WinWithEditStatus, WinVersion, WinCategory } from "@/types";

// ------------------------------------------------------------
// Config
// ------------------------------------------------------------
const categoryColors: Record<WinCategory, string> = {
  "Deal Closed": "#10B981",
  "Recognition": "#EC4899",
  "Skill": "#818CF8",
  "Milestone": "#F59E0B",
  "Relationship": "#06B6D4",
};

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
}

// ------------------------------------------------------------
// Component
// ------------------------------------------------------------
export default function PortfolioClient({ wins, versionsByWin }: Props) {
  const [openChangelog, setOpenChangelog] = useState<string | null>(null);

  if (wins.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-[#374151]">No wins recorded yet.</p>
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
        const color = categoryColors[category as WinCategory] ?? "#6B7280";
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

                return (
                  <div key={win.id}>
                    {/* Win card */}
                    <div
                      className="rounded-xl p-4"
                      style={{
                        background: "linear-gradient(160deg,#0E1628 0%,#080B14 100%)",
                        border: `1px solid ${color}18`,
                      }}
                    >
                      {/* Title row */}
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-[#F8F4EC]">{win.title}</h3>

                        {/* Edited indicator — only shown on artifact-backed wins with version history */}
                        {win.has_version_history && (
                          <button
                            onClick={() => setOpenChangelog(isOpen ? null : win.id)}
                            title="This record has been edited — view changelog"
                            className="flex-shrink-0 flex items-center gap-1 transition-colors"
                            style={{ color: isOpen ? "#F59E0B" : "#374151" }}
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
                      </div>

                      {win.impact && (
                        <p className="text-xs text-[#6B7280] leading-relaxed mb-2">{win.impact}</p>
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

                      <p className="text-[10px] text-[#374151] mt-2">
                        {new Date(win.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    {/* Inline changelog — shown when edited indicator is clicked */}
                    {isOpen && versions.length > 0 && (
                      <div
                        className="mt-1 rounded-xl px-4 py-4 space-y-4"
                        style={{
                          background: "rgba(245,158,11,0.03)",
                          border: "1px solid rgba(245,158,11,0.12)",
                        }}
                      >
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280]">
                          Edit history
                        </p>

                        {versions.map((v) => (
                          <div key={v.id} className="space-y-1.5">
                            {/* Date + field badge */}
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] text-[#374151]">
                                {new Date(v.changed_at).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                              <span
                                className="text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide"
                                style={{
                                  background: "rgba(245,158,11,0.1)",
                                  color: "#F59E0B",
                                }}
                              >
                                {FIELD_LABELS[v.field_name] ?? v.field_name}
                              </span>
                            </div>

                            {/* Old → new values */}
                            <div
                              className="space-y-0.5 pl-2"
                              style={{ borderLeft: "1.5px solid rgba(255,255,255,0.07)" }}
                            >
                              {v.old_value && (
                                <p
                                  className="text-[10px] leading-relaxed line-through"
                                  style={{ color: "#4B5563" }}
                                >
                                  {v.old_value}
                                </p>
                              )}
                              {v.new_value && (
                                <p className="text-[10px] text-[#9CA3AF] leading-relaxed">
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
