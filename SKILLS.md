# SKILLS.md — AI capabilities reference

This documents every AI-driven capability ("skill") built into Chambers: what
it does, what powers it today, where the code lives, and what real-world
inputs/outputs look like. Use this as the spec when replacing a local
heuristic with a real model call, or when onboarding a developer to the AI
layer.

Every skill below runs in one of two modes:
- **Local** (`src/lib/ai.ts`) — deterministic, zero-cost, zero-setup. Regex,
  templates, and keyword matching. Always available, no API key needed.
- **Real AI** (`src/lib/ai-provider.ts` → `src/app/api/ai/route.ts`) — an
  actual call to Claude, OpenAI, or Google AI, configured on the Settings
  page. Currently wired into the **AI Assistant** page; other skills below
  are candidates to upgrade the same way (see "Upgrade path" per skill).

---

## 1. Clause Finder
**What it does:** Scans a document's text for 9 known clause types
(Termination, Indemnification, Limitation of Liability, Governing Law, Force
Majeure, Confidentiality, Payment Terms, Arbitration, Non-Compete), tags each
with a risk level (low/medium/high), and surfaces the matched snippet.
**Mode:** Local — regex pattern per clause type.
**Location:** `findClauses()` in `src/lib/ai.ts`.
**Input:** raw document text (string).
**Output:** `DetectedClause[]` — `{ type, risk, snippet, note }`.
**Limitation:** only recognizes clauses that use the literal heading pattern
(e.g. "Termination: ..."). Won't catch clauses phrased without a heading.
**Upgrade path:** replace with a real-AI call that extracts clauses by
meaning, not heading text — pass the document + a structured-output prompt
asking for the same `DetectedClause[]` shape.

## 2. Clause Drafting
**What it does:** Generates first-draft language for 6 clause types, filled
with the counterparty's name.
**Mode:** Local — string templates.
**Location:** `draftClause()` in `src/lib/ai.ts`.
**Input:** clause type (string), party name (string).
**Output:** drafted clause text (string).
**Upgrade path:** real-AI prompt with the clause type + case context (practice
area, jurisdiction) for language tailored to the actual matter instead of a
generic template.

## 3. Full Document Generator
**What it does:** Generates complete first-draft documents — Legal Notice,
Reply to Legal Notice, Vakalatnama, Affidavit — filled with case and client
details.
**Mode:** Local — string templates.
**Location:** `generateDocument()` + `DOCUMENT_TEMPLATES` in `src/lib/ai.ts`.
**Input:** document type, `LegalCase`, client name.
**Output:** full document text (string), downloadable or saved to the case.
**Upgrade path:** real-AI generation would let you add arbitrary document
types on demand instead of maintaining a fixed template dictionary.

## 4. AI Chat with Case Documents
**What it does:** Answers questions about a specific matter, grounded in that
case's uploaded documents, deadlines, and hearing dates.
**Mode:** Local — keyword-routed responses (liability → cites the Limitation
of Liability clause found by the Clause Finder; deadline → nearest open
compliance item; etc).
**Location:** `chatWithCase()` in `src/lib/ai.ts`; UI in `ChatTab` inside
`src/app/cases/[id]/page.tsx`.
**Input:** `LegalCase`, free-text question.
**Output:** answer string.
**Upgrade path:** this is the most valuable skill to move to real AI first —
swap the keyword router for `callAIProvider()` with the case's documents
concatenated as context (mind token limits; summarize or chunk for long
matters).

## 5. AI Case Research Assistant
**What it does:** Reviews everything on record for a matter (client link,
case number, court, hearing date, documents, compliance items, governing-law
clause) and generates direct questions for the lawyer wherever something is
missing, instead of silently assuming.
**Mode:** Local — a fixed checklist of completeness rules.
**Location:** `generateResearchQuestions()` in `src/lib/ai.ts`; UI in
`ResearchAssistantTab` inside `src/app/cases/[id]/page.tsx`.
**Input:** `LegalCase`, `Client | undefined`.
**Output:** `ResearchQuestion[]` — `{ question, reason }`, answered inline by
the lawyer and stored on the matter.
**Upgrade path:** real AI could generate open-ended, matter-specific
questions beyond the fixed checklist (e.g. spotting an unusual clause
combination worth flagging) — feed it the case JSON and ask for gaps.

## 6. Meeting Transcription & Summarization
**What it does:** Turns a pasted or dictated meeting transcript into a short
summary and a list of action items.
**Mode:** Local — first two sentences as the summary; regex for
commitment-shaped sentences ("will send…", "Action item:", "Follow-up:") as
action items.
**Location:** `summarizeMeeting()` in `src/lib/ai.ts`; UI in `MeetingsTab`
inside `src/app/cases/[id]/page.tsx`. Recording uses the same Web Speech API
as Voice Intake (real, not simulated).
**Input:** transcript text (string).
**Output:** `{ summary, actionItems }`.
**Upgrade path:** real-AI summarization is a large quality jump here — the
local heuristic often misses action items phrased unusually.

## 7. Voice Case Creation
**What it does:** Parses a dictated or typed description of a new matter into
a structured case draft — client name, opposing party, practice area, court.
**Mode:** Local — regex extraction (`"client is X"`, `"against Y"`, `"at the
Z court"`) + keyword-based practice-area classification.
**Location:** `detectPracticeArea()` / `extractField()` in
`src/app/voice-intake/page.tsx`. Speech-to-text itself is the browser's
native `SpeechRecognition` API — genuinely real, not simulated.
**Input:** transcript text.
**Output:** case draft (title, practice area, court) for review before
saving.
**Upgrade path:** real-AI extraction would handle phrasing the regex patterns
miss (e.g. "my client, X, wants to sue Y" instead of "client is X").

## 8. AI Legal Research
**What it does:** Searches a demo case-law corpus by keyword/tag and lets you
save a citation directly onto a matter's document list.
**Mode:** Local — keyword + tag scoring against 8 hardcoded entries.
**Location:** `searchLegalResearch()` in `src/lib/ai.ts`; corpus in
`LEGAL_CORPUS` (`src/lib/mock-data.ts`).
**Input:** free-text query.
**Output:** `ResearchResult[]`, ranked by relevance score.
**Upgrade path:** replace the hardcoded corpus with a real case-law API
(licensed provider, or a real-AI call with web search / retrieval over an
actual judgment database).

## 9. Legal Term Glossary
**What it does:** Looks up ~20 common Indian legal terms by name or tag.
**Mode:** Local — substring match against a hardcoded glossary.
**Location:** `searchGlossary()` in `src/lib/ai.ts`; data in `GLOSSARY`
(`src/lib/mock-data.ts`).
**Input:** free-text query.
**Output:** `GlossaryTerm[]`.
**Upgrade path:** lowest priority to upgrade — a real-AI call for a fixed
glossary is usually more expensive and less reliable than a curated list.
Better spent extending the glossary itself.

## 10. Law AI Assistant (general chat)
**What it does:** Open-ended legal Q&A, not scoped to a specific matter.
**Mode:** **Real AI when configured** — calls Claude/OpenAI/Google via
`/api/ai`; falls back to the glossary + case-law search (skills 8–9) when no
provider is configured.
**Location:** `src/app/assistant/page.tsx`; provider relay in
`src/app/api/ai/route.ts`.
**Input:** free-text question + conversation history.
**Output:** model response (real) or best-effort local match (fallback).
**This is the reference implementation** for wiring any of the other local
skills up to a real model — see `callAIProvider()` usage in this file for the
pattern.

## 11. AI Scheduling — Conflict Detection & Slot Suggestion
**What it does:** Checks a proposed calendar event against existing events
for time overlaps, and suggests the next N open working-hour slots of a given
duration.
**Mode:** Local — interval-overlap math, no AI model needed (this is
correctly a deterministic algorithm, not a candidate for "upgrading" to a
real model).
**Location:** `detectConflicts()`, `suggestSlots()` in `src/lib/ai.ts`.

---

## Provider integration reference

- **Client helper:** `src/lib/ai-provider.ts` — `loadAISettings()` (returns
  provider/model/whether-a-key-is-set, never the key itself),
  `saveAISettings()`, `isRealProviderConfigured()`, `callAIProvider(system,
  messages)`.
- **Server relay:** `src/app/api/ai/route.ts` — a `POST` handler that reads
  the caller's session, looks up their **firm's** stored provider config,
  decrypts the API key server-side (`src/lib/server-crypto.ts`), and
  forwards the request. The client never sends or sees the key.
- **Key storage:** `src/app/api/settings/ai/route.ts` — AES-256-GCM
  encrypts the key before writing it to the `Firm` row; only an `ADMIN`
  role can change it (enforced server-side, not just hidden in the UI).
- **Settings UI:** `src/app/settings/page.tsx` — provider picker, API key
  input (write-only; a previously saved key is never redisplayed), model
  override, "Test connection" button, plus an audit-chain integrity check.
- **Scope:** one AI provider configuration per firm, not per user — every
  lawyer at the firm shares it once an admin sets it up.
- **Default models:** `claude-sonnet-4-5` (Anthropic), `gpt-4o-mini`
  (OpenAI), `gemini-2.0-flash` (Google) — see `DEFAULT_MODELS` in
  `ai-provider.ts`; update as newer models ship.

To upgrade any Local skill above to Real AI: import `callAIProvider` from
`@/lib/ai-provider`, build a `system` prompt describing the task and the
exact output shape you need, pass relevant context in `messages`, and keep
the existing local function as a `catch` fallback (see `AssistantPage` for
the pattern) so the app still works for firms that haven't configured a
provider.
