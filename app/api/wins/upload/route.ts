import { createClient } from "@/lib/supabase/server";
import { extractWinsFromFile } from "@/lib/extractWinsFromFile";
import { NextResponse } from "next/server";
import { createHash, randomUUID } from "crypto";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
]);

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
      { error: "File is too large. Max 10MB. Try compressing or splitting it." },
      { status: 400 }
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

  // ---- Extract wins ----
  let result;
  try {
    result = await extractWinsFromFile(buffer, fileEntry.type, fileEntry.name);
  } catch (err) {
    // Extraction threw — clean up the uploaded file, don't leave it orphaned
    await supabase.storage.from("win-source-files").remove([storagePath]);
    const isAnthropicDown =
      err instanceof Error && err.message.toLowerCase().includes("connection");
    return NextResponse.json(
      {
        error: isAnthropicDown
          ? "The AI service is temporarily unavailable. Try again in a moment."
          : "We couldn't read this file. Try re-saving or uploading a different version.",
      },
      { status: isAnthropicDown ? 503 : 500 }
    );
  }

  // ---- Populate storage fields on the result ----
  // source_file and source_hash are null inside extractWinsFromFile —
  // they're only known here, after the Storage upload.
  result.source_file = storagePath;
  result.source_hash = sourceHash;

  // If extraction yielded nothing, clean up the file (no point keeping it)
  if (result.status === "empty") {
    await supabase.storage.from("win-source-files").remove([storagePath]);
    result.source_file = null;
    result.source_hash = null;
  }

  return NextResponse.json(result);
}
