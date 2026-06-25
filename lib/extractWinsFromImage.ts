import Anthropic from "@anthropic-ai/sdk";
import type { ExtractedWinRecord } from "@/types";
import { buildWinExtractionPrompt } from "@/lib/ai/buildExtractionPrompt";
import { parseExtractionResponse } from "@/lib/ai/parseExtractionResponse";
import {
  logAICall,
  classifyAIError,
  newExtractionId,
  EXTRACTION_VERSION,
  type AICallContext,
} from "@/lib/ai/logging";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = "claude-sonnet-4-6";

// Output cap. Large multi-row screenshots produce long JSON arrays; 4096 was
// truncating them mid-stream and breaking the parse. 16384 comfortably fits a
// far larger table than any single screenshot, well within Sonnet's limit.
const MAX_OUTPUT_TOKENS = 16384;

// Keep the model call inside the route's time budget (maxDuration = 60s) so a
// slow extraction surfaces as a clean, catchable timeout rather than a
// platform 504. One retry max, so retries don't compound past the budget.
const AI_REQUEST_TIMEOUT_MS = 55_000;
const AI_MAX_RETRIES = 1;

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

    const message = await anthropic.messages.create(
      {
        model: MODEL,
        max_tokens: MAX_OUTPUT_TOKENS,
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
      },
      { timeout: AI_REQUEST_TIMEOUT_MS, maxRetries: AI_MAX_RETRIES }
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
