import Anthropic from "@anthropic-ai/sdk";
import type { WinCategory } from "@/types";

export interface ExtractedWin {
  title: string;
  category: WinCategory;
  tags: string[];
  impact: string;
}

const FALLBACK = (raw_input: string): ExtractedWin[] => [
  { title: raw_input.slice(0, 60), category: "Milestone", tags: [], impact: "" },
];

export async function extractWins(raw_input: string): Promise<ExtractedWin[]> {
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      messages: [
        {
          role: "user",
          content: `You are a career record assistant for sales professionals.

The input below may contain ONE win or MULTIPLE wins. Detect how many distinct wins are present and return ALL of them.

Raw input:
"""
${raw_input}
"""

Return a JSON array — one object per win. No markdown, no code fences, just the array:
[{"title":"concise title max 60 chars","category":"Deal Closed or Recognition or Skill or Milestone or Relationship","tags":["tag1","tag2","tag3"],"impact":"one sentence business impact"},...]`,
        },
      ],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = raw.replace(/```(?:json)?\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);

    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as ExtractedWin[];
    }
    return FALLBACK(raw_input);
  } catch (err) {
    console.warn("[extractWins] AI enrichment skipped:", err instanceof Error ? err.message : err);
    return FALLBACK(raw_input);
  }
}
