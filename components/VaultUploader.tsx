"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ArtifactUploadResult } from "@/types";

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
const PPTX_MIME = "application/vnd.openxmlformats-officedocument.presentationml.presentation";

// macOS sometimes reports PPTX as application/zip or application/octet-stream.
// Fall back to extension check so we don't reject valid files.
function resolvedMime(file: File): string {
  if (
    file.name.toLowerCase().endsWith(".pptx") &&
    (file.type === "application/zip" ||
      file.type === "application/octet-stream" ||
      file.type === "")
  ) {
    return PPTX_MIME;
  }
  return file.type;
}

function isAccepted(file: File): boolean {
  const mime = resolvedMime(file);
  return mime === "application/pdf" || mime === PPTX_MIME;
}

interface Props {
  onResult: (result: ArtifactUploadResult) => void;
}

type UploadState =
  | { status: "idle" }
  | { status: "uploading"; fileName: string }
  | { status: "error"; message: string };

export default function VaultUploader({ onResult }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>({ status: "idle" });

  async function handleFile(file: File) {
    // Client-side validation — use extension fallback for macOS MIME quirks
    if (!isAccepted(file)) {
      setUploadState({
        status: "error",
        message: `Unsupported type. Upload a PDF or PPTX.`,
      });
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadState({
        status: "error",
        message: `File too large. Max 50MB.`,
      });
      return;
    }

    setUploadState({ status: "uploading", fileName: file.name });

    const mime = resolvedMime(file);

    // ---- Step 1: Upload directly to Supabase Storage from the browser ----
    // This bypasses Next.js entirely, so there's no server body-size limit.
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      setUploadState({ status: "error", message: "Session expired. Please refresh and try again." });
      return;
    }

    const tempId = crypto.randomUUID();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${user.id}/${tempId}/${safeFileName}`;

    const { error: storageError } = await supabase.storage
      .from("artifacts")
      .upload(storagePath, file, { contentType: mime, upsert: false });

    if (storageError) {
      setUploadState({ status: "error", message: `Storage upload failed: ${storageError.message}` });
      return;
    }

    // ---- Step 2: Ask the server to hash + extract AI metadata ----
    let processRes: Response;
    try {
      processRes = await fetch("/api/artifacts/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storagePath, mimeType: mime, fileName: file.name }),
      });
    } catch {
      setUploadState({ status: "error", message: "Could not reach the server. Check your connection." });
      return;
    }

    if (!processRes.ok) {
      const b = await processRes.json().catch(() => ({})) as { error?: string };
      setUploadState({ status: "error", message: b.error ?? `Processing failed (${processRes.status})` });
      return;
    }

    const result = (await processRes.json()) as ArtifactUploadResult;
    setUploadState({ status: "idle" });
    onResult(result);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  function retry() {
    setUploadState({ status: "idle" });
    inputRef.current?.click();
  }

  const isUploading = uploadState.status === "uploading";

  return (
    <div>
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node))
            setIsDragging(false);
        }}
        onDrop={handleDrop}
        onClick={() => !isUploading && inputRef.current?.click()}
        className="relative flex flex-col items-center justify-center gap-2 rounded-xl transition-all"
        style={{
          padding: "24px 20px",
          background: isDragging
            ? "color-mix(in srgb, var(--color-accent) 5%, transparent)"
            : "var(--color-surface-overlay-subtle)",
          border: `1.5px dashed ${
            isDragging
              ? "color-mix(in srgb, var(--color-accent) 40%, transparent)"
              : "var(--color-border-default)"
          }`,
          cursor: isUploading ? "default" : "pointer",
          transition: "all 0.15s ease",
        }}
      >
        {isUploading ? (
          <>
            <Spinner />
            <p className="text-xs text-text-tertiary">
              Extracting from{" "}
              <span className="text-text-primary font-medium">
                {uploadState.fileName}
              </span>
              …
            </p>
            <p className="text-[10px] text-text-faint">
              AI is reading the deck. Takes about 10 seconds.
            </p>
          </>
        ) : (
          <>
            {/* Upload icon */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              style={{
                color: isDragging ? "var(--color-accent)" : "var(--color-text-faint)",
                transition: "color 0.15s ease",
              }}
            >
              <path
                d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points="17 8 12 3 7 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <line
                x1="12"
                y1="3"
                x2="12"
                y2="15"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <p className="text-xs text-text-tertiary text-center">
              <span className="text-accent font-semibold">
                Click to upload
              </span>{" "}
              or drag and drop
            </p>
            <p className="text-[10px] text-text-faint">PPTX or PDF · Max 50MB</p>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation"
          onChange={handleInput}
          className="sr-only"
          aria-label="Upload deck or document"
        />
      </div>

      {/* Error state */}
      {uploadState.status === "error" && (
        <div
          className="mt-2 rounded-xl px-4 py-3 flex items-center justify-between gap-3"
          style={{
            background: "color-mix(in srgb, var(--color-danger) 6%, transparent)",
            border: "1px solid color-mix(in srgb, var(--color-danger) 20%, transparent)",
          }}
        >
          <p className="text-xs text-danger-soft">{uploadState.message}</p>
          <button
            onClick={retry}
            className="text-[10px] text-accent hover:opacity-80 transition-opacity font-semibold flex-shrink-0"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      style={{ color: "var(--color-accent)", animation: "spin 0.8s linear infinite" }}
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
