import type { FileExtractionResult } from "@/types";
import { extractWinsFromImage } from "@/lib/extractWinsFromImage";
import { extractWinsFromPDF } from "@/lib/extractWinsFromPDF";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

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
  fileName: string
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
      error: "File is too large. Max 10MB. Try compressing or splitting it.",
      source_file: null,
      source_hash: null,
    };
  }

  const records =
    mimeType === "application/pdf"
      ? await extractWinsFromPDF(buffer)
      : await extractWinsFromImage(buffer, mimeType);

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
