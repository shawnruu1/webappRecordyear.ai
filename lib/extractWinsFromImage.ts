import Anthropic from "@anthropic-ai/sdk";
import type { ExtractedWinRecord, WinCategory } from "@/types";
import { WIN_CATEGORIES } from "@/types";
import { buildWinExtractionPrompt } from "@/lib/ai/buildExtractionPrompt";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

  return {
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
  };
}

export async function extractWinsFromImage(
  buffer: Buffer,
  mimeType: string
): Promise<ExtractedWinRecord[]> {
  if (!isSupportedImageType(mimeType)) {
    throw new Error(`Unsupported image type: ${mimeType}`);
  }

  const base64Data = buffer.toString("base64");

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
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

  const raw =
    message.content[0].type === "text" ? message.content[0].text : "";

  return parseResponse(raw);
}
