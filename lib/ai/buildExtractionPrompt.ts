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
import { WIN_CATEGORIES, DEFAULT_USER_ROLE } from "@/types";
import type { UserRole } from "@/types";

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

// Role-aware extraction guidance. Each entry names the profession and the
// role-specific fields the model should try to populate inside role_context.
// These fields are surfaced into the background metadata bag — they do NOT
// change the visible category of the record.
const ROLE_GUIDANCE: Record<UserRole, { noun: string; fields: string }> = {
  salesperson: {
    noun: "sales professional",
    fields:
      "acv (annual contract value, integer), arr (integer), deal_stage, quota_attainment, account_name, product, sales_cycle_days",
  },
  lawyer: {
    noun: "legal professional",
    fields:
      "billable_hours (number), case_status, matter_type, client_name, practice_area, settlement_value (integer)",
  },
  project_manager: {
    noun: "project manager",
    fields:
      "project_name, budget (integer), timeline_status (on_time | early | late), team_size (integer), milestone, methodology",
  },
  engineer: {
    noun: "engineer",
    fields:
      "system_or_feature, perf_impact, scale_metric, tech_stack (array), incident_resolved (boolean), release_version",
  },
  consultant: {
    noun: "consultant",
    fields:
      "engagement_name, client_name, contract_value (integer), deliverable, outcome_metric, practice_area",
  },
  other: {
    noun: "professional",
    fields:
      "any clearly quantifiable, domain-specific metrics present (e.g. amounts, counts, percentages, named entities)",
  },
};

export function buildWinExtractionPrompt(opts: {
  sourceType: ExtractionSourceType;
  userRole?: UserRole;
}): string {
  const categoryList = WIN_CATEGORIES.map((c) => `"${c}"`).join(", ");
  const role = ROLE_GUIDANCE[opts.userRole ?? DEFAULT_USER_ROLE]
    ? (opts.userRole ?? DEFAULT_USER_ROLE)
    : DEFAULT_USER_ROLE;
  const guidance = ROLE_GUIDANCE[role];

  return `You are a career record assistant for a ${guidance.noun}. ${SOURCE_INTRO[opts.sourceType]}

A "win" is any evidence of professional success: a closed deal, a quota hit, a recognition, a skill milestone, a relationship built, a promotion, a contract signed, performance review results, etc.

## Domain knowledge

${KNOWLEDGE}

## Role-specific extraction (${guidance.noun})

This user is a ${guidance.noun}. In addition to the standard fields, capture any of the following role-specific details that appear in the source and place them inside the "role_context" object: ${guidance.fields}.

Only include keys you actually find evidence for — omit anything not present rather than guessing. Do NOT let role_context change the "category" field: the visible category must still be one of the standard categories below. role_context is background metadata only.

## Output format

Return a JSON array — one object per win. If no wins are found, return an empty array [].
No markdown, no code fences, no explanation — only the JSON array.

Each object must have exactly these fields:

- title: concise title, max 60 characters. Use ARR not MRR. Never include "MRR" in the title.
- category: one of ${categoryList}
- impact: one sentence describing the business or career impact. Use ARR not MRR.
- tags: array of 2–5 relevant keywords (deal type, industry, partner name, etc.)
- arr_amount: the ARR value as a plain integer with no symbols or commas (e.g. 21792 for $21,792 ARR). If there is no revenue figure, use null. Disambiguate monetary values with these rules:
    * If one value is approximately 12× another, the larger is annual (ARR) and the smaller is monthly (MRR) — use the annual figure.
    * If only a monthly figure is present, multiply by 12 and record the original monthly figure in raw_excerpt so the conversion is auditable.
    * A much-larger value paired with a multi-year contract term is likely TCV, not ARR — do not use it as ARR; derive ARR from the term if possible, otherwise prefer a clearly-annual value.
    * Never default to the smallest monetary value.
    * If a record has multiple unlabeled monetary values and you cannot confidently identify which is ARR, set confidence to "low" rather than guessing (the system also enforces this).
- happened_at: ISO date string (YYYY-MM-DD) if a date is visible, otherwise null.
- raw_excerpt: the specific text or region from the source that this win was extracted from. Always include the original MRR or TCV figure here if one was present, so the conversion is auditable.
- confidence: "high" if clearly stated, "medium" if inferred or converted, "low" if uncertain or ambiguous.
- role_context: an object holding the role-specific fields described above (${guidance.fields}). Include only keys you found evidence for. If none apply, use null.`;
}
