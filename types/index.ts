// ------------------------------------------------------------
// Artifact types
// ------------------------------------------------------------

export type ArtifactType =
  | "slide_deck"
  | "customer_contract"
  | "employment_contract"
  | "comp_plan"
  | "claude_skill"
  | "other";

// 'gated' is a reserved enum value — rejected with "coming soon" at the API.
// Only 'private' and 'public' work in MVP.
export type ArtifactVisibility = "private" | "public" | "gated";

// ------------------------------------------------------------
// Verification spectrum — honest, named tiers.
// ------------------------------------------------------------
// The word "verified" is reserved for tiers where verification is
// actually happening (cryptographic, system). Screenshot/PDF uploads
// are "artifact_attached" — evidence on file, but fabricable. This
// protects the trust narrative from a credibility cliff.
//
// Phase 1 reachable: self_reported, artifact_attached.
// Phase 2 (modeled, not yet reachable): cryptographically_verified
// (DocuSign/Stripe/DKIM signature), system_verified (CRM/payroll API).
export type VerificationTier =
  | "self_reported"
  | "artifact_attached"
  | "cryptographically_verified"
  | "system_verified";

// Display + meaning for each tier, in one place so UI never hardcodes
// strings or colors. internalLabel is the precise term; displayLabel is
// the softened public-facing term.
export interface VerificationTierMeta {
  tier: VerificationTier;
  internalLabel: string;
  displayLabel: string;
  proves: string; // tooltip — what this tier actually proves
  color: string; // hex, dark-theme accent
}

export const VERIFICATION_TIER_META: Record<
  VerificationTier,
  VerificationTierMeta
> = {
  self_reported: {
    tier: "self_reported",
    internalLabel: "Self-reported",
    displayLabel: "Self-reported",
    proves: "Logged by the user. No evidence attached.",
    color: "#6B7280",
  },
  artifact_attached: {
    tier: "artifact_attached",
    internalLabel: "Artifact-attached",
    displayLabel: "With evidence",
    proves:
      "Backed by an uploaded document or screenshot, parsed by AI. Could be fabricated.",
    color: "#F59E0B",
  },
  cryptographically_verified: {
    tier: "cryptographically_verified",
    internalLabel: "Cryptographically verified",
    displayLabel: "Verified",
    proves:
      "Artifact carries a cryptographic signature (DocuSign, Stripe, email DKIM). Hard to fake.",
    color: "#10B981",
  },
  system_verified: {
    tier: "system_verified",
    internalLabel: "System-verified",
    displayLabel: "Verified",
    proves: "Pulled directly from the source system via API. Source of truth.",
    color: "#2DD4BF",
  },
};

// "Vouched" is a modifier on any tier, not a tier itself — another
// verified user confirmed the record. Phase 2 (needs network density).
export const VOUCHED_META = {
  label: "Vouched",
  proves: "Confirmed by another verified user.",
  color: "#818CF8",
} as const;

export interface Artifact {
  id: string;
  user_id: string;
  type: ArtifactType;
  title: string | null;
  description: string | null;       // AI-generated summary
  why_it_matters: string | null;
  source_file_path: string | null;
  source_hash: string | null;
  file_size: number | null;
  mime_type: string | null;
  extracted_metadata: Record<string, unknown> | null;
  visibility: ArtifactVisibility;
  featured: boolean;
  archived: boolean;
  parent_artifact_id: string | null;
  created_at_company: string | null;
  used_at_companies: string[];
  uploaded_at: string;
  // Computed in queries (not stored columns)
  version_count?: number;
  linked_wins_count?: number;
}

// Per-field confidence returned by AI extraction
export type FieldConfidence = "high" | "medium" | "low";

// AI-extracted metadata for a slide deck
export interface ExtractedArtifactData {
  title: string;
  summary: string;
  why_it_matters: string;
  created_at_company: string | null;
  used_at_companies: string[];
  confidence: {
    title: FieldConfidence;
    summary: FieldConfidence;
    why_it_matters: FieldConfidence;
    created_at_company: FieldConfidence;
    used_at_companies: FieldConfidence;
  };
}

// Response from POST /api/artifacts/upload
export interface ArtifactUploadResult {
  extracted: ExtractedArtifactData;
  source_file: string;
  source_hash: string;
  file_size: number;
  mime_type: string;
  similar_artifacts: Pick<Artifact, "id" | "title" | "type" | "created_at_company" | "uploaded_at">[];
}

// ------------------------------------------------------------
// Win category types
// ------------------------------------------------------------

export type WinCategory =
  | "Deal Closed"
  | "Recognition"
  | "Skill"
  | "Milestone"
  | "Relationship";

export const WIN_CATEGORIES: WinCategory[] = [
  "Deal Closed",
  "Recognition",
  "Skill",
  "Milestone",
  "Relationship",
];

// ------------------------------------------------------------
// User role types
// ------------------------------------------------------------
// Stored on profiles.role. The KEY is persisted (not the UI label),
// and drives role-aware extraction in lib/ai/buildExtractionPrompt.ts.

export type UserRole =
  | "salesperson"
  | "lawyer"
  | "project_manager"
  | "engineer"
  | "consultant"
  | "other";

export const DEFAULT_USER_ROLE: UserRole = "salesperson";

// Signup dropdown: display label -> stored role key.
export const ROLE_OPTIONS: { label: string; value: UserRole }[] = [
  { label: "Sales", value: "salesperson" },
  { label: "Legal", value: "lawyer" },
  { label: "Project Management", value: "project_manager" },
  { label: "Engineering", value: "engineer" },
  { label: "Consulting", value: "consultant" },
  { label: "Other", value: "other" },
];

// profiles row — one per auth user
export interface Profile {
  id: string; // == auth.users.id
  role: UserRole | null;
  // Public profile (added in migration 20260603_public_profiles)
  username: string | null; // URL slug, unique, case-insensitive
  display_name: string | null; // human-facing name on the public page
  public_profile_enabled: boolean; // does /[username] resolve at all
  // First-run onboarding (added in migration 20260625_onboarding_fields)
  company: string | null;
  job_title: string | null;
  start_date: string | null; // ISO date (YYYY-MM-DD)
  onboarding_completed_at: string | null; // null = setup not finished → gate to /setup
  created_at: string;
  updated_at: string;
}

export type VerificationSource = "artifact" | "self_reported";

export interface WinVerification {
  source: VerificationSource;
  ref_id?: string; // Supabase Storage path for artifact-backed wins
}

// Per-record public visibility — private by default, explicit opt-in.
export type RecordVisibility = "private" | "blurred_public" | "full_public";

export const RECORD_VISIBILITIES: RecordVisibility[] = [
  "private",
  "blurred_public",
  "full_public",
];

export interface Win {
  id: string;
  user_id: string;
  raw_input: string;
  title: string | null;
  category: WinCategory | null;
  tags: string[];
  impact: string | null;
  date: string;
  created_at: string;
  // File upload columns (added in migration 20260419)
  verification: WinVerification | null;
  source_file: string | null;
  source_hash: string | null;
  happened_at: string | null;
  recorded_at: string | null;
  arr_amount: number | null; // ARR as integer — added in migration 20260419b
  // Role-specific fields the AI surfaces but the UI doesn't yet render.
  // Background metadata only — visible categories are unaffected.
  role_context: Record<string, unknown> | null; // added in migration 20260603
  visibility: RecordVisibility; // public opt-in — added in migration 20260603
}

// win_versions row — immutable audit trail for artifact-backed edits
export interface WinVersion {
  id: string;
  win_id: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  changed_at: string;
  changed_by: string;
  reason: string | null;
}

// win_annotations row — freely editable user notes
export interface WinAnnotation {
  id: string;
  win_id: string;
  note: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

// wins_with_edit_status view — exposes raw evidence SIGNALS, not a
// pre-baked label. The tier is derived in lib/verification.ts so the
// "what it proves" logic lives in one readable place.
export interface WinWithEditStatus extends Win {
  has_version_history: boolean;
  has_linked_artifact: boolean;
}

// Shape returned by all file extractors — ready for batch approval UI
export interface ExtractedWinRecord {
  title: string;
  category: WinCategory;
  impact: string;
  tags: string[];
  arr_amount: number | null; // ARR as plain integer (MRR × 12 already applied by prompt)
  happened_at: string | null; // ISO date string if detectable, else null
  raw_excerpt: string; // The text/region Claude pulled this from
  confidence: "high" | "medium" | "low";
  arr_flag?: string | null; // Set by the ARR ambiguity guard when monetary columns are ambiguous
  owner_flag?: string | null; // Set when a row appears to belong to someone other than the user; forces low confidence
  status_flag?: string | null; // Set when a deal is not clearly closed-won; forces low confidence
  // Optional role-specific fields (salesperson: acv/quota; lawyer:
  // billable_hours/case_status; etc.). Populated by role-aware text
  // extraction; absent from image/PDF extractors for now.
  role_context?: Record<string, unknown> | null;
}

// Per-file extraction result — wraps records + status for the UI
export type ExtractionStatus =
  | "pending"
  | "processing"
  | "success"
  | "empty" // AI found no records
  | "unreadable" // Output couldn't be parsed/salvaged — recoverable via manual entry
  | "failed" // Unrecoverable error
  | "queued"; // Anthropic API down — stored for retry

export interface FileExtractionResult {
  fileName: string;
  status: ExtractionStatus;
  records: ExtractedWinRecord[];
  error: string | null;
  // Populated by Option A upload — present when status === 'success'
  source_file: string | null;
  source_hash: string | null;
}

// Batch approval UI state
export type ApprovalState = "pending" | "approved" | "rejected";

export interface BatchRecord {
  key: string; // Unique key within batch (file + index)
  extracted: ExtractedWinRecord; // Original AI output — never mutated
  edited: ExtractedWinRecord; // User's in-progress edits
  approval: ApprovalState;
  sourceFileName: string; // Display name
  source_file: string; // Supabase Storage path
  source_hash: string; // SHA-256 hex of the original file
}

// ------------------------------------------------------------
// Public profile read model — shape returned by get_public_profile().
// Redaction already happened in SQL; these are the post-redaction
// fields the public route renders. Raw company names / exact ARR for
// blurred records never reach this layer.
// ------------------------------------------------------------

export interface PublicProfileRecord {
  id: string;
  category: WinCategory | null;
  visibility: Exclude<RecordVisibility, "private">; // private rows excluded
  title: string;
  impact: string;
  tags: string[];
  arr_amount: number | null; // full_public only; null when blurred
  arr_range: string | null; // blurred only; null when full_public
  happened_at: string | null;
  created_at: string;
  // Provenance signals — real for both tiers, fed to deriveVerificationTier.
  verification_source: string | null;
  has_source_file: boolean;
  has_linked_artifact: boolean;
}

export interface PublicProfilePayload {
  profile: {
    username: string;
    display_name: string | null;
    role: UserRole | null;
  };
  records: PublicProfileRecord[];
}
