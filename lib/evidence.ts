// ============================================================
// Evidence — short-lived signed URL for a record's source file.
//
// Keyed entirely off the live `source_file` path on the wins row and
// the private `win-source-files` bucket. The artifacts/win_artifacts
// path is intentionally NOT used here — it is unwritten.
//
// Security model:
//   * Ownership is verified against the wins row (user_id), on top of
//     the RLS that already scopes both the win and the storage object
//     to the owner. Defense-in-depth.
//   * The returned URL is a SHORT-LIVED SIGNED URL. Never a public URL.
// ============================================================

export type EvidenceKind = "pdf" | "image" | "other";

export interface EvidenceResult {
  url: string;
  filename: string;
  kind: EvidenceKind;
  expiresIn: number;
}

export interface EvidenceError {
  error: string;
  status: number;
}

const BUCKET = "win-source-files";
// Short-lived: the viewer resolves and loads the file immediately on open.
const SIGNED_URL_TTL_SECONDS = 60;
const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp"]);

function kindForFilename(name: string): EvidenceKind {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "pdf";
  if (IMAGE_EXTENSIONS.has(ext)) return "image";
  return "other";
}

export function isEvidenceError(
  r: EvidenceResult | EvidenceError
): r is EvidenceError {
  return "error" in r;
}

/**
 * getSignedEvidenceUrl
 *
 * Verifies the requesting user owns the win, then mints a short-lived
 * signed URL for its `source_file`. Returns a typed error (with HTTP
 * status) for every failure path so the route can stay thin and the
 * UI never crashes.
 */
export async function getSignedEvidenceUrl(
  winId: string,
  userId: string,
  // The server Supabase client (anon key + cookies → RLS-respecting).
  // Typed loosely for the same reason as lib/saveApprovedWins.ts.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
): Promise<EvidenceResult | EvidenceError> {
  // ---- 1. Verify ownership + fetch the file path ----
  const { data: win, error } = await supabase
    .from("wins")
    .select("id, source_file")
    .eq("id", winId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) return { error: "Could not load this record.", status: 500 };
  if (!win) return { error: "Record not found.", status: 404 };
  if (!win.source_file) {
    return { error: "No evidence is attached to this record.", status: 404 };
  }

  const path: string = win.source_file;
  const filename = path.split("/").pop() || "evidence";

  // ---- 2. Mint a short-lived signed URL (never public) ----
  const { data: signed, error: signError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (signError || !signed?.signedUrl) {
    // The row references a file that storage can't serve (missing/moved).
    return {
      error: "The evidence file could not be found in storage.",
      status: 404,
    };
  }

  return {
    url: signed.signedUrl,
    filename,
    kind: kindForFilename(filename),
    expiresIn: SIGNED_URL_TTL_SECONDS,
  };
}
