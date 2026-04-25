"use client";

import { useState, useCallback } from "react";
import type {
  ArtifactUploadResult,
  ExtractedArtifactData,
  FieldConfidence,
  Artifact,
} from "@/types";

// ----------------------------------------------------------------
// Props
// ----------------------------------------------------------------

interface Props {
  uploadResult: ArtifactUploadResult;
  onSaved: () => void;
  onDismiss: () => void;
}

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

function ConfidenceBadge({
  level,
  required,
}: {
  level: FieldConfidence;
  required?: boolean;
}) {
  if (level === "high") return null; // high confidence = no badge needed
  const isLow = level === "low";
  return (
    <span
      className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide flex-shrink-0"
      style={{
        background: isLow
          ? "rgba(239,68,68,0.1)"
          : "rgba(245,158,11,0.1)",
        color: isLow ? "#F87171" : "#F59E0B",
        border: `1px solid ${isLow ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)"}`,
      }}
    >
      {isLow ? (required ? "Required" : "Low") : "Review"}
    </span>
  );
}

function fieldBorder(conf: FieldConfidence, isEmpty: boolean): string {
  if (isEmpty || conf === "low")
    return "1px solid rgba(239,68,68,0.4)";
  if (conf === "medium")
    return "1px solid rgba(245,158,11,0.35)";
  return "1px solid rgba(255,255,255,0.08)";
}

// ----------------------------------------------------------------
// Tag editor (reused from BatchApproval pattern)
// ----------------------------------------------------------------

function TagEditor({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const [input, setInput] = useState("");

  function addTag(raw: string) {
    const tag = raw.trim().replace(/,/g, "");
    if (!tag || tags.includes(tag) || tags.length >= 10) return;
    onChange([...tags, tag]);
    setInput("");
  }

  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {tags.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
          style={{
            background: "rgba(245,158,11,0.08)",
            color: "#F59E0B",
            border: "1px solid rgba(245,158,11,0.2)",
          }}
        >
          {tag}
          <button
            onClick={() => onChange(tags.filter((t) => t !== tag))}
            className="hover:opacity-70 transition-opacity leading-none"
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addTag(input);
          }
          if (e.key === "Backspace" && !input && tags.length > 0) {
            onChange(tags.slice(0, -1));
          }
        }}
        onBlur={() => { if (input.trim()) addTag(input); }}
        placeholder={tags.length === 0 ? "Add company…" : "+"}
        className="text-[10px] bg-transparent focus:outline-none"
        style={{
          color: "#9CA3AF",
          width: input.length > 0 ? `${Math.max(80, input.length * 8)}px` : "80px",
          minWidth: "60px",
        }}
      />
    </div>
  );
}

// ----------------------------------------------------------------
// Versioning prompt
// ----------------------------------------------------------------

type SimilarArtifact = Pick<
  Artifact,
  "id" | "title" | "type" | "created_at_company" | "uploaded_at"
>;

function VersioningPrompt({
  similar,
  selectedParent,
  onSelect,
}: {
  similar: SimilarArtifact[];
  selectedParent: string | null;
  onSelect: (id: string | null) => void;
}) {
  if (similar.length === 0) return null;

  return (
    <div
      className="rounded-xl p-4 mb-4"
      style={{
        background: "rgba(99,102,241,0.05)",
        border: "1px solid rgba(99,102,241,0.2)",
      }}
    >
      <p className="text-xs font-semibold text-[#818CF8] mb-1">
        Similar artifact{similar.length > 1 ? "s" : ""} found
      </p>
      <p className="text-[10px] text-[#6B7280] mb-3">
        Is this an updated version of an existing artifact? If yes, the new
        file becomes the active version and the old one stays in history.
      </p>
      <div className="space-y-2">
        {similar.map((a) => (
          <button
            key={a.id}
            onClick={() =>
              onSelect(selectedParent === a.id ? null : a.id)
            }
            className="w-full text-left rounded-lg px-3 py-2 transition-all"
            style={{
              background:
                selectedParent === a.id
                  ? "rgba(99,102,241,0.12)"
                  : "rgba(255,255,255,0.02)",
              border: `1px solid ${
                selectedParent === a.id
                  ? "rgba(99,102,241,0.4)"
                  : "rgba(255,255,255,0.07)"
              }`,
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-[#F8F4EC] font-medium truncate">
                {a.title ?? "Untitled"}
              </span>
              <span className="text-[9px] text-[#374151] flex-shrink-0">
                {new Date(a.uploaded_at).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
            {a.created_at_company && (
              <span className="text-[9px] text-[#6B7280]">
                {a.created_at_company}
              </span>
            )}
            {selectedParent === a.id && (
              <p className="text-[9px] text-[#818CF8] mt-1 font-semibold">
                ✓ Will be saved as an update to this artifact
              </p>
            )}
          </button>
        ))}
        {selectedParent && (
          <button
            onClick={() => onSelect(null)}
            className="text-[10px] text-[#374151] hover:text-[#6B7280] transition-colors"
          >
            No — this is a new artifact
          </button>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------
// Main curation component
// ----------------------------------------------------------------

export default function ArtifactCuration({
  uploadResult,
  onSaved,
  onDismiss,
}: Props) {
  const { extracted, source_file, source_hash, file_size, mime_type, similar_artifacts } =
    uploadResult;

  // Editable fields — initialized from AI extraction
  const [title, setTitle] = useState(extracted.title);
  const [summary, setSummary] = useState(extracted.summary);
  const [whyItMatters, setWhyItMatters] = useState(extracted.why_it_matters);
  const [createdAt, setCreatedAt] = useState(extracted.created_at_company ?? "");
  const [usedAt, setUsedAt] = useState<string[]>(extracted.used_at_companies);
  const [parentId, setParentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const conf = extracted.confidence;

  // Required fields must have values before save
  const canSave =
    title.trim().length > 0 &&
    summary.trim().length > 0 &&
    whyItMatters.trim().length > 0;

  // Fields with low confidence that are still empty after user interaction
  const titleEmpty = title.trim().length === 0;
  const summaryEmpty = summary.trim().length === 0;
  const whyEmpty = whyItMatters.trim().length === 0;

  const handleSave = useCallback(async () => {
    if (!canSave) return;
    setSaving(true);
    setSaveError(null);

    const res = await fetch("/api/artifacts/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "slide_deck",
        title: title.trim(),
        summary: summary.trim(),
        why_it_matters: whyItMatters.trim(),
        created_at_company: createdAt.trim() || null,
        used_at_companies: usedAt,
        source_file,
        source_hash,
        file_size,
        mime_type,
        parent_artifact_id: parentId,
        visibility: "private",
        extracted_metadata: {
          // Store original AI output alongside user edits for auditability
          ai_title: extracted.title,
          ai_summary: extracted.summary,
          ai_why_it_matters: extracted.why_it_matters,
          ai_confidence: extracted.confidence,
        },
      }),
    });

    if (res.ok) {
      onSaved();
    } else {
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
      };
      if (body.code === "gated_coming_soon") {
        setSaveError("Gated visibility is coming soon. Saved as private.");
      } else {
        setSaveError(body.error ?? "Save failed. Try again.");
      }
    }

    setSaving(false);
  }, [
    canSave, title, summary, whyItMatters, createdAt, usedAt,
    source_file, source_hash, file_size, mime_type, parentId,
    extracted, onSaved,
  ]);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        border: "1px solid rgba(245,158,11,0.25)",
        background: "linear-gradient(160deg,#0E1628 0%,#080B14 100%)",
      }}
    >
      {/* Header */}
      <div
        className="px-6 py-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <h2 className="text-base font-bold text-[#F8F4EC]">
          Review before saving to vault
        </h2>
        <p className="text-xs text-[#6B7280] mt-0.5">
          AI pre-filled these fields. Edit anything before saving — flagged
          fields require your input.
        </p>
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* Versioning prompt */}
        <VersioningPrompt
          similar={similar_artifacts}
          selectedParent={parentId}
          onSelect={setParentId}
        />

        {/* Title */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280]">
              Title
            </label>
            <ConfidenceBadge level={conf.title} required />
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            className="w-full text-sm font-semibold text-[#F8F4EC] bg-transparent rounded-lg px-3 py-2 focus:outline-none"
            style={{ border: fieldBorder(conf.title, titleEmpty) }}
            placeholder="Deck title"
          />
          {titleEmpty && (
            <p className="text-[10px] text-red-400 mt-1">
              Title is required before saving.
            </p>
          )}
        </div>

        {/* Summary */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280]">
              Summary
            </label>
            <ConfidenceBadge level={conf.summary} required />
          </div>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
            className="w-full text-xs text-[#9CA3AF] bg-transparent rounded-lg px-3 py-2 resize-none focus:outline-none"
            style={{ border: fieldBorder(conf.summary, summaryEmpty) }}
            placeholder="What does this deck cover, who is the audience, and what is its purpose?"
          />
          {summaryEmpty && (
            <p className="text-[10px] text-red-400 mt-1">
              Summary is required before saving.
            </p>
          )}
        </div>

        {/* Why it matters */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280]">
              Why it matters
            </label>
            <ConfidenceBadge level={conf.why_it_matters} required />
          </div>
          <textarea
            value={whyItMatters}
            onChange={(e) => setWhyItMatters(e.target.value)}
            rows={2}
            className="w-full text-xs text-[#9CA3AF] bg-transparent rounded-lg px-3 py-2 resize-none focus:outline-none"
            style={{ border: fieldBorder(conf.why_it_matters, whyEmpty) }}
            placeholder="What does this artifact demonstrate about your skills, judgment, or impact?"
          />
          {whyEmpty && (
            <p className="text-[10px] text-red-400 mt-1">
              Required before saving.
            </p>
          )}
        </div>

        {/* Created at company */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280]">
              Created at
            </label>
            <ConfidenceBadge level={conf.created_at_company} />
          </div>
          <input
            type="text"
            value={createdAt}
            onChange={(e) => setCreatedAt(e.target.value)}
            className="w-full text-xs text-[#9CA3AF] bg-transparent rounded-lg px-3 py-2 focus:outline-none"
            style={{ border: fieldBorder(conf.created_at_company, false) }}
            placeholder="Company where this was created (optional)"
          />
        </div>

        {/* Used at companies */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280]">
              Used at
            </label>
            <ConfidenceBadge level={conf.used_at_companies} />
          </div>
          <div
            className="rounded-lg px-3 py-2 min-h-[36px]"
            style={{ border: fieldBorder(conf.used_at_companies, false) }}
          >
            <TagEditor tags={usedAt} onChange={setUsedAt} />
          </div>
          <p className="text-[9px] text-[#374151] mt-1">
            Companies this was presented to or used with. Press Enter or comma to add.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div
        className="px-6 py-4 flex items-center justify-between gap-4"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(0,0,0,0.2)",
        }}
      >
        <div className="flex items-center gap-3">
          {saveError && (
            <p className="text-xs text-red-400">{saveError}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onDismiss}
            className="text-xs text-[#374151] hover:text-[#6B7280] transition-colors px-3 py-2"
          >
            Discard
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !canSave}
            className="px-5 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-40"
            style={{
              background: "linear-gradient(135deg,#F59E0B 0%,#FCD34D 100%)",
              color: "#080B14",
            }}
          >
            {saving ? "Saving…" : "Save to vault →"}
          </button>
        </div>
      </div>
    </div>
  );
}
