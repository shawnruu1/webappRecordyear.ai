"use client";

import { useState } from "react";
import type { Win } from "@/types";

export default function WinLogger({
  onLogged,
}: {
  onLogged?: (count: number) => void;
}) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    setError(null);

    const res = await fetch("/api/wins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ raw_input: input }),
    });

    if (res.ok) {
      const wins: Win[] = await res.json();
      setInput("");
      onLogged?.(wins.length);
    } else {
      const body = await res.json().catch(() => ({}));
      setError(`Error ${res.status}: ${body.error ?? "Unknown error"}`);
    }
    setLoading(false);
  };

  return (
    <div>
      <h2 className="text-base font-bold text-text-primary mb-1">Write a win</h2>
      <p className="text-xs text-text-tertiary mb-4">
        Paste one win or many. AI splits and enriches each one separately.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`One win:\nClosed Acme Corp at $120K ARR. Multi-threaded exec team, navigated legal + IT review.\n\nOr paste a whole list — AI will split them automatically.`}
          rows={5}
          className="w-full px-4 py-3 rounded-xl text-sm text-text-primary placeholder-text-faint resize-none focus:outline-none focus:ring-2 focus:ring-accent/40"
          style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border-default)" }}
        />
        <button type="submit" disabled={loading || !input.trim()}
          className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-40"
          style={{ background: "var(--gradient-accent)", color: "var(--color-surface-base)" }}>
          {loading ? "Processing..." : "Log win →"}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 rounded-xl" style={{ background: "color-mix(in srgb, var(--color-danger) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--color-danger) 20%, transparent)" }}>
          <p className="text-xs text-danger-soft">{error}</p>
        </div>
      )}
    </div>
  );
}
