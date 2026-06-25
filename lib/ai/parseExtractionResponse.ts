// ============================================================
// Shared parser for the AI extraction response.
//
// The model is asked to return a JSON array of win records. Two failure
// modes are common with multi-row screenshots/PDFs:
//   1. The output is truncated mid-array (long tables) → invalid JSON.
//   2. The model wraps the array in prose despite instructions.
//
// A bare JSON.parse throws on both, which previously surfaced as a hard
// "could not complete" error. This module instead:
//   - parses strictly when possible,
//   - falls back to a salvage pass that recovers every complete top-level
//     object (dropping a truncated trailing one and any stray prose),
//   - throws a typed ExtractionParseError only when nothing is salvageable,
//     so callers can route the user to manual entry instead of erroring.
//
// A valid empty array ([]) is NOT a parse failure — it returns [] and the
// caller treats it as the graceful "no records found" state.
// ============================================================

import type { ExtractedWinRecord, WinCategory } from "@/types";
import { WIN_CATEGORIES } from "@/types";
import { enforceArrAmbiguity } from "@/lib/ai/arrAmbiguity";

// Thrown only when the model output cannot be parsed AND nothing can be
// salvaged. Recoverable by design — the caller degrades to manual entry.
export class ExtractionParseError extends Error {
  constructor(message = "Model output could not be parsed as JSON") {
    super(message);
    this.name = "ExtractionParseError";
  }
}

export function isValidRecord(item: unknown): item is Record<string, unknown> {
  if (!item || typeof item !== "object") return false;
  const r = item as Record<string, unknown>;
  return (
    typeof r.title === "string" &&
    typeof r.category === "string" &&
    typeof r.impact === "string"
  );
}

export function normalizeRecord(item: Record<string, unknown>): ExtractedWinRecord {
  const category = WIN_CATEGORIES.includes(item.category as WinCategory)
    ? (item.category as WinCategory)
    : "Milestone";

  const rawArr = item.arr_amount;
  const arr_amount =
    typeof rawArr === "number"
      ? Math.round(rawArr)
      : typeof rawArr === "string"
      ? Math.round(parseFloat(String(rawArr).replace(/[^0-9.]/g, ""))) || null
      : null;

  return enforceArrAmbiguity({
    title: String(item.title).slice(0, 60),
    category,
    impact: String(item.impact),
    tags: Array.isArray(item.tags)
      ? (item.tags as unknown[])
          .filter((t): t is string => typeof t === "string")
          .slice(0, 5)
      : [],
    arr_amount,
    happened_at:
      typeof item.happened_at === "string" ? item.happened_at : null,
    raw_excerpt:
      typeof item.raw_excerpt === "string" ? item.raw_excerpt : "",
    confidence:
      item.confidence === "high" || item.confidence === "low"
        ? item.confidence
        : "medium",
  });
}

function toRecords(parsed: unknown): ExtractedWinRecord[] {
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(isValidRecord).map(normalizeRecord);
}

// Salvage pass: scan for every complete, balanced top-level JSON object and
// parse each independently. A truncated trailing object never closes its
// braces, so it's simply skipped — we keep all the rows that did complete.
function salvageRecords(text: string): ExtractedWinRecord[] {
  const start = text.indexOf("[");
  const scan = start === -1 ? text : text.slice(start);

  const out: ExtractedWinRecord[] = [];
  let depth = 0;
  let inString = false;
  let escaped = false;
  let objStart = -1;

  for (let i = 0; i < scan.length; i++) {
    const c = scan[i];

    if (inString) {
      if (escaped) escaped = false;
      else if (c === "\\") escaped = true;
      else if (c === '"') inString = false;
      continue;
    }

    if (c === '"') {
      inString = true;
    } else if (c === "{") {
      if (depth === 0) objStart = i;
      depth++;
    } else if (c === "}") {
      if (depth > 0) depth--;
      if (depth === 0 && objStart !== -1) {
        const chunk = scan.slice(objStart, i + 1);
        try {
          const obj: unknown = JSON.parse(chunk);
          if (isValidRecord(obj)) out.push(normalizeRecord(obj));
        } catch {
          // Skip an object that won't parse on its own.
        }
        objStart = -1;
      }
    }
  }

  return out;
}

/**
 * parseExtractionResponse
 *
 * Returns the extracted records. Strict parse first; on failure, one salvage
 * pass. Throws ExtractionParseError only when nothing is salvageable.
 */
export function parseExtractionResponse(raw: string): ExtractedWinRecord[] {
  const cleaned = raw.replace(/```(?:json)?\n?/g, "").trim();

  // 1. Strict parse — covers the happy path and a valid empty array.
  try {
    return toRecords(JSON.parse(cleaned));
  } catch {
    // fall through to salvage
  }

  // 2. Salvage pass — recover whatever complete rows we can.
  const salvaged = salvageRecords(cleaned);
  if (salvaged.length > 0) return salvaged;

  // 3. Nothing usable — let the caller degrade gracefully to manual entry.
  throw new ExtractionParseError();
}
