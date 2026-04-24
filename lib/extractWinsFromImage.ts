import Anthropic from "@anthropic-ai/sdk";
import type { ExtractedWinRecord, WinCategory } from "@/types";
import { WIN_CATEGORIES } from "@/types";

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

function buildPrompt(): string {
  return `You are a career record assistant for sales professionals. Analyze this image and extract every distinct professional win, achievement, or milestone you can find.

A "win" is any evidence of professional success: a closed deal, a quota hit, a recognition, a skill milestone, a relationship built, a promotion, a contract signed, etc.

REVENUE FORMATTING RULES — follow exactly:
- If the source shows MRR (monthly recurring revenue), calculate ARR = MRR × 12 and use ARR in the title and impact line. Format as "$X ARR" (e.g. "$21,792 ARR").
- If the source already shows ARR, ACV, or an annual contract value, use that figure directly — do not multiply.
- Always preserve the original MRR figure in raw_excerpt so the source is auditable.
- Never use "MRR" in a title or impact line — always convert to and display ARR.

For each win found, return a JSON object with exactly these fields:
- title: concise title, max 60 characters, using ARR not MRR
- category: one of ${WIN_CATEGORIES.map((c) => `"${c}"`).join(", ")}
- impact: one sentence describing the business or career impact, using ARR not MRR
- tags: array of 2-5 relevant keywords
- arr_amount: the ARR as a plain integer with no symbols or commas (e.g. 21792 for $21,792 ARR). Apply MRR × 12 before setting this value. If there is no revenue figure, use null.
- happened_at: ISO date string if a date is visible, otherwise null
- raw_excerpt: the specific text from the source including the original MRR figure
- confidence: "high" if clearly visible, "medium" if inferred, "low" if uncertain

Return a JSON array of win objects. If no wins are found, return an empty array [].
No markdown, no code fences, no explanation — only the JSON array.`;
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
            text: buildPrompt(),
          },
        ],
      },
    ],
  });

  const raw =
    message.content[0].type === "text" ? message.content[0].text : "";

  return parseResponse(raw);
}
