"use client";

import { useRef, useState, useCallback } from "react";
import type { FileExtractionResult } from "@/types";

// ------------------------------------------------------------
// Config
// ------------------------------------------------------------
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ACCEPTED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
];
const ACCEPTED_EXTENSIONS = ".png,.jpg,.jpeg,.webp,.pdf";

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------
interface FileEntry {
  file: File;
  id: string; // stable key for list rendering
  status: "queued" | "uploading" | "done" | "error";
  error: string | null;
  result: FileExtractionResult | null;
}

interface Props {
  onResults: (results: FileExtractionResult[]) => void;
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function validateFile(file: File): string | null {
  if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
    return `${file.name}: unsupported type. Use PNG, JPG, WEBP, or PDF.`;
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `${file.name}: file too large. Max 10MB. Try compressing or splitting it.`;
  }
  return null;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ------------------------------------------------------------
// Component
// ------------------------------------------------------------
export default function FileUploader({ onResults }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // ----- File ingestion -----
  const addFiles = useCallback((incoming: File[]) => {
    const newEntries: FileEntry[] = [];
    const rejections: string[] = [];

    for (const file of incoming) {
      const err = validateFile(file);
      if (err) {
        rejections.push(err);
      } else {
        newEntries.push({ file, id: uid(), status: "queued", error: null, result: null });
      }
    }

    if (newEntries.length > 0) {
      setEntries((prev) => [...prev, ...newEntries]);
      uploadAll(newEntries);
    }

    // Surface validation errors immediately as non-blocking entries
    if (rejections.length > 0) {
      const errorEntries: FileEntry[] = rejections.map((msg) => ({
        file: new File([], msg),
        id: uid(),
        status: "error",
        error: msg,
        result: null,
      }));
      setEntries((prev) => [...prev, ...errorEntries]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ----- Upload + extract -----
  async function uploadAll(toUpload: FileEntry[]) {
    // Mark all as uploading
    setEntries((prev) =>
      prev.map((e) =>
        toUpload.find((u) => u.id === e.id)
          ? { ...e, status: "uploading" }
          : e
      )
    );

    // Process in parallel — each file is independent
    await Promise.all(
      toUpload.map(async (entry) => {
        try {
          const formData = new FormData();
          formData.append("file", entry.file);

          const res = await fetch("/api/wins/upload", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            const errMsg: string = body.error ?? `Upload failed (${res.status})`;
            setEntries((prev) =>
              prev.map((e) =>
                e.id === entry.id ? { ...e, status: "error", error: errMsg } : e
              )
            );
            return;
          }

          const result: FileExtractionResult = await res.json();

          setEntries((prev) =>
            prev.map((e) =>
              e.id === entry.id ? { ...e, status: "done", result } : e
            )
          );

          // Bubble results up to parent so batch approval UI can show them
          if (result.records.length > 0) {
            onResults([result]);
          }
        } catch {
          setEntries((prev) =>
            prev.map((e) =>
              e.id === entry.id
                ? { ...e, status: "error", error: "We couldn't reach the server. Check your connection and try again." }
                : e
            )
          );
        }
      })
    );
  }

  // ----- Drag events -----
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    // Only clear if leaving the drop zone itself, not a child element
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) addFiles(files);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) addFiles(files);
    // Reset input so same file can be re-selected if needed
    e.target.value = "";
  }

  function removeEntry(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  const hasEntries = entries.length > 0;
  const allDone = hasEntries && entries.every((e) => e.status === "done" || e.status === "error");

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: "linear-gradient(160deg,#0E1628 0%,#080B14 100%)",
        border: `1px solid ${isDragging ? "rgba(245,158,11,0.5)" : "rgba(245,158,11,0.15)"}`,
        transition: "border-color 0.15s ease",
      }}
    >
      <h2 className="text-base font-bold text-[#F8F4EC] mb-1">Upload a file</h2>
      <p className="text-xs text-[#6B7280] mb-4">
        Screenshots, PDFs, CRM exports. AI extracts every win automatically.
      </p>

      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className="relative flex flex-col items-center justify-center gap-2 rounded-xl cursor-pointer transition-all"
        style={{
          padding: "28px 20px",
          background: isDragging
            ? "rgba(245,158,11,0.06)"
            : "rgba(255,255,255,0.02)",
          border: `1.5px dashed ${isDragging ? "rgba(245,158,11,0.4)" : "rgba(255,255,255,0.1)"}`,
          transition: "all 0.15s ease",
        }}
      >
        {/* Upload icon */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
          style={{ color: isDragging ? "#F59E0B" : "#374151", transition: "color 0.15s ease" }}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>

        <p className="text-xs text-[#6B7280] text-center">
          <span className="text-[#F59E0B] font-semibold">Click to upload</span> or drag and drop
        </p>
        <p className="text-[10px] text-[#374151]">PNG, JPG, WEBP, PDF · Max 10MB per file</p>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          multiple
          onChange={handleFileInput}
          className="sr-only"
          aria-label="Upload files"
        />
      </div>

      {/* File list */}
      {hasEntries && (
        <div className="mt-4 space-y-2">
          {entries.map((entry) => (
            <FileRow
              key={entry.id}
              entry={entry}
              onRemove={() => removeEntry(entry.id)}
              onRetry={() => {
                if (entry.status === "error" && entry.file.size > 0) {
                  setEntries((prev) =>
                    prev.map((e) =>
                      e.id === entry.id ? { ...e, status: "queued", error: null } : e
                    )
                  );
                  uploadAll([{ ...entry, status: "queued", error: null }]);
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Summary when all complete */}
      {allDone && (
        <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-[11px] text-[#6B7280]">
            {entries.filter((e) => e.status === "done" && (e.result?.records.length ?? 0) > 0).length > 0
              ? "Review extracted wins below before saving."
              : "No wins were found. Try a different file or log one manually above."}
          </p>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------
// FileRow — single file status row
// ------------------------------------------------------------
interface FileRowProps {
  entry: FileEntry;
  onRemove: () => void;
  onRetry: () => void;
}

function FileRow({ entry, onRemove, onRetry }: FileRowProps) {
  const { file, status, error, result } = entry;
  const isValidationError = file.size === 0;

  return (
    <div
      className="flex items-center gap-3 rounded-xl px-3 py-2.5"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${
          status === "error"
            ? "rgba(239,68,68,0.2)"
            : status === "done"
            ? "rgba(16,185,129,0.15)"
            : "rgba(255,255,255,0.06)"
        }`,
      }}
    >
      {/* File type icon */}
      <FileTypeIcon mimeType={file.type} />

      {/* Name + meta */}
      <div className="flex-1 min-w-0">
        {isValidationError ? (
          <p className="text-xs text-red-400 leading-snug">{error}</p>
        ) : (
          <>
            <p className="text-xs text-[#F8F4EC] truncate font-medium">{file.name}</p>
            <p className="text-[10px] text-[#374151] mt-0.5">
              {formatSize(file.size)}
              {status === "done" && result && result.records.length > 0 && (
                <span className="ml-2 text-[#10B981]">
                  · {result.records.length} win{result.records.length === 1 ? "" : "s"} found
                </span>
              )}
              {status === "done" && result && result.records.length === 0 && (
                <span className="ml-2 text-[#6B7280]">· No wins found</span>
              )}
            </p>
          </>
        )}
        {status === "error" && !isValidationError && error && (
          <p className="text-[10px] text-red-400 mt-0.5">{error}</p>
        )}
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {status === "uploading" && <Spinner />}
        {status === "done" && result && result.records.length > 0 && (
          <span style={{ color: "#10B981" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <polyline points="20 6 9 17 4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        )}
        {status === "error" && !isValidationError && (
          <button
            onClick={onRetry}
            className="text-[10px] text-[#F59E0B] hover:opacity-80 transition-opacity font-medium"
          >
            Retry
          </button>
        )}
        <button
          onClick={onRemove}
          className="text-[#374151] hover:text-[#6B7280] transition-colors"
          aria-label={`Remove ${file.name}`}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Sub-components
// ------------------------------------------------------------
function FileTypeIcon({ mimeType }: { mimeType: string }) {
  const isPDF = mimeType === "application/pdf";
  return (
    <div
      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-[9px] font-bold"
      style={{
        background: isPDF ? "rgba(239,68,68,0.1)" : "rgba(99,102,241,0.1)",
        color: isPDF ? "#F87171" : "#818CF8",
        border: `1px solid ${isPDF ? "rgba(239,68,68,0.2)" : "rgba(99,102,241,0.2)"}`,
      }}
    >
      {isPDF ? "PDF" : "IMG"}
    </div>
  );
}

function Spinner() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      style={{ color: "#F59E0B", animation: "spin 0.8s linear infinite" }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
