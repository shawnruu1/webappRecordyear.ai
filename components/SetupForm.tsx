"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ROLE_OPTIONS, DEFAULT_USER_ROLE } from "@/types";
import type { UserRole } from "@/types";

// Shared field affordance — matches the app's editable-control treatment.
const FIELD =
  "w-full text-sm text-text-primary rounded-lg px-3 py-2 bg-[var(--color-surface-overlay)] border border-[var(--color-border-strong)] transition-colors focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-accent/40";

// First-run setup form. Writes the five onboarding fields + the completion
// flag, then routes into the app. Upsert (onConflict: id) creates the profile
// row for brand-new users and updates it for anyone re-running setup.
export default function SetupForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>(DEFAULT_USER_ROLE);
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Add your name so your records are attributed to you.");
      return;
    }
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { error: upsertError } = await supabase.from("profiles").upsert(
      {
        id: userId,
        display_name: name.trim(),
        role,
        company: company.trim() || null,
        job_title: jobTitle.trim() || null,
        start_date: startDate || null,
        onboarding_completed_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (upsertError) {
      setError(upsertError.message);
      setSaving(false);
      return;
    }

    router.push("/capture");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs text-text-tertiary mb-1.5">Your name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Smith"
          maxLength={80}
          autoFocus
          className={FIELD}
        />
      </div>

      <div>
        <label className="block text-xs text-text-tertiary mb-1.5">
          What best describes your work?
        </label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
          className={FIELD}
          style={{ background: "var(--color-surface-raised)" }}
        >
          {ROLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs text-text-tertiary mb-1.5">
          Company <span className="text-text-faint">(optional)</span>
        </label>
        <input
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Acme Inc."
          maxLength={120}
          className={FIELD}
        />
      </div>

      <div>
        <label className="block text-xs text-text-tertiary mb-1.5">
          Job title <span className="text-text-faint">(optional)</span>
        </label>
        <input
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          placeholder="Account Executive"
          maxLength={120}
          className={FIELD}
        />
      </div>

      <div>
        <label className="block text-xs text-text-tertiary mb-1.5">
          Start date <span className="text-text-faint">(optional)</span>
        </label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className={FIELD}
          style={{ colorScheme: "dark" }}
        />
      </div>

      {error && <p className="text-xs text-danger-soft">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full px-5 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-40"
        style={{ background: "var(--color-accent)", color: "var(--color-surface-base)" }}
      >
        {saving ? "Saving…" : "Continue →"}
      </button>
    </form>
  );
}
