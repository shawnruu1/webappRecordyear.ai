"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import VaultUploader from "@/components/VaultUploader";
import ArtifactCuration from "@/components/ArtifactCuration";
import ArtifactCard from "@/components/ArtifactCard";
import type { Artifact, ArtifactUploadResult } from "@/types";

interface Props {
  artifacts: Artifact[];
}

// Client-side search: match query against title, description, why_it_matters,
// created_at_company, and used_at_companies.
function matchesSearch(artifact: Artifact, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.toLowerCase();
  const fields = [
    artifact.title,
    artifact.description,
    artifact.why_it_matters,
    artifact.created_at_company,
    ...(artifact.used_at_companies ?? []),
  ]
    .filter(Boolean)
    .map((f) => (f as string).toLowerCase());

  return fields.some((f) => f.includes(q));
}

export default function VaultSection({ artifacts }: Props) {
  const router = useRouter();
  const [pendingResult, setPendingResult] = useState<ArtifactUploadResult | null>(null);
  const [savedBanner, setSavedBanner] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  function handleUploadResult(result: ArtifactUploadResult) {
    setPendingResult(result);
  }

  function handleSaved() {
    setPendingResult(null);
    setSavedBanner(true);
    router.refresh();
    setTimeout(() => setSavedBanner(false), 4000);
  }

  function handleDismiss() {
    setPendingResult(null);
  }

  // Filter + group artifacts
  const filtered = useMemo(
    () => artifacts.filter((a) => !a.archived && matchesSearch(a, searchQuery)),
    [artifacts, searchQuery]
  );

  // Phase 1: only slide_deck type. Group by type for forward-compatibility.
  const byType = useMemo(() => {
    const map = new Map<string, Artifact[]>();
    for (const a of filtered) {
      if (!map.has(a.type)) map.set(a.type, []);
      map.get(a.type)!.push(a);
    }
    return map;
  }, [filtered]);

  const TYPE_LABELS: Record<string, string> = {
    slide_deck: "Slide Decks",
    customer_contract: "Customer Contracts",
    employment_contract: "Employment Contracts",
    comp_plan: "Comp Plans",
    claude_skill: "Claude Skills",
    other: "Other",
  };

  const hasArtifacts = artifacts.filter((a) => !a.archived).length > 0;

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: "linear-gradient(160deg,#0E1628 0%,#080B14 100%)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* Section header */}
      <div className="flex items-start justify-between gap-4 mb-1">
        <div>
          <div className="flex items-center gap-2">
            {/* Lock icon */}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ color: "#F59E0B" }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <h2 className="text-base font-bold text-[#F8F4EC]">Vault</h2>
          </div>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Decks, contracts, comp plans — stored, hashed, and provably yours.
          </p>
        </div>

        {/* Search box — only shown when there are artifacts to search */}
        {hasArtifacts && (
          <div className="relative flex-shrink-0">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "#374151" }}
            >
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vault…"
              className="text-xs bg-transparent rounded-lg pl-7 pr-3 py-1.5 focus:outline-none"
              style={{
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#9CA3AF",
                width: "160px",
              }}
            />
          </div>
        )}
      </div>

      <div className="mt-5 space-y-5">
        {/* Success banner */}
        {savedBanner && (
          <div
            className="rounded-xl px-4 py-3 flex items-center gap-2"
            style={{
              background: "rgba(16,185,129,0.08)",
              border: "1px solid rgba(16,185,129,0.2)",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <polyline
                points="20 6 9 17 4 12"
                stroke="#10B981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="text-xs text-[#10B981] font-semibold">
              Artifact saved to vault.
            </p>
          </div>
        )}

        {/* Upload zone — hidden while curation is open */}
        {!pendingResult && <VaultUploader onResult={handleUploadResult} />}

        {/* Curation UI */}
        {pendingResult && (
          <ArtifactCuration
            uploadResult={pendingResult}
            onSaved={handleSaved}
            onDismiss={handleDismiss}
          />
        )}

        {/* Artifact feed */}
        {byType.size > 0 && (
          <div className="space-y-6">
            {Array.from(byType.entries()).map(([type, typeArtifacts]) => (
              <div key={type}>
                <div className="flex items-center gap-2 mb-3">
                  <h3
                    className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: "#6B7280" }}
                  >
                    {TYPE_LABELS[type] ?? type} · {typeArtifacts.length}
                  </h3>
                </div>
                <div className="space-y-3">
                  {typeArtifacts.map((artifact) => (
                    <ArtifactCard key={artifact.id} artifact={artifact} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state — only shown when no artifacts exist yet */}
        {!hasArtifacts && !pendingResult && (
          <div
            className="rounded-xl p-6 text-center"
            style={{ border: "1px dashed rgba(255,255,255,0.06)" }}
          >
            <p className="text-xs text-[#374151]">
              No artifacts yet. Upload a deck or document above.
            </p>
          </div>
        )}

        {/* Search zero state */}
        {hasArtifacts && filtered.length === 0 && searchQuery && (
          <div className="text-center py-4">
            <p className="text-xs text-[#374151]">
              No artifacts match &ldquo;{searchQuery}&rdquo;.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
