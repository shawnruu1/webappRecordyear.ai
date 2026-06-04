"use client";

import { useState } from "react";
import { type RecordVisibility } from "@/types";

const OPTIONS: { value: RecordVisibility; label: string }[] = [
  { value: "private", label: "Private" },
  { value: "blurred_public", label: "Blurred" },
  { value: "full_public", label: "Public" },
];

// Per-record visibility control. Optimistic — flips local state, then
// persists; reverts if the request fails. Defaults to whatever the
// record currently is (private until the user opts in).
export default function VisibilityToggle({
  winId,
  initial,
}: {
  winId: string;
  initial: RecordVisibility;
}) {
  const [visibility, setVisibility] = useState<RecordVisibility>(initial);
  const [saving, setSaving] = useState(false);

  async function update(next: RecordVisibility) {
    if (next === visibility || saving) return;
    const prev = visibility;
    setVisibility(next); // optimistic
    setSaving(true);
    try {
      const res = await fetch(`/api/wins/${winId}/visibility`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility: next }),
      });
      if (!res.ok) throw new Error("update failed");
    } catch {
      setVisibility(prev); // revert
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="inline-flex rounded-lg overflow-hidden"
      style={{ border: "1px solid var(--color-border-strong)" }}
    >
      {OPTIONS.map((opt) => {
        const active = visibility === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => update(opt.value)}
            disabled={saving}
            className="text-[9px] font-semibold uppercase tracking-wide px-2 py-1 transition-colors disabled:opacity-60"
            style={{
              background: active ? "color-mix(in srgb, var(--color-accent) 15%, transparent)" : "transparent",
              color: active ? "var(--color-accent)" : "var(--color-text-tertiary)",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
