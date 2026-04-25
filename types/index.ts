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

export type VerificationTier =
  | "unverified"
  | "verified"
  | "vouched"           // Phase 2: peer/manager verified
  | "system_verified";  // Phase 2: CRM integration

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

export type VerificationSource = "artifact" | "self_reported";

export interface WinVerification {
  source: VerificationSource;
  ref_id?: string; // Supabase Storage path for artifact-backed wins
}

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

// wins_with_edit_status view
export interface WinWithEditStatus extends Win {
  has_version_history: boolean;
  verification_tier: VerificationTier;
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
}

// Per-file extraction result — wraps records + status for the UI
export type ExtractionStatus =
  | "pending"
  | "processing"
  | "success"
  | "empty" // AI found no records
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
