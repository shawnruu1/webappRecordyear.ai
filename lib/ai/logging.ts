// ============================================================
// AI call logging — structured, side-effect-only observability.
//
// Every Anthropic extraction call emits one line to stdout:
//   [ai_call] {"extraction_id":"…","success":true,…}
// The [ai_call] prefix makes it filterable in Vercel log search.
// This module never throws and never alters extraction behavior.
// ============================================================

import { randomUUID } from "crypto";
import Anthropic from "@anthropic-ai/sdk";

// Bump when a prompt change is meaningful enough that we'd want to
// compare extraction behavior before/after in the logs.
export const EXTRACTION_VERSION = "2026-06-03.1";

export type AISourceType = "text" | "image" | "pdf";

export type AIErrorClass =
  | "rate_limit"
  | "parse_failure"
  | "timeout"
  | "unknown";

// Per-call context threaded from the route (where auth/profile live).
// Optional everywhere so extractor signatures stay backward-compatible.
export interface AICallContext {
  userId?: string | null;
  userRole?: string | null;
  userName?: string | null;
}

export interface AICallLog {
  extraction_id: string;
  user_id: string | null;
  source_type: AISourceType;
  user_role: string | null;
  model: string;
  extraction_version: string;
  prompt_token_count: number | null;
  completion_token_count: number | null;
  latency_ms: number;
  success: boolean;
  error_class?: AIErrorClass;
}

export function newExtractionId(): string {
  return randomUUID();
}

// Map a thrown error to a coarse, queryable class. Order matters:
// check the specific SDK error types before falling back to status/name.
export function classifyAIError(err: unknown): AIErrorClass {
  if (err instanceof Anthropic.RateLimitError) return "rate_limit";
  if (err instanceof Anthropic.APIConnectionTimeoutError) return "timeout";
  // JSON.parse on a malformed model response throws SyntaxError; the shared
  // parser throws ExtractionParseError (by name) when salvage also fails.
  if (err instanceof SyntaxError) return "parse_failure";
  if ((err as { name?: string })?.name === "ExtractionParseError") {
    return "parse_failure";
  }

  if (err instanceof Anthropic.APIError && err.status === 429) {
    return "rate_limit";
  }

  const name = (err as { name?: string })?.name ?? "";
  if (/timeout/i.test(name)) return "timeout";
  if (/rate.?limit/i.test(name)) return "rate_limit";

  return "unknown";
}

export function logAICall(meta: AICallLog): void {
  // Single structured line. JSON.stringify of a flat object won't throw.
  console.log(`[ai_call] ${JSON.stringify(meta)}`);
}
