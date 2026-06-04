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
        background: isPptx ? "color-mix(in srgb, var(--color-info) 10%, transparent)" : "color-mix(in srgb, var(--color-danger) 10%, transparent)",
        color: isPptx ? "var(--color-info)" : "var(--color-danger-soft)",
        border: `1px solid ${isPptx ? "color-mix(in srgb, var(--color-info) 20%, transparent)" : "color-mix(in srgb, var(--color-danger) 20%, transparent)"}`,
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
        background: "var(--gradient-surface-card)",
        border: "1px solid color-mix(in srgb, var(--color-accent) 12%, transparent)",
      }}
    >
      {/* Header row: type badge + title + private badge */}
      <div className="flex items-start gap-2 mb-2">
        <TypeBadge mimeType={artifact.mime_type} />
        <h3 className="text-sm font-semibold text-text-primary flex-1 leading-snug">
          {artifact.title ?? "Untitled"}
        </h3>
        {artifact.visibility === "private" && (
          <span
            className="text-[9px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0 uppercase tracking-wide"
            style={{
              background: "var(--color-surface-overlay)",
              color: "var(--color-text-faint)",
              border: "1px solid var(--color-border-subtle)",
            }}
          >
            Private
          </span>
        )}
      </div>

      {/* Why it matters */}
      {artifact.why_it_matters && (
        <p className="text-xs text-text-secondary leading-relaxed mb-3">
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
          <summary className="text-[10px] text-text-faint cursor-pointer hover:text-text-tertiary transition-colors list-none flex items-center gap-1">
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
          <p className="mt-1.5 text-[10px] text-text-tertiary leading-relaxed pl-3">
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
                background: "color-mix(in srgb, var(--color-accent) 6%, transparent)",
                color: "var(--color-accent)",
                border: "1px solid color-mix(in srgb, var(--color-accent) 15%, transparent)",
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
          <span className="text-[10px] text-text-faint">
            {formatDate(artifact.uploaded_at)}
          </span>

          {/* File size */}
          {artifact.file_size && (
            <span className="text-[10px] text-text-faint">
              {formatBytes(artifact.file_size)}
            </span>
          )}

          {/* Version indicator */}
          {artifact.parent_artifact_id && (
            <span
              className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
              style={{
                background: "color-mix(in srgb, var(--color-info) 8%, transparent)",
                color: "var(--color-info)",
                border: "1px solid color-mix(in srgb, var(--color-info) 15%, transparent)",
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
            style={{ color: "var(--color-text-faint)" }}
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
