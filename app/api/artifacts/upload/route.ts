import { createClient } from "@/lib/supabase/server";
import { extractArtifactMetadata } from "@/lib/extractArtifactMetadata";
import { NextRequest, NextResponse } from "next/server";
import { createHash, randomUUID } from "crypto";
import type { Artifact } from "@/types";

export const dynamic = "force-dynamic";
export const maxDuration = 120; // AI extraction can take a while

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB — decks can be large

const ACCEPTED_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

// Simple word-overlap similarity for versioning detection.
// Returns true if two titles share 2+ meaningful words (length > 3).
function titlesSimilar(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  const words = (s: string) =>
    new Set(s.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
  const wa = words(a);
  const wb = words(b);
  return [...wa].filter((w) => wb.has(w)).length >= 2;
}

function companiesMatch(
  a: string | null,
  b: string | null
): boolean {
  if (!a || !b) return false;
  return a.toLowerCase().trim() === b.toLowerCase().trim();
}

export async function POST(request: NextRequest) {
  // ---- Auth ----
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ---- Read raw binary body ----
  // Client sends file as raw body with Content-Type and X-File-Name headers
  const rawFileName = request.headers.get("x-file-name");
  const fileName = rawFileName ? decodeURIComponent(rawFileName) : "upload";
  const contentType = request.headers.get("content-type") ?? "";

  // ---- Validate MIME ----
  // Resolve MIME type — macOS can report PPTX as application/zip or octet-stream
  const PPTX_MIME = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  const resolvedMime =
    fileName.toLowerCase().endsWith(".pptx") &&
    (contentType === "application/zip" ||
      contentType === "application/octet-stream" ||
      contentType === "")
      ? PPTX_MIME
      : contentType;

  if (!ACCEPTED_TYPES.has(resolvedMime)) {
    return NextResponse.json(
      { error: `Unsupported type. Upload a PDF or PPTX.` },
      { status: 400 }
    );
  }

  // ---- Read buffer ----
  let buffer: Buffer;
  try {
    buffer = Buffer.from(await request.arrayBuffer());
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[artifacts/upload] arrayBuffer() failed:", msg);
    return NextResponse.json(
      { error: "Could not read the file. Try re-saving it." },
      { status: 400 }
    );
  }

  if (buffer.byteLength > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: "File too large. Max 50MB." },
      { status: 400 }
    );
  }

  // ---- Hash + upload to Storage ----
  const sourceHash = createHash("sha256").update(buffer).digest("hex");
  const tempId = randomUUID();
  const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${user.id}/${tempId}/${safeFileName}`;

  const { error: uploadError } = await supabase.storage
    .from("artifacts")
    .upload(storagePath, buffer, {
      contentType: resolvedMime,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: `Storage upload failed: ${uploadError.message}` },
      { status: 500 }
    );
  }

  // ---- AI extraction ----
  let extracted;
  try {
    extracted = await extractArtifactMetadata(buffer, resolvedMime);
  } catch (err) {
    // Clean up orphaned file before returning error
    await supabase.storage.from("artifacts").remove([storagePath]);
    const msg =
      err instanceof Error ? err.message : "Unknown extraction error";
    return NextResponse.json(
      { error: `AI extraction failed: ${msg}. Try again.` },
      { status: 500 }
    );
  }

  // ---- Similarity check for versioning prompt ----
  const { data: existing } = await supabase
    .from("artifacts")
    .select("id, title, type, created_at_company, uploaded_at")
    .eq("user_id", user.id)
    .eq("type", "slide_deck")
    .eq("archived", false);

  type ArtifactStub = Pick<
    Artifact,
    "id" | "title" | "type" | "created_at_company" | "uploaded_at"
  >;

  const similarArtifacts = ((existing ?? []) as ArtifactStub[]).filter(
    (a) =>
      titlesSimilar(a.title, extracted.title) ||
      companiesMatch(a.created_at_company, extracted.created_at_company)
  );

  return NextResponse.json({
    extracted,
    source_file: storagePath,
    source_hash: sourceHash,
    file_size: buffer.byteLength,
    mime_type: resolvedMime,
    similar_artifacts: similarArtifacts,
  });
}
