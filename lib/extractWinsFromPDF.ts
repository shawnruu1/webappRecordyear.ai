import Anthropic from "@anthropic-ai/sdk";
import type { ExtractedWinRecord, UserRole } from "@/types";
import { buildWinExtractionPrompt } from "@/lib/ai/buildExtractionPrompt";
import { parseExtractionResponse } from "@/lib/ai/parseExtractionResponse";
import {
  logAICall,
  classifyAIError,
  newExtractionId,
  EXTRACTION_VERSION,
  type AICallContext,
} from "@/lib/ai/logging";

// Uses Anthropic's native PDF support — no parsing library required.
// Claude reads the PDF directly, handling both text-based and scanned PDFs.
// Requires beta header: anthropic-beta: pdfs-2024-09-25

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = "claude-sonnet-4-6";

// See extractWinsFromImage for rationale. Multi-page/table PDFs hit the same
// truncation bug as screenshots, so the same cap and timing guards apply.
const MAX_OUTPUT_TOKENS = 16384;
const AI_REQUEST_TIMEOUT_MS = 55_000;
const AI_MAX_RETRIES = 1;

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

export async function extractWinsFromPDF(
  buffer: Buffer,
  ctx?: AICallContext
): Promise<ExtractedWinRecord[]> {
  const extraction_id = newExtractionId();
  const startedAt = Date.now();
  let usage: Anthropic.Usage | null = null;

  try {
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
        text: buildWinExtractionPrompt({
          sourceType: "pdf",
          userRole: (ctx?.userRole ?? undefined) as UserRole | undefined,
          userName: ctx?.userName ?? undefined,
        }),
      },
    ];

    const message = await anthropic.messages.create(
      {
        model: MODEL,
        max_tokens: MAX_OUTPUT_TOKENS,
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
        timeout: AI_REQUEST_TIMEOUT_MS,
        maxRetries: AI_MAX_RETRIES,
      }
    );

    usage = message.usage;
    const raw =
      message.content[0]?.type === "text" ? message.content[0].text : "";
    // Salvages truncated/partial output; throws ExtractionParseError only when
    // nothing is recoverable (caller degrades to manual entry).
    const result = parseExtractionResponse(raw);

    logAICall({
      extraction_id,
      user_id: ctx?.userId ?? null,
      source_type: "pdf",
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
      source_type: "pdf",
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
