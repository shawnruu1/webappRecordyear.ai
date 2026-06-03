// ============================================================
// Verification — single source of truth for tier derivation.
//
// One pure function maps the evidence signals carried on a win row to
// a VerificationTier. Everything that needs to know "how verified is
// this record" — portfolio, dashboard, future share cards — calls
// here. The honest-labeling rules from CLAUDE.md live in exactly one
// place, not scattered across SQL CASE statements and components.
// ============================================================

import type { VerificationTier } from "@/types";

// The evidence signals we read. Kept loose on `verification.source` so
// we tolerate historical drift ('self' was written before the model
// was normalized to 'self_reported').
export interface VerificationSignals {
  verification: { source?: string | null } | null;
  source_hash: string | null;
  // From the wins_with_edit_status view — a win<->artifact link exists.
  has_linked_artifact?: boolean | null;
  // Phase 2 signals — modeled now, populated later. Absence = false.
  has_cryptographic_signature?: boolean | null;
}

export interface DerivedVerification {
  tier: VerificationTier;
  vouched: boolean;
}

// Normalize the stored source value to canonical form.
function normalizeSource(source?: string | null): string | null {
  if (!source) return null;
  if (source === "self") return "self_reported"; // legacy rows
  return source;
}

/**
 * deriveVerificationTier
 *
 * Precedence (strongest evidence wins):
 *   system_verified            — pulled from source system (source === 'system')
 *   cryptographically_verified — artifact carries a signature
 *   artifact_attached          — an artifact/file backs the record
 *   self_reported              — user claim, no evidence (default)
 *
 * Phase 1 only reaches artifact_attached / self_reported; the higher
 * tiers are wired but their signals aren't produced yet.
 */
export function deriveVerificationTier(
  win: VerificationSignals
): DerivedVerification {
  const source = normalizeSource(win.verification?.source);

  const hasArtifact =
    win.has_linked_artifact === true ||
    source === "artifact" ||
    Boolean(win.source_hash);

  let tier: VerificationTier;
  if (source === "system") {
    tier = "system_verified";
  } else if (win.has_cryptographic_signature === true) {
    tier = "cryptographically_verified";
  } else if (hasArtifact) {
    tier = "artifact_attached";
  } else {
    tier = "self_reported";
  }

  // Vouching is Phase 2 (needs network density). Modeled, never set yet.
  return { tier, vouched: false };
}

// Convenience for header/summary math: does this record carry evidence
// beyond a bare self-report?
export function hasEvidence(win: VerificationSignals): boolean {
  return deriveVerificationTier(win).tier !== "self_reported";
}
