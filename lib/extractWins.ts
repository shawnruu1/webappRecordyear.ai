import Anthropic from "@anthropic-ai/sdk";
import type { ExtractedWinRecord, WinCategory, UserRole } from "@/types";
import { WIN_CATEGORIES, DEFAULT_USER_ROLE } from "@/types";
import { buildWinExtractionPrompt } from "@/lib/ai/buildExtractionPrompt";
import {
  enforceArrAmbiguity,
  enforceFlaggedConfidence,
} from "@/lib/ai/arrAmbiguity";
import {
  logAICall,
  classifyAIError,
  newExtractionId,
  EXTRACTION_VERSION,
  type AICallContext,
} from "@/lib/ai/logging";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = "claude-sonnet-4-6";

const FALLBACK = (raw_input: string): ExtractedWinRecord[] => [
  {
    title: raw_input.slice(0, 60),
    category: "Milestone",
    tags: [],
    impact: "",
    arr_amount: null,
    happened_at: null,
    raw_excerpt: "",
    confidence: "low",
    role_context: null,
  },
];

// role_context is a free-form bag — accept any plain JSON object, else null.
function normalizeRoleContext(value: unknown): Record<string, unknown> | null {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value as Record<string, unknown>).length > 0
  ) {
    return value as Record<string, unknown>;
  }
  return null;
}

function parseResponse(raw: string): ExtractedWinRecord[] {
  const cleaned = raw.replace(/```(?:json)?\n?/g, "").trim();
  const parsed: unknown = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(isValidRecord).map(normalizeRecord);
}

function isValidRecord(item: unknown): item is Record<string, unknown> {
  if (!item || typeof item !== "object") return false;
  const r = item as Record<string, unknown>;
  return (
    typeof r.title === "string" &&
    typeof r.category === "string" &&
    typeof r.impact === "string"
  );
}

function normalizeRecord(item: Record<string, unknown>): ExtractedWinRecord {
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

  const flag = (v: unknown): string | null =>
    typeof v === "string" && v.trim() ? v : null;

  const withArr = enforceArrAmbiguity({
    title: String(item.title).slice(0, 60),
    category,
    impact: String(item.impact),
    tags: Array.isArray(item.tags)
      ? (item.tags as unknown[])
          .filter((t): t is string => typeof t === "string")
          .slice(0, 5)
      : [],
    arr_amount,
    happened_at: typeof item.happened_at === "string" ? item.happened_at : null,
    raw_excerpt: typeof item.raw_excerpt === "string" ? item.raw_excerpt : "",
    confidence:
      item.confidence === "high" || item.confidence === "low"
        ? item.confidence
        : "medium",
    owner_flag: flag(item.owner_flag),
    status_flag: flag(item.status_flag),
    role_context: normalizeRoleContext(item.role_context),
  });
  return enforceFlaggedConfidence(withArr);
}

export async function extractWins(
  raw_input: string,
  userRole: UserRole = DEFAULT_USER_ROLE,
  ctx?: AICallContext
): Promise<ExtractedWinRecord[]> {
  const extraction_id = newExtractionId();
  const startedAt = Date.now();
  let usage: Anthropic.Usage | null = null;

  try {
    const prompt = buildWinExtractionPrompt({
      sourceType: "text",
      userRole,
      userName: ctx?.userName ?? undefined,
    });

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `${prompt}\n\nRaw input:\n"""\n${raw_input}\n"""`,
        },
      ],
    });

    usage = message.usage;
    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const result = parseResponse(raw); // may throw on malformed JSON

    logAICall({
      extraction_id,
      user_id: ctx?.userId ?? null,
      source_type: "text",
      user_role: ctx?.userRole ?? userRole,
      model: MODEL,
      extraction_version: EXTRACTION_VERSION,
      prompt_token_count: usage?.input_tokens ?? null,
      completion_token_count: usage?.output_tokens ?? null,
      latency_ms: Date.now() - startedAt,
      success: true,
    });

    return result.length > 0 ? result : FALLBACK(raw_input);
  } catch (err) {
    logAICall({
      extraction_id,
      user_id: ctx?.userId ?? null,
      source_type: "text",
      user_role: ctx?.userRole ?? userRole,
      model: MODEL,
      extraction_version: EXTRACTION_VERSION,
      prompt_token_count: usage?.input_tokens ?? null,
      completion_token_count: usage?.output_tokens ?? null,
      latency_ms: Date.now() - startedAt,
      success: false,
      error_class: classifyAIError(err),
    });

    console.warn(
      "[extractWins] AI enrichment skipped:",
      err instanceof Error ? err.message : err
    );
    return FALLBACK(raw_input);
  }
}
