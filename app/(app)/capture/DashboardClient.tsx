"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import WinLogger from "@/components/WinLogger";
import FileUploader from "@/components/FileUploader";
import BatchApproval from "@/components/BatchApproval";
import type { FileExtractionResult } from "@/types";

export default function DashboardClient() {
  const [results, setResults] = useState<FileExtractionResult[]>([]);
  const [toast, setToast] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Slim success toast, auto-dismissing after 4s. Shared by both success
  // paths — text submit (WinLogger) and file upload → approve (BatchApproval).
  function showToast(count: number) {
    setToast(count);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(null), 4000);
  }

  function dismissToast() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast(null);
  }

  function handleResults(incoming: FileExtractionResult[]) {
    setResults((prev) => [...prev, ...incoming]);
  }

  function handleSaved(count: number) {
    setResults([]);
    showToast(count);
  }

  function handleDismiss() {
    setResults([]);
  }

  const hasApprovalQueue =
    results.some((r) => r.status === "success" && r.records.length > 0);

  return (
    <div className="space-y-6">
      {/* Success toast — links to the records page, where wins now live */}
      {toast !== null && (
        <div
          className="flex items-center justify-between gap-3 rounded-xl px-4 py-2.5"
          style={{
            background: "color-mix(in srgb, var(--color-success) 8%, transparent)",
            border: "1px solid color-mix(in srgb, var(--color-success) 20%, transparent)",
          }}
        >
          <p className="text-xs font-medium text-text-secondary">
            <span className="text-success font-semibold">✓</span>{" "}
            {toast === 1 ? "Record logged" : `${toast} records logged`} — view{" "}
            {toast === 1 ? "it" : "them"} in{" "}
            <Link
              href="/records"
              className="text-accent font-semibold hover:opacity-80 transition-opacity"
            >
              My Records →
            </Link>
          </p>
          <button
            type="button"
            onClick={dismissToast}
            aria-label="Dismiss"
            className="text-text-faint hover:text-text-tertiary transition-colors leading-none"
          >
            ✕
          </button>
        </div>
      )}

      {/* Unified capture composer — the win text is the draft; files attach
          beneath it as chips. No mode choice up front. */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: "var(--gradient-surface-card)",
          border: "1px solid color-mix(in srgb, var(--color-accent) 15%, transparent)",
        }}
      >
        <WinLogger onLogged={showToast} />
        <div
          className="mt-6 pt-6"
          style={{ borderTop: "1px solid var(--color-border-subtle)" }}
        >
          <FileUploader onResults={handleResults} onSaved={handleSaved} />
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
            We couldn&apos;t find any records in that file. Try a different one, or{" "}
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
