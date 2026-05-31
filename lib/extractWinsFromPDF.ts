import Anthropic from "@anthropic-ai/sdk";
import type { ExtractedWinRecord, WinCategory } from "@/types";
import { WIN_CATEGORIES } from "@/types";
import { buildWinExtractionPrompt } from "@/lib/ai/buildExtractionPrompt";

// Uses Anthropic's native PDF support — no parsing library required.
// Claude reads the PDF directly, handling both text-based and scanned PDFs.
// Requires beta header: anthropic-beta: pdfs-2024-09-25

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// The document content block type isn't in the SDK's default union yet.
// We send it via the raw request body and cast only at the boundary.
interface DocumentContentBlock {
  type: "document";
  source: {
    type: "base64";
    media_type: "application/pdf";
    data: string;
  };
}

interface TextContentBlock {
  type: "text";
  text: string;
}

type ContentBlock = DocumentContentBlock | TextContentBlock;

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

export async function extractWinsFromPDF(
  buffer: Buffer
): Promise<ExtractedWinRecord[]> {
  const base64Data = buffer.toString("base64");

  // SDK TS types don't include the `document` content block yet.
  // Cast at the boundary — the API accepts it with the beta header below.
  const content: ContentBlock[] = [
    {
      type: "document",
      source: {
        type: "base64",
        media_type: "application/pdf",
        data: base64Data,
      },
    },
    {
      type: "text",
      text: buildWinExtractionPrompt({ sourceType: "pdf" }),
    },
  ];

  const message = await anthropic.messages.create(
    {
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: content as Anthropic.MessageParam["content"],
        },
      ],
    },
    {
      headers: {
        "anthropic-beta": "pdfs-2024-09-25",
      },
    }
  );

  const raw =
    message.content[0].type === "text" ? message.content[0].text : "";

  return parseResponse(raw);
}
