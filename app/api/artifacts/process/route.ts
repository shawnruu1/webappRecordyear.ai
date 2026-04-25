import { createClient } from "@/lib/supabase/server";
import { extractArtifactMetadata } from "@/lib/extractArtifactMetadata";
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import type { Artifact } from "@/types";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

function titlesSimilar(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  const words = (s: string) =>
    new Set(s.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
  const wa = words(a);
  const wb = words(b);
  return [...wa].filter((w) => wb.has(w)).length >= 2;
}

function companiesMatch(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  return a.toLowerCase().trim() === b.toLowerCase().trim();
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    storagePath?: string;
    mimeType?: string;
    fileName?: string;
  };
  const { storagePath, mimeType, fileName } = body;

  if (!storagePath || !mimeType || !fileName) {
    return NextResponse.json(
      { error: "storagePath, mimeType, and fileName required" },
      { status: 400 }
    );
  }

  // Verify the path belongs to this user
  if (!storagePath.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Download file from Storage for processing
  const { data: fileData, error: downloadError } = await supabase.storage
    .from("artifacts")
    .download(storagePath);

  if (downloadError || !fileData) {
    return NextResponse.json(
      { error: `Could not read uploaded file: ${downloadError?.message}` },
      { status: 500 }
    );
  }

  const buffer = Buffer.from(await fileData.arrayBuffer());
  const sourceHash = createHash("sha256").update(buffer).digest("hex");
  const fileSize = buffer.byteLength;

  // AI extraction
  let extracted;
  try {
    extracted = await extractArtifactMetadata(buffer, mimeType);
  } catch (err) {
    // Clean up orphaned file
    await supabase.storage.from("artifacts").remove([storagePath]);
    const msg = err instanceof Error ? err.message : "Unknown extraction error";
    return NextResponse.json(
      { error: `AI extraction failed: ${msg}. Try again.` },
      { status: 500 }
    );
  }

  // Similarity check for versioning prompt
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
    file_size: fileSize,
    mime_type: mimeType,
    similar_artifacts: similarArtifacts,
  });
}
