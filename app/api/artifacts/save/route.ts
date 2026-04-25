import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { ArtifactVisibility } from "@/types";

export async function POST(request: Request) {
  // ---- Auth ----
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ---- Parse body ----
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body. Expected JSON." },
      { status: 400 }
    );
  }

  // ---- Reject gated visibility — coming soon ----
  if (body.visibility === "gated") {
    return NextResponse.json(
      {
        error:
          "Gated visibility is coming soon. Use private or public for now.",
        code: "gated_coming_soon",
      },
      { status: 400 }
    );
  }

  const visibility = (body.visibility as ArtifactVisibility) ?? "private";
  if (visibility !== "private" && visibility !== "public") {
    return NextResponse.json(
      { error: "visibility must be 'private' or 'public'." },
      { status: 400 }
    );
  }

  // ---- Required curation fields ----
  const title = body.title as string | undefined;
  const summary = body.summary as string | undefined;
  const whyItMatters = body.why_it_matters as string | undefined;

  if (!title?.trim() || !summary?.trim() || !whyItMatters?.trim()) {
    return NextResponse.json(
      {
        error:
          "title, summary, and why_it_matters are required before saving.",
      },
      { status: 400 }
    );
  }

  // ---- Insert artifact ----
  const { data: artifact, error: insertError } = await supabase
    .from("artifacts")
    .insert({
      user_id: user.id,
      type: "slide_deck",
      title: title.trim(),
      description: summary.trim(),
      why_it_matters: whyItMatters.trim(),
      source_file_path: (body.source_file as string) ?? null,
      source_hash: (body.source_hash as string) ?? null,
      file_size: (body.file_size as number) ?? null,
      mime_type: (body.mime_type as string) ?? null,
      extracted_metadata:
        (body.extracted_metadata as Record<string, unknown>) ?? null,
      visibility,
      featured: false,
      archived: false,
      parent_artifact_id: (body.parent_artifact_id as string) ?? null,
      created_at_company: (body.created_at_company as string) ?? null,
      used_at_companies: (body.used_at_companies as string[]) ?? [],
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json(
      { error: `Failed to save artifact: ${insertError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ artifact });
}
