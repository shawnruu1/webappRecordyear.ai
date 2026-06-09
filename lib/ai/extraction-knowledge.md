# Sales Metrics & Extraction Knowledge

This document is loaded into the AI's context for every wins extraction call. Its purpose: teach the AI how to interpret sales metrics, contract values, and common CRM column patterns so extractions are accurate and consistent.

## Core revenue concepts

> **Governing principle.** The extraction's job is not to guess perfectly — it is to never hide a guess. A flagged low-confidence value is always preferable to a confidently-wrong one, because a silently-wrong number poisons the credibility the product depends on. When source data is ambiguous, surface the ambiguity to the user in review rather than resolving it silently.

**Disambiguation heuristics (apply in order):**

- If one monetary value is approximately 12× another, the larger is annual (ARR) and the smaller is monthly (MRR) — use the annual figure.
- When only a monthly figure is present, multiply by 12 and record the original monthly figure in `raw_excerpt` so the conversion is auditable.
- A much-larger value paired with a multi-year contract term is likely TCV, not ARR — do not use it as ARR.
- Never default to the smallest monetary value.
- When a record has 2+ unlabeled monetary values and no clear annual label, set confidence to **low** and let the source values stand in `raw_excerpt` for the user to disambiguate. (This is also enforced in code, not left to discretion.)

**ARR** (Annual Recurring Revenue) — revenue normalized to a 12-month basis. The canonical revenue field in RecordYear's data model. All other monetary values should be converted to ARR when storing in `arr_amount`.

**ACV** (Annual Contract Value) — for our purposes, treated as synonymous with ARR. If a deal is a single-year recurring contract, ACV = ARR.

**MRR** (Monthly Recurring Revenue) — multiply by 12 to derive ARR. Never surface "MRR" in the user-facing title or impact line; always convert.

**TCV** (Total Contract Value) — the full value of the contract over its duration. For multi-year deals, TCV = ACV × years. Do not use TCV as ARR unless the contract is exactly one year.

**Deal size / Booking / Sale amount** — ambiguous terms that may mean ARR, TCV, or a one-time fee. If the source provides only this without context, mark confidence as "low" and prefer to store the raw value in `raw_excerpt` rather than guess at ARR.

## Contract duration handling

Contracts have a duration (typically 12, 24, or 36 months). When duration information is available alongside a monetary figure, use it to disambiguate:

- If you see "ACV: $50,000" and "Duration: 36 months" → ARR is $50,000; TCV is $150,000.
- If you see "Contract value: $150,000" and "Duration: 36 months" → that value is likely TCV; derive ARR as $50,000 with medium confidence.
- If you see "$50,000" with no duration context → store as ARR with medium confidence, note ambiguity in `raw_excerpt`.

When duration is unknown, default to interpreting the dollar value as ARR (the most common single-deal framing in sales conversations).

## CRM column heuristics

When extracting from a CRM screenshot with multiple monetary columns, identify columns by their header labels rather than position:

- Headers containing "ARR", "ACV", "Annual" → annual recurring revenue
- Headers containing "MRR", "Monthly" → monthly; multiply by 12
- Headers containing "TCV", "Total", "Contract Value" → total contract; use duration if available to derive ARR, otherwise store separately
- Headers containing "Sale Amount", "Deal Amount", "Revenue" → ambiguous; use surrounding context, default to ARR with low/medium confidence
- Headers in French: "Durée de la prestation (mois)" = duration in months; "Tarif" prefixes = pricing fields

If a CRM screenshot has multiple monetary columns AND no clear header distinguishing them, mark the extraction as "medium" or "low" confidence and store the raw values in `raw_excerpt` for the user to disambiguate.

## What NOT to do

- Do not guess at unlabeled monetary values. Multi-column screenshots with ambiguous columns get "low" confidence, not invented certainty.
- Do not multiply ARR values to "make them larger" — they are already annualized.
- Do not assume currency. If the source uses "$" without a currency code, treat as USD only if context supports it (e.g., US-based company).
- Do not paraphrase MRR or TCV as ARR in user-facing fields without the conversion being mathematically justified.

## Common deal narrative patterns

Sales reps describe wins in shorthand. Recognize these patterns:

- "Closed [Company] - $[N]K" → company name + ARR figure (most common)
- "[Company] / [N]K / [months]" → company / ARR / cycle length
- "[N] users at [Company]" → user count, may need ARR derivation
- "Multi-year" / "3-year deal" → contract duration signal
- "Expansion" / "renewal" / "new logo" → deal type signals (preserve as tags)
- "[Partner name]" appearing with deal → channel partner (preserve as tag)

## Confidence calibration

- **High**: explicit ARR/ACV with company name, date, and clear context
- **Medium**: monetary value present but requires inference (MRR conversion, duration math, column disambiguation)
- **Low**: ambiguous monetary value, missing context, multiple competing interpretations
