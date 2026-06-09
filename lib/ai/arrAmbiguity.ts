import type { ExtractedWinRecord } from "@/types";

// Enforced ARR ambiguity guard.
//
// The extraction prompt asks the model to disambiguate monetary columns and
// convert MRR→ARR, but a prompt is a suggestion — the model can (and did)
// confidently pick the wrong column from an unlabeled CRM screenshot. This
// guard makes the rule HARD, in code, applied by every extractor path:
//
//   When a record's source excerpt holds 2+ distinct monetary values AND no
//   explicit annual label (ARR / ACV / annual), the ARR is ambiguous —
//   force confidence to "low" and attach a visible flag so it always lands
//   in review. A flagged guess beats a confidently-wrong one.

export const ARR_AMBIGUITY_FLAG = "verify ARR — source columns ambiguous";

// An explicit annual label means the source disambiguated the figure, so
// multiple money values are NOT treated as ambiguous.
const ANNUAL_LABEL = /\b(arr|acv|annual)\b/i;

// Currency-like tokens: $-prefixed, or a number followed by a currency code.
const MONEY_DOLLAR = /\$\s?([\d,]+(?:\.\d+)?)\s?([kmb])?/gi;
const MONEY_CODE =
  /\b([\d,]+(?:\.\d+)?)\s?([kmb])?\s?(?:usd|eur|gbp|cad|aud)\b/gi;

function toNumber(num: string, suffix?: string): number {
  const base = parseFloat(num.replace(/,/g, ""));
  if (!Number.isFinite(base)) return NaN;
  const mult =
    (suffix ?? "").toLowerCase() === "k"
      ? 1_000
      : (suffix ?? "").toLowerCase() === "m"
      ? 1_000_000
      : (suffix ?? "").toLowerCase() === "b"
      ? 1_000_000_000
      : 1;
  return Math.round(base * mult);
}

// Distinct monetary values found in a piece of source text. The same value
// formatted twice (e.g. "420.00 USD" and "420 USD") counts once — so a single
// value shown in multiple columns is not, on its own, ambiguous.
export function distinctMonetaryValues(text: string): number[] {
  if (!text) return [];
  const values = new Set<number>();
  for (const re of [MONEY_DOLLAR, MONEY_CODE]) {
    for (const m of text.matchAll(re)) {
      const v = toNumber(m[1], m[2]);
      if (Number.isFinite(v) && v > 0) values.add(v);
    }
  }
  return [...values];
}

// Targeted: 2+ distinct money values AND no annual label → ambiguous.
export function isArrAmbiguous(rawExcerpt: string): boolean {
  return (
    distinctMonetaryValues(rawExcerpt).length >= 2 &&
    !ANNUAL_LABEL.test(rawExcerpt)
  );
}

// Apply the guard to a normalized record. Called by every extractor's
// normalizeRecord so the rule cannot be bypassed by source type.
export function enforceArrAmbiguity(
  record: ExtractedWinRecord
): ExtractedWinRecord {
  if (!isArrAmbiguous(record.raw_excerpt)) return record;
  return { ...record, confidence: "low", arr_flag: ARR_AMBIGUITY_FLAG };
}
