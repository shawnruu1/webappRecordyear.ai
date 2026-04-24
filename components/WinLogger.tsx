"use client";

import { useState } from "react";
import type { Win } from "@/types";

export default function WinLogger() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [logged, setLogged] = useState<Win[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setLogged(null);

    const res = await fetch("/api/wins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ raw_input: input }),
    });

    if (res.ok) {
      const wins: Win[] = await res.json();
      setLogged(wins);
      setInput("");
      window.location.reload();
    } else {
      const body = await res.json().catch(() => ({}));
      setError(`Error ${res.status}: ${body.error ?? "Unknown error"}`);
    }
    setLoading(false);
  };

  return (
    <div className="rounded-2xl p-6"
      style={{ background: "linear-gradient(160deg,#0E1628 0%,#080B14 100%)", border: "1px solid rgba(245,158,11,0.15)" }}>
      <h2 className="text-base font-bold text-[#F8F4EC] mb-1">Log a win</h2>
      <p className="text-xs text-[#6B7280] mb-4">
        Paste one win or many. AI splits and enriches each one separately.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`One win:\nClosed Acme Corp at $120K ARR. Multi-threaded exec team, navigated legal + IT review.\n\nOr paste a whole list — AI will split them automatically.`}
          rows={5}
          className="w-full px-4 py-3 rounded-xl text-sm text-[#F8F4EC] placeholder-[#374151] resize-none focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/40"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        />
        <button type="submit" disabled={loading || !input.trim()}
          className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-40"
          style={{ background: "linear-gradient(135deg,#F59E0B 0%,#FCD34D 100%)", color: "#080B14" }}>
          {loading ? "Processing..." : "Log win →"}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 rounded-xl" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {logged && logged.length > 0 && (
        <div className="mt-4 p-3 rounded-xl" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
          <p className="text-xs text-[#10B981] font-semibold mb-1">
            ✓ {logged.length} {logged.length === 1 ? "win" : "wins"} logged
          </p>
          {logged.map((w, i) => (
            <p key={i} className="text-xs text-[#6B7280] truncate">· {w.title}</p>
          ))}
        </div>
      )}
    </div>
  );
}
