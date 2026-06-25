import type { ExtractedWinRecord, FileExtractionResult } from "@/types";
import { extractWinsFromImage } from "@/lib/extractWinsFromImage";
import { extractWinsFromPDF } from "@/lib/extractWinsFromPDF";
import { ExtractionParseError } from "@/lib/ai/parseExtractionResponse";
import type { AICallContext } from "@/lib/ai/logging";

// Aligned with what works end-to-end: 3.5MB raw ≈ 4.67MB base64, which stays
// under Anthropic's ~5MB per-image vision cap and Vercel's ~4.5MB route body
// limit. (The old 10MB allowed files that failed downstream or 413'd.)
const MAX_FILE_SIZE_BYTES = Math.floor(3.5 * 1024 * 1024); // 3.5MB

const SUPPORTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

type SupportedMimeType =
  | (typeof SUPPORTED_IMAGE_TYPES)[number]
  | "application/pdf";

function isSupportedType(mimeType: string): mimeType is SupportedMimeType {
  return (
    SUPPORTED_IMAGE_TYPES.includes(
      mimeType as (typeof SUPPORTED_IMAGE_TYPES)[number]
    ) || mimeType === "application/pdf"
  );
}

// source_file and source_hash are null here — they get populated by the
// API route after Option A Storage upload, before this result is returned
// to the client.

export async function extractWinsFromFile(
  buffer: Buffer,
  mimeType: string,
  fileName: string,
  ctx?: AICallContext
): Promise<FileExtractionResult> {
  if (!isSupportedType(mimeType)) {
    return {
      fileName,
      status: "failed",
      records: [],
      error: `Unsupported file type: ${mimeType}. Upload a PNG, JPG, WEBP, or PDF.`,
      source_file: null,
      source_hash: null,
    };
  }

  if (buffer.byteLength > MAX_FILE_SIZE_BYTES) {
    return {
      fileName,
      status: "failed",
      records: [],
      error: "File is too large. Max 3.5MB. Upload a smaller or cropped version.",
      source_file: null,
      source_hash: null,
    };
  }

  let records: ExtractedWinRecord[];
  try {
    records =
      mimeType === "application/pdf"
        ? await extractWinsFromPDF(buffer, ctx)
        : await extractWinsFromImage(buffer, mimeType, ctx);
  } catch (err) {
    // The model output couldn't be parsed or salvaged. Degrade gracefully to
    // manual entry (mirrors the "empty" path) instead of a hard error. Other
    // errors (rate limit, timeout, oversized, network) propagate to the route,
    // which differentiates them for the user.
    if (err instanceof ExtractionParseError) {
      return {
        fileName,
        status: "unreadable",
        records: [],
        error:
          "We couldn't read this automatically. Add the details manually using the text box above.",
        source_file: null,
        source_hash: null,
      };
    }
    throw err;
  }

  if (records.length === 0) {
    return {
      fileName,
      status: "empty",
      records: [],
      error: null,
      source_file: null,
      source_hash: null,
    };
  }

  return {
    fileName,
    status: "success",
    records,
    error: null,
    source_file: null,  // populated by API route after Storage upload
    source_hash: null,  // populated by API route after Storage upload
  };
}
