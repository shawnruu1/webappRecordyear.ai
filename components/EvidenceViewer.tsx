"use client";

import { useEffect, useRef, useState } from "react";
import type { EvidenceKind } from "@/lib/evidence";

// ------------------------------------------------------------
// EvidenceViewer — a thin, accessible overlay that previews the
// source file backing a record. It fetches a short-lived signed URL
// on open (server-side, owner-scoped) and renders by mime type.
//
// Dismissal: close button, click-outside, Escape. Loading + error
// states are handled so it never crashes on a missing file.
// ------------------------------------------------------------

interface EvidencePayload {
  url: string;
  filename: string;
  kind: EvidenceKind;
  expiresIn: number;
}

interface Props {
  // Non-null winId = open. Null = closed.
  winId: string | null;
  winTitle?: string;
  onClose: () => void;
}

export default function EvidenceViewer({ winId, winTitle, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<EvidencePayload | null>(null);

  const closeRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const open = winId !== null;

  // ---- Fetch the signed URL when opened ----
  useEffect(() => {
    if (!winId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setPayload(null);

    (async () => {
      try {
        const res = await fetch(`/api/wins/${winId}/evidence`);
        if (cancelled) return;

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.error ?? "We couldn't load this evidence. Try again.");
          setLoading(false);
          return;
        }

        const data: EvidencePayload = await res.json();
        if (cancelled) return;
        setPayload(data);
        setLoading(false);
      } catch {
        if (cancelled) return;
        setError(
          "We couldn't reach the server. Check your connection and try again."
        );
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [winId]);

  // ---- Escape to close, focus management, scroll lock ----
  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const focusTimer = setTimeout(() => closeRef.current?.focus(), 0);

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={winTitle ? `Evidence for ${winTitle}` : "Evidence"}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: "rgba(4, 6, 12, 0.72)",
        backdropFilter: "blur(2px)",
        padding: "24px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl"
        style={{
          maxHeight: "88vh",
          background: "var(--color-surface-raised)",
          border: "1px solid var(--color-border-default)",
          boxShadow: "0 24px 64px rgba(0, 0, 0, 0.5)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between gap-3 px-5 py-3.5"
          style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
        >
          <div className="min-w-0">
            <p
              className="text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: "var(--color-warning)" }}
            >
              Evidence
            </p>
            <p className="mt-0.5 truncate text-xs text-text-tertiary">
              {payload?.filename ?? winTitle ?? ""}
            </p>
          </div>

          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close evidence viewer"
            className="flex-shrink-0 rounded-lg p-1.5 text-text-tertiary transition-colors hover:text-text-primary"
            style={{ border: "1px solid var(--color-border-subtle)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div
          className="min-h-0 flex-1 overflow-auto"
          style={{ background: "var(--color-surface-base)" }}
        >
          {loading && <ViewerSpinner />}
          {!loading && error && <ViewerError message={error} />}
          {!loading && !error && payload && <ViewerContent payload={payload} />}
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Content — renders by mime kind
// ------------------------------------------------------------
function ViewerContent({ payload }: { payload: EvidencePayload }) {
  if (payload.kind === "pdf") {
    return (
      <iframe
        src={payload.url}
        title={payload.filename}
        className="w-full"
        style={{ height: "72vh", border: 0, display: "block" }}
      />
    );
  }

  if (payload.kind === "image") {
    return (
      <div className="flex items-center justify-center p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={payload.url}
          alt={payload.filename}
          className="h-auto max-w-full rounded-lg"
          style={{ maxHeight: "76vh" }}
        />
      </div>
    );
  }

  // Anything else — no inline render. Offer filename + download.
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <FileGlyph />
      <div>
        <p className="text-sm font-medium text-text-primary">{payload.filename}</p>
        <p className="mt-1 text-xs text-text-tertiary">
          This file type can&rsquo;t be previewed here.
        </p>
      </div>
      <DownloadButton url={payload.url} filename={payload.filename} />
    </div>
  );
}

function DownloadButton({ url, filename }: { url: string; filename: string }) {
  return (
    <a
      href={url}
      download={filename}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-opacity hover:opacity-90"
      style={{
        background: "var(--color-warning)",
        color: "#1a1205",
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="7 10 12 15 17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      Download
    </a>
  );
}

// ------------------------------------------------------------
// States
// ------------------------------------------------------------
function ViewerSpinner() {
  return (
    <div className="flex items-center justify-center px-6 py-24">
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        style={{ color: "var(--color-warning)", animation: "spin 0.8s linear infinite" }}
      >
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function ViewerError({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
      <span style={{ color: "var(--color-danger-soft)" }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
          <line x1="12" y1="8" x2="12" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="16.5" r="1" fill="currentColor" />
        </svg>
      </span>
      <p className="max-w-xs text-xs text-text-tertiary">{message}</p>
    </div>
  );
}

function FileGlyph() {
  return (
    <span style={{ color: "var(--color-text-tertiary)" }}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
