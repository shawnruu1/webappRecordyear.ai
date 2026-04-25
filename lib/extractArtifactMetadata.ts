import Anthropic from "@anthropic-ai/sdk";
import { extractPptxText } from "@/lib/extractPptxText";
import type { ExtractedArtifactData, FieldConfidence } from "@/types";

// Extracts structured vault metadata from a slide deck (PDF or PPTX).
// Produces: title, summary, why_it_matters, company tags, per-field confidence.
// Uses native PDF document blocks for PDFs; text extraction for PPTX.

const PPTX_MIME =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// The Anthropic SDK's TS types don't include the `document` content block yet.
interface DocumentContentBlock {
  type: "document";
  source: { type: "base64"; media_type: "application/pdf"; data: string };
}
interface TextContentBlock {
  type: "text";
  text: string;
}
type ContentBlock = DocumentContentBlock | TextContentBlock;

// ----------------------------------------------------------------
// Prompt
// ----------------------------------------------------------------

function buildPrompt(slideCount?: number): string {
  return `You are analyzing a professional presentation or slide deck for a career portfolio vault.
${slideCount != null ? `\nThe deck has ${slideCount} slides.\n` : ""}
Extract the following metadata and return it as a single JSON object with exactly these fields:

title
  The deck's actual title. If not explicitly stated on a title slide, infer the most accurate concise title you can (max 60 characters). Do not use generic titles like "Presentation" or "Slides".

summary
  2–3 sentences. What does this deck cover, who is the audience, and what is its purpose? Be specific.

why_it_matters
  1–2 sentences explaining the professional significance of this artifact — what it demonstrates about the creator's skills, judgment, or impact. Write in third person. Example: "This deck demonstrates the creator's ability to build persuasive enterprise sales narratives at the executive level."

created_at_company
  The company or organization where this deck was created. Look for: logo in header/footer, copyright notice, "prepared by", company branding, email domains. Return null if not detectable.

used_at_companies
  Array of company/organization names this deck was used with, presented to, or created for. Look for: client names, prospect logos, "presented to", "prepared for", named stakeholders with company context. Return empty array if none detectable.

confidence
  Object with keys: title, summary, why_it_matters, created_at_company, used_at_companies.
  Each value must be exactly "high", "medium", or "low".
  - "high": clearly and explicitly stated in the document
  - "medium": reasonably inferred from available context
  - "low": guessed or insufficient information

Return only valid JSON — no markdown, no code fences, no preamble.

Example output shape:
{
  "title": "Q1 2026 Enterprise Sales Deck",
  "summary": "A sales presentation targeting enterprise law firms and healthcare organizations. Covers product positioning, ROI modeling, and competitive differentiation for Powell Intranet.",
  "why_it_matters": "This deck demonstrates the creator's ability to translate technical product capabilities into executive-level business value narratives across regulated industries.",
  "created_at_company": "Powell Software",
  "used_at_companies": ["Duane Morris LLP", "Eversheds Sutherland"],
  "confidence": {
    "title": "high",
    "summary": "high",
    "why_it_matters": "medium",
    "created_at_company": "high",
    "used_at_companies": "medium"
  }
}`;
}

// ----------------------------------------------------------------
// Response parsing
// ----------------------------------------------------------------

function validConf(v: unknown): FieldConfidence {
  if (v === "high" || v === "low") return v;
  return "medium";
}

function parseResponse(raw: string): ExtractedArtifactData {
  const cleaned = raw.replace(/```(?:json)?\n?/g, "").trim();
  const parsed = JSON.parse(cleaned) as Record<string, unknown>;
  const conf = (parsed.confidence ?? {}) as Record<string, unknown>;

  return {
    title:
      typeof parsed.title === "string" ? parsed.title.slice(0, 60) : "",
    summary:
      typeof parsed.summary === "string" ? parsed.summary : "",
    why_it_matters:
      typeof parsed.why_it_matters === "string" ? parsed.why_it_matters : "",
    created_at_company:
      typeof parsed.created_at_company === "string"
        ? parsed.created_at_company
        : null,
    used_at_companies: Array.isArray(parsed.used_at_companies)
      ? (parsed.used_at_companies as unknown[]).filter(
          (c): c is string => typeof c === "string"
        )
      : [],
    confidence: {
      title: validConf(conf.title),
      summary: validConf(conf.summary),
      why_it_matters: validConf(conf.why_it_matters),
      created_at_company: validConf(conf.created_at_company),
      used_at_companies: validConf(conf.used_at_companies),
    },
  };
}

// ----------------------------------------------------------------
// Entry point
// ----------------------------------------------------------------

export async function extractArtifactMetadata(
  buffer: Buffer,
  mimeType: string
): Promise<ExtractedArtifactData> {
  if (mimeType === "application/pdf") {
    // Native PDF document blocks — handles text-based and scanned PDFs
    const content: ContentBlock[] = [
      {
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: buffer.toString("base64"),
        },
      },
      { type: "text", text: buildPrompt() },
    ];

    const message = await anthropic.messages.create(
      {
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        messages: [
          {
            role: "user",
            content: content as Anthropic.MessageParam["content"],
          },
        ],
      },
      { headers: { "anthropic-beta": "pdfs-2024-09-25" } }
    );

    const raw =
      message.content[0].type === "text" ? message.content[0].text : "";
    return parseResponse(raw);
  }

  if (mimeType === PPTX_MIME) {
    // PPTX: unzip → extract slide text → send to Claude as plain text
    const { text, slideCount } = await extractPptxText(buffer);

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `${buildPrompt(slideCount)}\n\n---\nDECK CONTENT:\n\n${text}`,
        },
      ],
    });

    const raw =
      message.content[0].type === "text" ? message.content[0].text : "";
    return parseResponse(raw);
  }

  throw new Error(`Unsupported MIME type for artifact extraction: ${mimeType}`);
}
