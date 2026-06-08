"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Inline username claim. If a username already exists, shows the live
// public link instead of the form. No password / separate signup — a
// claim just reserves the slug and flips public_profile_enabled.
export default function UsernameClaim({
  initialUsername,
  initialDisplayName,
}: {
  initialUsername: string | null;
  initialDisplayName: string | null;
}) {
  const router = useRouter();
  const [username, setUsername] = useState(initialUsername ?? "");
  const [displayName, setDisplayName] = useState(initialDisplayName ?? "");
  const [claimed, setClaimed] = useState<string | null>(initialUsername);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClaim(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/profile/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, display_name: displayName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Try again.");
      } else {
        setClaimed(data.username);
        router.refresh();
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  // Already claimed — show the live link.
  if (claimed) {
    const path = `/${claimed}`;
    return (
      <div
        className="rounded-xl px-4 py-3 flex items-center justify-between gap-3"
        style={{
          background: "color-mix(in srgb, var(--color-accent) 5%, transparent)",
          border: "1px solid color-mix(in srgb, var(--color-accent) 15%, transparent)",
        }}
      >
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-text-tertiary mb-0.5">
            Your public profile
          </p>
          <a
            href={path}
            target="_blank"
            className="text-sm font-semibold text-accent hover:underline truncate block"
          >
            recordyear.ai/{claimed}
          </a>
        </div>
        <span className="text-[9px] uppercase tracking-wide text-text-faint flex-shrink-0">
          Records are private until you opt each one in
        </span>
      </div>
    );
  }

  // Not claimed — show the prompt.
  return (
    <div
      className="rounded-xl px-4 py-4"
      style={{
        background: "var(--color-surface-overlay-subtle)",
        border: "1px solid var(--color-border-default)",
      }}
    >
      <p className="text-sm font-semibold text-text-primary mb-0.5">
        Want a public profile?
      </p>
      <p className="text-xs text-text-tertiary mb-3">
        Claim your username — recruiter-shareable, and every record stays
        private until you choose to show it.
      </p>

      <form onSubmit={handleClaim} className="space-y-2">
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Display name (e.g. Shawn Winters)"
          className="w-full px-3 py-2 rounded-lg text-sm text-text-primary placeholder-text-quaternary focus:outline-none focus:ring-2 focus:ring-accent/40"
          style={{
            background: "var(--color-surface-overlay-strong)",
            border: "1px solid var(--color-border-strong)",
          }}
        />
        <div className="flex items-stretch gap-2">
          <div
            className="flex items-center pl-3 pr-1 rounded-lg text-sm text-text-tertiary flex-1"
            style={{
              background: "var(--color-surface-overlay-strong)",
              border: "1px solid var(--color-border-strong)",
            }}
          >
            <span className="text-text-quaternary">recordyear.ai/</span>
            <input
              type="text"
              value={username}
              onChange={(e) =>
                setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
              }
              placeholder="username"
              required
              className="flex-1 bg-transparent py-2 pl-0.5 text-sm text-text-primary placeholder-text-quaternary focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading || username.length < 3}
            className="px-4 rounded-lg text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50"
            style={{
              background: "var(--color-accent)",
              color: "var(--color-surface-base)",
            }}
          >
            {loading ? "Claiming..." : "Claim"}
          </button>
        </div>
        {error && <p className="text-xs text-danger-soft">{error}</p>}
      </form>
    </div>
  );
}
