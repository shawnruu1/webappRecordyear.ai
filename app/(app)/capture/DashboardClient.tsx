"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import WinLogger from "@/components/WinLogger";
import FileUploader from "@/components/FileUploader";
import BatchApproval from "@/components/BatchApproval";
import type { FileExtractionResult } from "@/types";

export default function DashboardClient() {
  const router = useRouter();
  const [results, setResults] = useState<FileExtractionResult[]>([]);
  const [savedBanner, setSavedBanner] = useState<number | null>(null);

  function handleResults(incoming: FileExtractionResult[]) {
    setResults((prev) => [...prev, ...incoming]);
  }

  function handleSaved(count: number) {
    setResults([]);
    setSavedBanner(count);
    // Re-run the server component — refreshes wins and artifacts
    router.refresh();
    setTimeout(() => setSavedBanner(null), 4000);
  }

  function handleDismiss() {
    setResults([]);
  }

  const hasApprovalQueue =
    results.some((r) => r.status === "success" && r.records.length > 0);

  return (
    <div className="space-y-6">
      {/* Success banner */}
      {savedBanner !== null && (
        <div
          className="rounded-xl px-4 py-3 flex items-center gap-2"
          style={{
            background: "color-mix(in srgb, var(--color-success) 8%, transparent)",
            border: "1px solid color-mix(in srgb, var(--color-success) 20%, transparent)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <polyline
              points="20 6 9 17 4 12"
              stroke="var(--color-success)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="text-xs text-success font-semibold">
            {savedBanner} {savedBanner === 1 ? "win" : "wins"} added to your record.
          </p>
        </div>
      )}

      {/* Capture — two zones in one card */}
      <div
        className="rounded-2xl"
        style={{
          background: "var(--gradient-surface-card)",
          border: "1px solid color-mix(in srgb, var(--color-accent) 15%, transparent)",
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2">
          <div className="p-6">
            <WinLogger />
          </div>
          <div
            className="p-6 border-t sm:border-t-0 sm:border-l"
            style={{ borderColor: "var(--color-border-subtle)" }}
          >
            <FileUploader onResults={handleResults} />
          </div>
        </div>
      </div>

      {/* Empty-extraction notice — file was uploaded but no wins found */}
      {results.some((r) => r.status === "empty") && !hasApprovalQueue && (
        <div
          className="rounded-xl px-4 py-3"
          style={{
            background: "var(--color-surface-overlay-subtle)",
            border: "1px solid var(--color-border-default)",
          }}
        >
          <p className="text-xs text-text-tertiary">
            We couldn&apos;t find any wins in that file. Try a different one, or{" "}
            <button
              onClick={handleDismiss}
              className="text-accent hover:opacity-80 transition-opacity underline underline-offset-2"
            >
              log one manually
            </button>{" "}
            using the text box above.
          </p>
        </div>
      )}

      {/* Batch approval — only shown when there are records to review */}
      {hasApprovalQueue && (
        <BatchApproval
          results={results}
          onSaved={handleSaved}
          onDismiss={handleDismiss}
        />
      )}
    </div>
  );
}
