# RecordYear.ai — Claude Code Reference

## What This Product Is

RecordYear is a permanent, AI-structured career record. Users log wins, upload artifacts (screenshots, PDFs, contracts), and the AI extracts structured records from them. The output is a shareable portfolio page that serves as a verifiable career record.

Two core use cases:

1. **Career Record** — "I want to look good." Log wins, close deals, get promoted. Paste raw notes or upload a CRM screenshot and get a clean, organized record out.
2. **Document Vault** — "I don't want to get screwed." Store signed contracts, comp plans, offer letters with a hash so they can't be altered. Proof exists. Disputes resolved.

The emotional wedge: fear of loss beats desire for gain. The vault use case is the stronger purchase motivator.

## Stack

- **Framework:** Next.js 16 (App Router, server components where possible)
- **Language:** TypeScript — strict, no `any`
- **Database + Auth:** Supabase (magic link auth, RLS enabled)
- **AI:** Anthropic SDK — Claude Sonnet as default executor
- **Styling:** Tailwind CSS — dark gold theme
- **Middleware:** `proxy.ts` (Next.js 16 renamed middleware) — handles session refresh

## Project Structure

```
~/Desktop/webappRecordyear.ai/
├── app/
│   ├── api/
│   │   └── wins/route.ts        # POST: validate input, call extractWins(), return
│   ├── auth/                    # Magic link callback handler
│   ├── dashboard/               # Protected server component, win logger + feed
│   ├── login/                   # Sends magic link
│   ├── portfolio/[userId]/      # Public shareable career record page
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                 # Landing page
├── components/                  # Presentational UI only — no business logic
├── lib/
│   ├── supabase/                # client.ts + server.ts
│   └── extractWins.ts           # AI enrichment service function
├── types/                       # Shared TypeScript types
├── proxy.ts                     # Session middleware
├── CLAUDE.md                    # This file
├── next.config.ts
└── .env.local                   # ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY
```

## Database Schema

`wins` table (live on Supabase):

```sql
id              uuid primary key default gen_random_uuid()
user_id         uuid references auth.users not null
created_at      timestamptz default now()
raw_input       text                    -- what the user pasted/uploaded
title           text                    -- AI-generated
category        text                    -- Deal Closed | Recognition | Skill | Milestone | Relationship
tags            text[] default '{}'
impact          text                    -- AI-generated one-liner
verification    jsonb                   -- { source: 'self' | 'artifact' | 'system', ref_id?: string }
source_file     text                    -- optional: path/url to original upload
source_hash     text                    -- SHA-256 of file at upload time (immutability)
happened_at     timestamptz             -- when the win actually occurred
recorded_at     timestamptz             -- when logged (may differ from happened_at)
```

RLS: users can only read and write their own rows.

## AI Enrichment — How It Works

Current flow (text input):
```
POST /api/wins
  → raw text input
  → lib/extractWins.ts: Claude Sonnet extracts title, category, tags[], impact
  → save to Supabase
  → return enriched win array
```

Planned flow (file upload):
```
POST /api/wins
  → file upload (image/PDF) OR raw text
  → if file: vision model or PDF text extraction first
  → Claude Sonnet: structured extraction
  → batch approval UI for multi-record uploads (e.g. CRM screenshot with 10 deals)
  → save verified records to Supabase with source_file + source_hash
```

Advisor strategy (future — when processing at volume):
- Haiku as default executor for clean, standard documents
- Opus as advisor when document is ambiguous, multi-page, or structurally unusual
- Only escalate when needed — cost stays near Haiku rates

## Verification Tiers

Every win record carries a verification level. Show this clearly in the UI.

| Tier | Source | Example |
|------|--------|---------|
| 1 | System-captured | Auto-logged from CRM integration |
| 2 | Peer/manager verified | Colleague confirmed via invite |
| 3 | Artifact-backed | User uploaded a screenshot or document |
| 4 | Self-reported | User typed it in |

MVP ships Tier 3 and Tier 4. Tiers 1 and 2 are Phase 2.

## Product philosophy — evidence over claims

### Three user motions, three trust profiles

RecordYear supports three distinct ways a user adds records:

1. **Real-time capture.** User just had the win and logs it immediately — artifact-first (CRM screenshot, contract, slide deck, recognition email). High trust by default. This is the flywheel motion.
2. **Backfill.** User adds wins from past career where no artifact exists or is no longer accessible — quick note / self-reported, explicitly labeled. This is the onboarding motion that lets users build a profile with real career depth on day one.
3. **Verification upgrade.** User attaches an artifact to an existing record, upgrading its verification tier. This is the trust-building motion that lets profiles get more credible over time.

The product must support all three. Killing text-paste would kill backfill. Making everything text-paste would kill trust.

### Artifact-first as default

The primary input UI is drag-and-drop / screenshot-paste for artifacts (screenshots, PDFs, docs, slides). Quick-note text entry is the secondary, smaller path — explicitly framed as the escape hatch for moments where no artifact exists.

This framing teaches users what RecordYear is: a place where evidence of your career lives, with a release valve for moments evidence doesn't exist yet.

### Verification spectrum (revised)

The earlier four-tier numbering system is replaced with a more honest named spectrum:

| Tier | What it proves |
|------|----------------|
| Self-reported | User claimed it. No evidence. |
| Artifact-attached | User uploaded an image/PDF. AI parsed it. Could be fabricated. |
| Cryptographically verified | Artifact carries a signature (DocuSign, Stripe, email DKIM). Hard to fake. |
| System-verified | Pulled directly from source system via API (CRM, payroll, etc.). Source of truth. |
| Vouched | Modifier on any tier. Another verified user confirmed the record. |

**Critical naming decision:** the word _verified_ is reserved for tiers where verification is actually happening (cryptographic, system-verified). Screenshot uploads are labeled _artifact-attached_, not _artifact-verified_. This protects the brand from a credibility cliff — screenshots can be fabricated, and overclaiming would crack the trust narrative.

### Time-of-entry context matters

Every record carries both `happened_at` (when the event occurred) and `created_at` (when it was logged in RecordYear). The gap between these reveals whether a record is real-time or backfilled. A 6-year-old self-reported record reads differently than a yesterday self-reported record. The verification UI surfaces both dates so viewers can pattern-match honestly.

### Mutual vouching as viral mechanic (post-v1, requires network density)

When a user logs a deal, RecordYear prompts them to tag collaborators by defined role: BDR, Sales Engineer, Manager, Champion at customer, Partner, Mentor. Each tagged collaborator receives a vouch request — confirm involvement, get credited on the record. Vouching becomes part of both users' career evidence.

**Strategic significance:** vouching is the strongest viral mechanic in the product. Every win logged generates 2–5 vouch invitations. Each invitation is a user-acquisition event tied to real value (the invitee gets credited on a real deal). Asymmetric incentives mean both sides benefit — unlike LinkedIn endorsements, which had no value asymmetry and devolved into noise.

**Game-theoretic property:** solo fabrication is easy, conspiracies of two are harder, conspiracies of three or four are very hard. Requiring multiple vouchers for highest-trust records means gaming requires multi-party collusion among people who all have their own profiles to protect.

**Sequencing constraint:** vouching requires network density — meaningfully useful around 300–500 active users, real growth engine around 1,000–2,000. Until then the product runs in single-player mode (self-reported + artifact-attached, no vouching). This is sequencing, not a problem. Ship single-player first.

### Strategic implication of the full system

RecordYear is not "a place to log wins." That competes with notes apps, journals, spreadsheets — free alternatives everywhere. RecordYear is "the place where evidence of a career lives." That competes with nothing. LinkedIn has no artifacts. Resumes are summaries, not evidence. Portfolio sites exist for designers and engineers but not for salespeople or other non-creative professionals.

The artifact-first input, the honest verification labeling, the vouching mechanic, the share cards — all get sharper when the underlying record is artifact-backed and honestly labeled. A profile that is 100% self-reported with all-recent dates looks suspicious. A profile that is self-reported-for-history, artifact-attached-for-recent, and system-verified-where-CRM-connected looks like exactly what you'd expect from a real career.

The verification labels are not a wall. They are a lens. Different records get different scrutiny based on the evidence available, and the user builds trust over time by adding evidence as it accumulates.

## Code Conventions

Keep it simple. If a new technical co-founder opens this repo, they should understand every file in 10 minutes. Complexity is a liability. Clarity is the asset.

- One responsibility per file
- API routes are thin — validate input, call a service function, return a response
- Service functions live in `/lib` — AI calls, DB writes, file processing
- Components are presentational — no business logic inside components
- Name things for what they do: `extractWinsFromImage.ts` not `utils.ts`
- No clever abstractions until the straightforward version has proven painful

**TypeScript rules:**
- Strict mode on
- No `any` — use `unknown` and narrow
- Define types in `/types` and import them; don't inline complex types

**Error handling:**
- API routes return typed error responses, never raw throws to the client
- AI calls can fail — always handle the case where enrichment returns null
- File processing can fail — return a clear error the UI can display

**Environment variables:**
- `ANTHROPIC_API_KEY` — Anthropic SDK
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- Never hardcode keys. Never commit `.env.local`.

## What "Done" Looks Like for a Feature

Before starting any feature, answer these three questions:
1. What does the user do?
2. What does the system return?
3. What does failure look like and how is it handled?

If you can't answer all three, the feature isn't ready to build yet.

## Current Status (April 2026)

**Working:**
- Landing page (dark gold theme, email capture)
- Magic link auth → dashboard redirect
- Dashboard: paste a win → AI enriches → saves → shows in feed
- AI enrichment: title, category, tags, impact via Claude Sonnet
- Batch paste: one submit can produce N enriched records
- Portfolio page: public, shareable, grouped by category

**Next to build:**
1. File upload flow (image + PDF → parse → structured records)
2. Batch approval UI for multi-record uploads
3. Verification tier display on portfolio
4. Document vault record type (offer letters, comp plans, contracts + hash)

## What This Is Not

- Not a coaching app
- Not a resume builder
- Not a journaling tool
- Not a LinkedIn replacement

It is a permanent, verifiable career record with a cryptographic audit trail. The portfolio is the output. The upload-and-parse pipeline is the moat.
