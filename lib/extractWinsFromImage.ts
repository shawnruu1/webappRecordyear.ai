import Anthropic from "@anthropic-ai/sdk";
import type { ExtractedWinRecord, WinCategory } from "@/types";
import { WIN_CATEGORIES } from "@/types";
import { buildWinExtractionPrompt } from "@/lib/ai/buildExtractionPrompt";
import { enforceArrAmbiguity } from "@/lib/ai/arrAmbiguity";
import {
  logAICall,
  classifyAIError,
  newExtractionId,
  EXTRACTION_VERSION,
  type AICallContext,
} from "@/lib/ai/logging";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = "claude-sonnet-4-6";

type SupportedImageMediaType = "image/png" | "image/jpeg" | "image/webp";

const SUPPORTED_TYPES: SupportedImageMediaType[] = [
  "image/png",
  "image/jpeg",
  "image/webp",
];

function isSupportedImageType(
  mimeType: string
): mimeType is SupportedImageMediaType {
  return SUPPORTED_TYPES.includes(mimeType as SupportedImageMediaType);
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

export async function extractWinsFromImage(
  buffer: Buffer,
  mimeType: string,
  ctx?: AICallContext
): Promise<ExtractedWinRecord[]> {
  // Validation guard — runs before any AI call, so it isn't logged as one.
  if (!isSupportedImageType(mimeType)) {
    throw new Error(`Unsupported image type: ${mimeType}`);
  }

  const extraction_id = newExtractionId();
  const startedAt = Date.now();
  let usage: Anthropic.Usage | null = null;

  try {
    const base64Data = buffer.toString("base64");

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType,
                data: base64Data,
              },
            },
            {
              type: "text",
              text: buildWinExtractionPrompt({ sourceType: "image" }),
            },
          ],
        },
      ],
    });

    usage = message.usage;
    const raw =
      message.content[0].type === "text" ? message.content[0].text : "";
    const result = parseResponse(raw); // may throw on malformed JSON

    logAICall({
      extraction_id,
      user_id: ctx?.userId ?? null,
      source_type: "image",
      user_role: ctx?.userRole ?? null,
      model: MODEL,
      extraction_version: EXTRACTION_VERSION,
      prompt_token_count: usage?.input_tokens ?? null,
      completion_token_count: usage?.output_tokens ?? null,
      latency_ms: Date.now() - startedAt,
      success: true,
    });

    return result;
  } catch (err) {
    logAICall({
      extraction_id,
      user_id: ctx?.userId ?? null,
      source_type: "image",
      user_role: ctx?.userRole ?? null,
      model: MODEL,
      extraction_version: EXTRACTION_VERSION,
      prompt_token_count: usage?.input_tokens ?? null,
      completion_token_count: usage?.output_tokens ?? null,
      latency_ms: Date.now() - startedAt,
      success: false,
      error_class: classifyAIError(err),
    });
    // Preserve existing behavior — caller (upload route) handles the throw.
    throw err;
  }
}
