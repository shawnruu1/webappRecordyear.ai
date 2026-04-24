/**
 * Smoke test for the file extraction pipeline.
 *
 * Usage:
 *   tsx scripts/test-extraction.ts <path-to-file>
 *
 * Examples:
 *   tsx scripts/test-extraction.ts ~/Desktop/q4-results.png
 *   tsx scripts/test-extraction.ts ~/Desktop/offer-letter.pdf
 *
 * Reads ANTHROPIC_API_KEY from .env.local automatically.
 */

import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";

// ---------------------------------------------------------------------------
// Load .env.local manually (no dotenv dependency needed in Node 22)
// ---------------------------------------------------------------------------
function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

// ---------------------------------------------------------------------------
// Types (inline — no @/ aliases in standalone scripts)
// ---------------------------------------------------------------------------
type WinCategory =
  | "Deal Closed"
  | "Recognition"
  | "Skill"
  | "Milestone"
  | "Relationship";

const WIN_CATEGORIES: WinCategory[] = [
  "Deal Closed",
  "Recognition",
  "Skill",
  "Milestone",
  "Relationship",
];

interface ExtractedWinRecord {
  title: string;
  category: WinCategory;
  impact: string;
  tags: string[];
  arr_amount: number | null;
  happened_at: string | null;
  raw_excerpt: string;
  confidence: "high" | "medium" | "low";
}

// ---------------------------------------------------------------------------
// MIME type detection from extension
// ---------------------------------------------------------------------------
type SupportedMimeType =
  | "image/png"
  | "image/jpeg"
  | "image/webp"
  | "application/pdf";

const EXT_TO_MIME: Record<string, SupportedMimeType> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
};

function getMimeType(filePath: string): SupportedMimeType | null {
  const ext = path.extname(filePath).toLowerCase();
  return EXT_TO_MIME[ext] ?? null;
}

// ---------------------------------------------------------------------------
// Extraction prompt (shared between image and PDF)
// ---------------------------------------------------------------------------
function buildPrompt(): string {
  return `You are a career record assistant for sales professionals. Analyze this file and extract every distinct professional win, achievement, or milestone you can find.

A "win" is any evidence of professional success: a closed deal, a quota hit, a recognition, a skill milestone, a relationship built, a promotion, a contract signed, performance review results, etc.

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
- raw_excerpt: a short quote or description of where in the file this win appears, including the original MRR figure
- confidence: "high" if clearly visible, "medium" if inferred, "low" if uncertain

Return a JSON array of win objects. If no wins are found, return an empty array [].
No markdown, no code fences, no explanation — only the JSON array.`;
}

// ---------------------------------------------------------------------------
// Parse and normalize Claude's JSON response
// ---------------------------------------------------------------------------
function parseRecords(raw: string): ExtractedWinRecord[] {
  const cleaned = raw.replace(/```(?:json)?\n?/g, "").trim();
  const parsed: unknown = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) return [];

  return parsed
    .filter((item): item is Record<string, unknown> => {
      if (!item || typeof item !== "object") return false;
      const r = item as Record<string, unknown>;
      return (
        typeof r.title === "string" &&
        typeof r.category === "string" &&
        typeof r.impact === "string"
      );
    })
    .map((item) => ({
      title: String(item.title).slice(0, 60),
      category: WIN_CATEGORIES.includes(item.category as WinCategory)
        ? (item.category as WinCategory)
        : "Milestone",
      impact: String(item.impact),
      tags: Array.isArray(item.tags)
        ? (item.tags as unknown[])
            .filter((t): t is string => typeof t === "string")
            .slice(0, 5)
        : [],
      arr_amount: typeof item.arr_amount === "number"
        ? Math.round(item.arr_amount)
        : typeof item.arr_amount === "string"
        ? Math.round(parseFloat(String(item.arr_amount).replace(/[^0-9.]/g, ""))) || null
        : null,
      happened_at:
        typeof item.happened_at === "string" ? item.happened_at : null,
      raw_excerpt:
        typeof item.raw_excerpt === "string" ? item.raw_excerpt : "",
      confidence:
        item.confidence === "high" || item.confidence === "low"
          ? item.confidence
          : "medium",
    }));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const filePath = process.argv[2];

  if (!filePath) {
    console.error("Usage: tsx scripts/test-extraction.ts <path-to-file>");
    console.error("  Supports: .png .jpg .jpeg .webp .pdf");
    process.exit(1);
  }

  const resolved = path.resolve(filePath.replace(/^~/, process.env.HOME ?? ""));

  if (!fs.existsSync(resolved)) {
    console.error(`File not found: ${resolved}`);
    process.exit(1);
  }

  const mimeType = getMimeType(resolved);
  if (!mimeType) {
    console.error(`Unsupported file type: ${path.extname(resolved)}`);
    console.error("Supported: .png .jpg .jpeg .webp .pdf");
    process.exit(1);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY not found in .env.local");
    process.exit(1);
  }

  const buffer = fs.readFileSync(resolved);
  const sizeKB = (buffer.byteLength / 1024).toFixed(1);

  console.log(`\nFile:     ${path.basename(resolved)}`);
  console.log(`Type:     ${mimeType}`);
  console.log(`Size:     ${sizeKB} KB`);
  console.log(`Model:    claude-sonnet-4-6`);
  console.log(`\nExtracting wins...\n`);

  const anthropic = new Anthropic({ apiKey });
  const base64Data = buffer.toString("base64");

  let rawResponse: string;

  if (mimeType === "application/pdf") {
    // The SDK's TS types don't include the `document` content block yet.
    // We cast the content array at the boundary and pass the beta header.
    const pdfContent = [
      {
        type: "document" as const,
        source: { type: "base64" as const, media_type: "application/pdf" as const, data: base64Data },
      },
      { type: "text" as const, text: buildPrompt() },
    ] as Anthropic.MessageParam["content"];

    const message = await anthropic.messages.create(
      {
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        messages: [{ role: "user", content: pdfContent }],
      },
      { headers: { "anthropic-beta": "pdfs-2024-09-25" } }
    );
    rawResponse = message.content[0].type === "text" ? message.content[0].text : "";
  } else {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mimeType, data: base64Data },
            },
            { type: "text", text: buildPrompt() },
          ],
        },
      ],
    });
    rawResponse = message.content[0].type === "text" ? message.content[0].text : "";
  }

  let records: ExtractedWinRecord[];
  try {
    records = parseRecords(rawResponse);
  } catch {
    console.error("Failed to parse Claude's response as JSON.");
    console.error("Raw response:\n", rawResponse);
    process.exit(1);
  }

  if (records.length === 0) {
    console.log("No wins found in this file.");
    console.log("\nRaw response from Claude:");
    console.log(rawResponse);
    process.exit(0);
  }

  console.log(`Found ${records.length} win${records.length === 1 ? "" : "s"}:\n`);
  console.log("─".repeat(60));

  records.forEach((r, i) => {
    console.log(`\n[${i + 1}] ${r.title}`);
    console.log(`    Category:   ${r.category}`);
    console.log(`    Confidence: ${r.confidence}`);
    console.log(`    Impact:     ${r.impact}`);
    console.log(`    Tags:       ${r.tags.join(", ") || "(none)"}`);
    console.log(`    Date:       ${r.happened_at ?? "(not detected)"}`);
    console.log(`    Excerpt:    "${r.raw_excerpt}"`);
  });

  console.log("\n" + "─".repeat(60));
  console.log("\nExtraction complete.\n");
}

main().catch((err) => {
  console.error("Unexpected error:", err instanceof Error ? err.message : err);
  process.exit(1);
});
