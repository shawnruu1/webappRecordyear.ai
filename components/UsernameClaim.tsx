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
          background: "rgba(245,158,11,0.05)",
          border: "1px solid rgba(245,158,11,0.15)",
        }}
      >
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-[#6B7280] mb-0.5">
            Your public profile
          </p>
          <a
            href={path}
            target="_blank"
            className="text-sm font-semibold text-[#F59E0B] hover:underline truncate block"
          >
            recordyear.ai/{claimed}
          </a>
        </div>
        <span className="text-[9px] uppercase tracking-wide text-[#374151] flex-shrink-0">
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
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <p className="text-sm font-semibold text-[#F8F4EC] mb-0.5">
        Want a public profile?
      </p>
      <p className="text-xs text-[#6B7280] mb-3">
        Claim your username — recruiter-shareable, and every record stays
        private until you choose to show it.
      </p>

      <form onSubmit={handleClaim} className="space-y-2">
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Display name (e.g. Shawn Winters)"
          className="w-full px-3 py-2 rounded-lg text-sm text-[#F8F4EC] placeholder-[#4B5563] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/40"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        />
        <div className="flex items-stretch gap-2">
          <div
            className="flex items-center pl-3 pr-1 rounded-lg text-sm text-[#6B7280] flex-1"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <span className="text-[#4B5563]">recordyear.ai/</span>
            <input
              type="text"
              value={username}
              onChange={(e) =>
                setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
              }
              placeholder="username"
              required
              className="flex-1 bg-transparent py-2 pl-0.5 text-sm text-[#F8F4EC] placeholder-[#4B5563] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading || username.length < 3}
            className="px-4 rounded-lg text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg,#F59E0B 0%,#FCD34D 100%)",
              color: "#080B14",
            }}
          >
            {loading ? "Claiming..." : "Claim"}
          </button>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </form>
    </div>
  );
}
