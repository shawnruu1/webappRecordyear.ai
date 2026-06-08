"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  FileExtractionResult,
  BatchRecord,
  ExtractedWinRecord,
  WinCategory,
} from "@/types";
import { WIN_CATEGORIES } from "@/types";

// ------------------------------------------------------------
// Props
// ------------------------------------------------------------
interface Props {
  results: FileExtractionResult[];
  onSaved: (count: number) => void;
  onDismiss: () => void;
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function deepCopy<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function formatARR(amount: number | null): string {
  if (amount === null) return "";
  return new Intl.NumberFormat("en-US").format(amount);
}

function groupByFile(records: BatchRecord[]): Map<string, BatchRecord[]> {
  const map = new Map<string, BatchRecord[]>();
  for (const r of records) {
    if (!map.has(r.sourceFileName)) map.set(r.sourceFileName, []);
    map.get(r.sourceFileName)!.push(r);
  }
  return map;
}

function resultsToBatchRecords(results: FileExtractionResult[]): BatchRecord[] {
  return results.flatMap((result) => {
    if (result.status !== "success" || result.records.length === 0) return [];
    return result.records.map((record, i) => ({
      key: `${result.fileName}-${i}-${uid()}`,
      extracted: deepCopy(record),
      edited: deepCopy(record),
      approval: "pending" as const,
      sourceFileName: result.fileName,
      source_file: result.source_file ?? "",
      source_hash: result.source_hash ?? "",
    }));
  });
}

// ------------------------------------------------------------
// Main component
// ------------------------------------------------------------
export default function BatchApproval({ results, onSaved, onDismiss }: Props) {
  const [records, setRecords] = useState<BatchRecord[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Merge new results into state when the prop changes.
  // Deduplication lives INSIDE the setRecords updater so it always reads the
  // latest committed state — not a stale closure snapshot (which would cause
  // duplicates under React 18 StrictMode's double-effect invocation).
  useEffect(() => {
    if (results.length === 0) return;
    const successResults = results.filter(
      (r) => r.status === "success" && r.records.length > 0
    );
    if (successResults.length === 0) return;
    setRecords((prev) => {
      const existing = new Set(prev.map((r) => r.sourceFileName));
      const incoming = successResults.filter((r) => !existing.has(r.fileName));
      if (incoming.length === 0) return prev;
      return [...prev, ...resultsToBatchRecords(incoming)];
    });
  }, [results]);

  // ---- Derived counts ----
  const approved = records.filter((r) => r.approval === "approved");
  const rejected = records.filter((r) => r.approval === "rejected");
  const pending = records.filter((r) => r.approval === "pending");
  const grouped = groupByFile(records);

  // ---- Mutators ----
  const setApproval = useCallback(
    (key: string, state: "approved" | "rejected") => {
      setRecords((prev) =>
        prev.map((r) => (r.key === key ? { ...r, approval: state } : r))
      );
    },
    []
  );

  const updateField = useCallback(
    (key: string, patch: Partial<ExtractedWinRecord>) => {
      setRecords((prev) =>
        prev.map((r) =>
          r.key === key ? { ...r, edited: { ...r.edited, ...patch } } : r
        )
      );
    },
    []
  );

  const approveAll = () =>
    setRecords((prev) => prev.map((r) => ({ ...r, approval: "approved" })));

  const rejectAll = () =>
    setRecords((prev) => prev.map((r) => ({ ...r, approval: "rejected" })));

  // ---- Save ----
  async function handleSave() {
    if (approved.length === 0) return;
    setSaving(true);
    setSaveError(null);

    const res = await fetch("/api/wins/batch-save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ records }),
    });

    if (res.ok) {
      const { saved } = await res.json() as { saved: number };
      setRecords([]);
      onSaved(saved);
    } else {
      const body = await res.json().catch(() => ({})) as { error?: string };
      setSaveError(body.error ?? "Save failed. Try again.");
    }

    setSaving(false);
  }

  if (records.length === 0) return null;

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ border: "1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)", background: "var(--gradient-surface-card)" }}>

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
        <div>
          <h2 className="text-base font-bold text-text-primary">Review extracted wins</h2>
          <p className="text-xs text-text-tertiary mt-0.5">
            Edit any field before approving. Approved records are saved to your record.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={approveAll}
            className="text-[11px] px-3 py-1.5 rounded-lg font-semibold transition-opacity hover:opacity-80"
            style={{ background: "color-mix(in srgb, var(--color-success) 12%, transparent)", color: "var(--color-success)", border: "1px solid color-mix(in srgb, var(--color-success) 20%, transparent)" }}>
            Approve all
          </button>
          <button onClick={rejectAll}
            className="text-[11px] px-3 py-1.5 rounded-lg font-semibold transition-opacity hover:opacity-80"
            style={{ background: "color-mix(in srgb, var(--color-danger) 8%, transparent)", color: "var(--color-danger-soft)", border: "1px solid color-mix(in srgb, var(--color-danger) 15%, transparent)" }}>
            Reject all
          </button>
        </div>
      </div>

      {/* Record groups */}
      <div className="divide-y" style={{ borderColor: "var(--color-surface-overlay-strong)" }}>
        {Array.from(grouped.entries()).map(([fileName, fileRecords]) => (
          <FileGroup
            key={fileName}
            fileName={fileName}
            records={fileRecords}
            onApproval={setApproval}
            onUpdate={updateField}
          />
        ))}
      </div>

      {/* Summary footer */}
      <div className="px-6 py-4 flex items-center justify-between gap-4"
        style={{ borderTop: "1px solid var(--color-border-subtle)", background: "rgba(0,0,0,0.2)" }}>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-success font-semibold">{approved.length} approved</span>
          <span className="text-danger-soft">{rejected.length} rejected</span>
          {pending.length > 0 && <span className="text-text-tertiary">{pending.length} pending</span>}
        </div>

        <div className="flex items-center gap-3">
          {saveError && (
            <p className="text-xs text-danger-soft">{saveError}</p>
          )}
          <button onClick={onDismiss}
            className="text-xs text-text-faint hover:text-text-tertiary transition-colors px-3 py-2">
            Dismiss
          </button>
          <button
            onClick={handleSave}
            disabled={saving || approved.length === 0}
            className="px-5 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-40"
            style={{ background: "var(--color-accent)", color: "var(--color-surface-base)" }}>
            {saving ? "Saving…" : `Save ${approved.length} approved →`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// FileGroup — one source file's records
// ------------------------------------------------------------
interface FileGroupProps {
  fileName: string;
  records: BatchRecord[];
  onApproval: (key: string, state: "approved" | "rejected") => void;
  onUpdate: (key: string, patch: Partial<ExtractedWinRecord>) => void;
}

function FileGroup({ fileName, records, onApproval, onUpdate }: FileGroupProps) {
  const approvedCount = records.filter((r) => r.approval === "approved").length;
  const totalCount = records.length;

  return (
    <div>
      <div className="flex items-center gap-3 px-6 py-3"
        style={{ background: "var(--color-surface-overlay-subtle)" }}>
        <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: "color-mix(in srgb, var(--color-accent) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" stroke="var(--color-accent)" strokeWidth="1.5"/>
            <polyline points="13 2 13 9 20 9" stroke="var(--color-accent)" strokeWidth="1.5"/>
          </svg>
        </div>
        <span className="text-xs font-semibold text-text-primary truncate flex-1">{fileName}</span>
        <span className="text-[10px] text-text-tertiary flex-shrink-0">
          {approvedCount}/{totalCount} approved
        </span>
      </div>
      <div className="px-4 pb-4 space-y-3 pt-1">
        {records.map((record) => (
          <RecordCard
            key={record.key}
            record={record}
            onApproval={onApproval}
            onUpdate={onUpdate}
          />
        ))}
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// RecordCard — single win record
// ------------------------------------------------------------
interface RecordCardProps {
  record: BatchRecord;
  onApproval: (key: string, state: "approved" | "rejected") => void;
  onUpdate: (key: string, patch: Partial<ExtractedWinRecord>) => void;
}

function RecordCard({ record, onApproval, onUpdate }: RecordCardProps) {
  const { key, edited, approval, extracted } = record;
  const isLowConfidence = extracted.confidence === "low";
  const isMediumConfidence = extracted.confidence === "medium";
  const needsReview = isLowConfidence || isMediumConfidence;

  const borderColor =
    approval === "approved"
      ? "color-mix(in srgb, var(--color-success) 30%, transparent)"
      : approval === "rejected"
      ? "color-mix(in srgb, var(--color-danger) 20%, transparent)"
      : needsReview
      ? isLowConfidence
        ? "color-mix(in srgb, var(--color-danger) 25%, transparent)"
        : "color-mix(in srgb, var(--color-accent) 25%, transparent)"
      : "var(--color-border-subtle)";

  return (
    <div className="rounded-xl p-4 space-y-3"
      style={{ background: "var(--color-surface-overlay-subtle)", border: `1px solid ${borderColor}`, transition: "border-color 0.15s" }}>

      {/* Confidence flag */}
      {needsReview && approval === "pending" && (
        <div className="flex items-center gap-1.5"
          style={{ color: isLowConfidence ? "var(--color-danger-soft)" : "var(--color-accent)" }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
              stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.15"/>
            <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span className="text-[10px] font-semibold uppercase tracking-wide">
            {isLowConfidence ? "Low confidence — review before approving" : "Medium confidence"}
          </span>
        </div>
      )}

      {/* Title + category row */}
      <div className="flex gap-2">
        <input
          type="text"
          value={edited.title}
          onChange={(e) => onUpdate(key, { title: e.target.value })}
          maxLength={80}
          className="flex-1 text-sm font-semibold text-text-primary rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-accent/40"
          style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border-strong)" }}
          placeholder="Title"
        />
        <select
          value={edited.category}
          onChange={(e) => onUpdate(key, { category: e.target.value as WinCategory })}
          className="text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-accent/40"
          style={{ background: "var(--color-surface-raised)", color: "var(--color-text-primary)", border: "1px solid var(--color-border-strong)", minWidth: "130px" }}>
          {WIN_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Impact */}
      <textarea
        value={edited.impact}
        onChange={(e) => onUpdate(key, { impact: e.target.value })}
        rows={2}
        className="w-full text-xs text-text-secondary rounded-lg px-2.5 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-accent/40"
        style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border-strong)" }}
        placeholder="Impact statement"
      />

      {/* ARR + Date row */}
      <div className="flex gap-2">
        {/* ARR */}
        <div className="flex-1 relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-text-tertiary">$</span>
          <input
            type="text"
            inputMode="numeric"
            value={edited.arr_amount !== null ? formatARR(edited.arr_amount) : ""}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9]/g, "");
              onUpdate(key, { arr_amount: raw === "" ? null : parseInt(raw, 10) });
            }}
            className="w-full text-xs text-text-primary rounded-lg pl-6 pr-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-accent/40"
            style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border-strong)" }}
            placeholder="ARR"
          />
          {edited.arr_amount !== null && (
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-text-tertiary">ARR</span>
          )}
        </div>
        {/* Date */}
        <input
          type="date"
          value={edited.happened_at?.slice(0, 10) ?? ""}
          onChange={(e) => onUpdate(key, { happened_at: e.target.value || null })}
          className="text-xs text-text-secondary rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-accent/40"
          style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border-strong)", colorScheme: "dark", minWidth: "140px" }}
        />
      </div>

      {/* Tags */}
      <TagEditor
        tags={edited.tags}
        onChange={(tags) => onUpdate(key, { tags })}
      />

      {/* Source excerpt (collapsed, for reference) */}
      <details className="group">
        <summary className="text-[10px] text-text-faint cursor-pointer hover:text-text-tertiary transition-colors list-none flex items-center gap-1">
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" className="group-open:rotate-90 transition-transform">
            <polyline points="9 18 15 12 9 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          Source excerpt
        </summary>
        <p className="mt-1.5 text-[10px] text-text-quaternary leading-relaxed italic px-1"
          style={{ borderLeft: "2px solid var(--color-border-default)", paddingLeft: "8px" }}>
          {extracted.raw_excerpt || "—"}
        </p>
      </details>

      {/* Approve / Reject */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onApproval(key, "approved")}
          className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
          style={{
            background: approval === "approved" ? "color-mix(in srgb, var(--color-success) 24%, transparent)" : "color-mix(in srgb, var(--color-success) 14%, transparent)",
            color: "var(--color-success)",
            border: `1px solid ${approval === "approved" ? "color-mix(in srgb, var(--color-success) 48%, transparent)" : "color-mix(in srgb, var(--color-success) 32%, transparent)"}`,
          }}>
          {approval === "approved" ? "✓ Approved" : "Approve"}
        </button>
        <button
          onClick={() => onApproval(key, "rejected")}
          className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
          style={{
            background: approval === "rejected" ? "color-mix(in srgb, var(--color-danger) 20%, transparent)" : "color-mix(in srgb, var(--color-danger) 12%, transparent)",
            color: "var(--color-danger-soft)",
            border: `1px solid ${approval === "rejected" ? "color-mix(in srgb, var(--color-danger) 42%, transparent)" : "color-mix(in srgb, var(--color-danger) 28%, transparent)"}`,
          }}>
          {approval === "rejected" ? "✕ Rejected" : "Reject"}
        </button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// TagEditor
// ------------------------------------------------------------
interface TagEditorProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

function TagEditor({ tags, onChange }: TagEditorProps) {
  const [input, setInput] = useState("");

  function addTag(raw: string) {
    const tag = raw.trim().toLowerCase().replace(/,/g, "");
    if (!tag || tags.includes(tag) || tags.length >= 8) return;
    onChange([...tags, tag]);
    setInput("");
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {tags.map((tag) => (
        <span key={tag}
          className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
          style={{ background: "var(--color-surface-overlay-strong)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border-default)" }}>
          {tag}
          <button onClick={() => removeTag(tag)}
            className="text-text-tertiary hover:text-text-secondary transition-colors leading-none"
            aria-label={`Remove tag ${tag}`}>
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
        placeholder={tags.length === 0 ? "Add tags…" : "+"}
        className="text-[10px] text-text-secondary bg-transparent focus:outline-none"
        style={{ width: input.length > 0 ? `${Math.max(60, input.length * 8)}px` : "50px", minWidth: "40px" }}
      />
    </div>
  );
}
