import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

const PPTX_MIME =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation";
const ACCEPTED_TYPES = new Set(["application/pdf", PPTX_MIME]);

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
    fileName?: string;
    mimeType?: string;
  };
  const { fileName, mimeType } = body;

  if (!fileName || !mimeType) {
    return NextResponse.json(
      { error: "fileName and mimeType required" },
      { status: 400 }
    );
  }

  // Resolve MIME for macOS PPTX quirk
  const resolvedMime =
    fileName.toLowerCase().endsWith(".pptx") &&
    (mimeType === "application/zip" ||
      mimeType === "application/octet-stream" ||
      mimeType === "")
      ? PPTX_MIME
      : mimeType;

  if (!ACCEPTED_TYPES.has(resolvedMime)) {
    return NextResponse.json(
      { error: "Unsupported type. Upload a PDF or PPTX." },
      { status: 400 }
    );
  }

  const tempId = randomUUID();
  const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${user.id}/${tempId}/${safeFileName}`;

  const { data, error } = await supabase.storage
    .from("artifacts")
    .createSignedUploadUrl(storagePath);

  if (error || !data) {
    return NextResponse.json(
      { error: `Could not create upload URL: ${error?.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({
    signedUrl: data.signedUrl,
    token: data.token,
    storagePath,
    resolvedMimeType: resolvedMime,
  });
}
