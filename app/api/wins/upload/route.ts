import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { extractWinsFromFile } from "@/lib/extractWinsFromFile";
import { classifyAIError } from "@/lib/ai/logging";
import { NextResponse } from "next/server";
import { createHash, randomUUID } from "crypto";

// Vision extraction of a dense screenshot can take a while; without this the
// platform default (~10s) can 504. The model call itself is bounded just under
// this so a slow extraction surfaces as a clean, catchable timeout.
export const maxDuration = 60;

// 3.5MB ≈ 4.67MB base64 — under Anthropic's ~5MB per-image cap and Vercel's
// ~4.5MB route body limit. Aligned with extractWinsFromFile + the client.
const MAX_FILE_SIZE_BYTES = Math.floor(3.5 * 1024 * 1024); // 3.5MB
const ACCEPTED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
]);

// An oversized-image / payload-too-large rejection from the Anthropic API.
function isOversizedError(err: unknown): boolean {
  if (err instanceof Anthropic.APIError) {
    if (err.status === 413) return true;
    if (err.status === 400 && /image|size|too large|exceed/i.test(err.message)) {
      return true;
    }
  }
  return false;
}

export async function POST(request: Request) {
  // ---- Auth ----
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ---- Parse multipart form data ----
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Could not parse the upload. Make sure you're sending a multipart form." },
      { status: 400 }
    );
  }

  const fileEntry = formData.get("file");
  if (!(fileEntry instanceof File)) {
    return NextResponse.json(
      { error: "No file received. Send a file field named 'file'." },
      { status: 400 }
    );
  }

  // ---- Validate type ----
  if (!ACCEPTED_TYPES.has(fileEntry.type)) {
    return NextResponse.json(
      { error: `Unsupported file type: ${fileEntry.type}. Upload a PNG, JPG, WEBP, or PDF.` },
      { status: 400 }
    );
  }

  // ---- Validate size ----
  if (fileEntry.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: "File is too large. Max 3.5MB. Upload a smaller or cropped version." },
      { status: 413 }
    );
  }

  // ---- Read buffer ----
  let buffer: Buffer;
  try {
    buffer = Buffer.from(await fileEntry.arrayBuffer());
  } catch {
    return NextResponse.json(
      { error: "We couldn't read this file. Try re-saving or uploading a different version." },
      { status: 400 }
    );
  }

  // ---- Compute SHA-256 before upload ----
  const sourceHash = createHash("sha256").update(buffer).digest("hex");

  // ---- Upload to Supabase Storage ----
  // Path: {user_id}/{temp_id}/{filename}
  // temp_id ensures uniqueness per upload even if same filename is used twice
  const tempId = randomUUID();
  const safeFileName = fileEntry.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${user.id}/${tempId}/${safeFileName}`;

  const { error: uploadError } = await supabase.storage
    .from("win-source-files")
    .upload(storagePath, buffer, {
      contentType: fileEntry.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: `File upload failed: ${uploadError.message}` },
      { status: 500 }
    );
  }

  // ---- Look up role for logging context (best-effort) ----
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  // ---- Extract wins ----
  let result;
  try {
    result = await extractWinsFromFile(buffer, fileEntry.type, fileEntry.name, {
      userId: user.id,
      userRole: profile?.role ?? null,
    });
  } catch (err) {
    // Extraction threw — clean up the uploaded file, don't leave it orphaned.
    await supabase.storage.from("win-source-files").remove([storagePath]);

    // Differentiate the failure so the message is actionable. (A parse failure
    // never reaches here — it's handled as a recoverable "unreadable" result.)
    const klass = classifyAIError(err);
    let status = 500;
    let error =
      "We couldn't read this file. Try re-saving it, or enter the details manually.";

    if (isOversizedError(err)) {
      status = 413;
      error =
        "That image is too large for the AI to process. Upload a smaller or cropped version (under 3.5MB).";
    } else if (klass === "rate_limit") {
      status = 429;
      error = "Our AI is busy right now. Give it a moment and try again.";
    } else if (klass === "timeout") {
      status = 504;
      error =
        "That took too long to process. Try again, or upload a smaller or cropped image.";
    } else if (
      err instanceof Error &&
      err.message.toLowerCase().includes("connection")
    ) {
      status = 503;
      error = "The AI service is temporarily unavailable. Try again in a moment.";
    }

    return NextResponse.json({ error }, { status });
  }

  // ---- Populate storage fields on the result ----
  // source_file and source_hash are null inside extractWinsFromFile —
  // they're only known here, after the Storage upload.
  result.source_file = storagePath;
  result.source_hash = sourceHash;

  // No usable records (none found, or output couldn't be parsed) — clean up the
  // file and return the recoverable result (200). The client routes the user to
  // manual entry rather than showing a hard error.
  if (result.status === "empty" || result.status === "unreadable") {
    await supabase.storage.from("win-source-files").remove([storagePath]);
    result.source_file = null;
    result.source_hash = null;
  }

  return NextResponse.json(result);
}
