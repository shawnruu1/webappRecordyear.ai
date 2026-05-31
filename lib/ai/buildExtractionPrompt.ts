/**
 * buildExtractionPrompt
 *
 * Separation principle:
 *   - Domain knowledge (how to interpret the world) lives in extraction-knowledge.md.
 *     Edit that file to update revenue rules, CRM heuristics, deal patterns, etc.
 *     No code change required.
 *   - Output schema (how to format the response) lives here, in code.
 *     Edit this file when the shape of ExtractedWinRecord changes.
 *
 * The two concerns are deliberately split so a non-engineer can tune extraction
 * quality by editing markdown, and a type change doesn't scatter through .md files.
 */

import fs from "fs";
import path from "path";
import { WIN_CATEGORIES } from "@/types";

export type ExtractionSourceType = "text" | "image" | "pdf";

// Read once at module load (cold start), not on every extraction call.
const KNOWLEDGE = fs.readFileSync(
  path.join(process.cwd(), "lib/ai/extraction-knowledge.md"),
  "utf-8"
);

const SOURCE_INTRO: Record<ExtractionSourceType, string> = {
  text: "Analyze the following text and extract every distinct professional win, achievement, or milestone present.",
  image:
    "Analyze this image and extract every distinct professional win, achievement, or milestone you can find.",
  pdf: "Analyze this document and extract every distinct professional win, achievement, or milestone you can find.",
};

export function buildWinExtractionPrompt(opts: {
  sourceType: ExtractionSourceType;
}): string {
  const categoryList = WIN_CATEGORIES.map((c) => `"${c}"`).join(", ");

  return `You are a career record assistant for sales professionals. ${SOURCE_INTRO[opts.sourceType]}

A "win" is any evidence of professional success: a closed deal, a quota hit, a recognition, a skill milestone, a relationship built, a promotion, a contract signed, performance review results, etc.

## Domain knowledge

${KNOWLEDGE}

## Output format

Return a JSON array — one object per win. If no wins are found, return an empty array [].
No markdown, no code fences, no explanation — only the JSON array.

Each object must have exactly these fields:

- title: concise title, max 60 characters. Use ARR not MRR. Never include "MRR" in the title.
- category: one of ${categoryList}
- impact: one sentence describing the business or career impact. Use ARR not MRR.
- tags: array of 2–5 relevant keywords (deal type, industry, partner name, etc.)
- arr_amount: the ARR value as a plain integer with no symbols or commas (e.g. 21792 for $21,792 ARR). Apply MRR × 12 before setting this value. If there is no revenue figure, use null.
- happened_at: ISO date string (YYYY-MM-DD) if a date is visible, otherwise null.
- raw_excerpt: the specific text or region from the source that this win was extracted from. Always include the original MRR or TCV figure here if one was present, so the conversion is auditable.
- confidence: "high" if clearly stated, "medium" if inferred or converted, "low" if uncertain or ambiguous.`;
}
