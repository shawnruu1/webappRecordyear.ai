"use client";

import { useState } from "react";
import type { Artifact } from "@/types";

interface Props {
  artifact: Artifact;
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function TypeBadge({ mimeType }: { mimeType: string | null }) {
  const isPptx =
    mimeType ===
    "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  const label = isPptx ? "PPTX" : "PDF";
  return (
    <span
      className="text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wide flex-shrink-0"
      style={{
        background: isPptx ? "rgba(129,140,248,0.1)" : "rgba(239,68,68,0.1)",
        color: isPptx ? "#818CF8" : "#F87171",
        border: `1px solid ${isPptx ? "rgba(129,140,248,0.2)" : "rgba(239,68,68,0.2)"}`,
      }}
    >
      {label}
    </span>
  );
}

export default function ArtifactCard({ artifact }: Props) {
  const [summaryOpen, setSummaryOpen] = useState(false);

  const companies = [
    artifact.created_at_company,
    ...artifact.used_at_companies,
  ]
    .filter((c): c is string => Boolean(c))
    .filter((c, i, arr) => arr.indexOf(c) === i); // dedupe

  const hashShort = artifact.source_hash
    ? artifact.source_hash.slice(0, 8)
    : null;

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: "linear-gradient(160deg,#0E1628 0%,#080B14 100%)",
        border: "1px solid rgba(245,158,11,0.12)",
      }}
    >
      {/* Header row: type badge + title + private badge */}
      <div className="flex items-start gap-2 mb-2">
        <TypeBadge mimeType={artifact.mime_type} />
        <h3 className="text-sm font-semibold text-[#F8F4EC] flex-1 leading-snug">
          {artifact.title ?? "Untitled"}
        </h3>
        {artifact.visibility === "private" && (
          <span
            className="text-[9px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0 uppercase tracking-wide"
            style={{
              background: "rgba(255,255,255,0.04)",
              color: "#374151",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            Private
          </span>
        )}
      </div>

      {/* Why it matters */}
      {artifact.why_it_matters && (
        <p className="text-xs text-[#9CA3AF] leading-relaxed mb-3">
          {artifact.why_it_matters}
        </p>
      )}

      {/* Summary toggle */}
      {artifact.description && (
        <details
          className="group mb-3"
          open={summaryOpen}
          onToggle={(e) => setSummaryOpen((e.target as HTMLDetailsElement).open)}
        >
          <summary className="text-[10px] text-[#374151] cursor-pointer hover:text-[#6B7280] transition-colors list-none flex items-center gap-1">
            <svg
              width="8"
              height="8"
              viewBox="0 0 24 24"
              fill="none"
              className={`transition-transform ${summaryOpen ? "rotate-90" : ""}`}
            >
              <polyline
                points="9 18 15 12 9 6"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            Summary
          </summary>
          <p className="mt-1.5 text-[10px] text-[#6B7280] leading-relaxed pl-3">
            {artifact.description}
          </p>
        </details>
      )}

      {/* Company tags */}
      {companies.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {companies.map((company) => (
            <span
              key={company}
              className="text-[9px] px-2 py-0.5 rounded-full"
              style={{
                background: "rgba(245,158,11,0.06)",
                color: "#F59E0B",
                border: "1px solid rgba(245,158,11,0.15)",
              }}
            >
              {company}
            </span>
          ))}
        </div>
      )}

      {/* Footer row: meta */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          {/* Upload date */}
          <span className="text-[10px] text-[#374151]">
            {formatDate(artifact.uploaded_at)}
          </span>

          {/* File size */}
          {artifact.file_size && (
            <span className="text-[10px] text-[#374151]">
              {formatBytes(artifact.file_size)}
            </span>
          )}

          {/* Version indicator */}
          {artifact.parent_artifact_id && (
            <span
              className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
              style={{
                background: "rgba(99,102,241,0.08)",
                color: "#818CF8",
                border: "1px solid rgba(99,102,241,0.15)",
              }}
            >
              Updated
            </span>
          )}
        </div>

        {/* Hash seal */}
        {hashShort && (
          <span
            title={`SHA-256: ${artifact.source_hash}`}
            className="flex items-center gap-1 text-[9px] font-mono cursor-default"
            style={{ color: "#374151" }}
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {hashShort}
          </span>
        )}
      </div>
    </div>
  );
}
