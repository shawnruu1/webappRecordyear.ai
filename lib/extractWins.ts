import Anthropic from "@anthropic-ai/sdk";
import type { ExtractedWinRecord, WinCategory } from "@/types";
import { WIN_CATEGORIES } from "@/types";
import { buildWinExtractionPrompt } from "@/lib/ai/buildExtractionPrompt";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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
  },
];

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
    happened_at: typeof item.happened_at === "string" ? item.happened_at : null,
    raw_excerpt: typeof item.raw_excerpt === "string" ? item.raw_excerpt : "",
    confidence:
      item.confidence === "high" || item.confidence === "low"
        ? item.confidence
        : "medium",
  };
}

export async function extractWins(raw_input: string): Promise<ExtractedWinRecord[]> {
  try {
    const prompt = buildWinExtractionPrompt({ sourceType: "text" });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `${prompt}\n\nRaw input:\n"""\n${raw_input}\n"""`,
        },
      ],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const result = parseResponse(raw);
    return result.length > 0 ? result : FALLBACK(raw_input);
  } catch (err) {
    console.warn(
      "[extractWins] AI enrichment skipped:",
      err instanceof Error ? err.message : err
    );
    return FALLBACK(raw_input);
  }
}
