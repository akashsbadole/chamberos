# Chambers — AI-first Practice Management (Next.js + Postgres)

A Clio-style legal practice management app built with Next.js 16 (App
Router) + TypeScript + Tailwind v4, backed by a **real, running Postgres
database** with real authentication and multi-tenancy — not a client-only
demo.

## Documentation map

- **This file** — feature list, setup, what's real vs. simulated.
- **`SKILLS.md`** — a spec sheet for every AI capability: what it does, local
  vs. real-AI mode, exact code location, upgrade path.
- **`PRODUCTION_READINESS.md`** — current status against production
  (auth/multi-tenancy/persistence are done and verified; read this for
  what's left — secrets management, rate limiting, testing, DPDP compliance).
- **`DEPLOYMENT.md`** — step-by-step VPS deployment with Docker: the app +
  Postgres, a reverse proxy with automatic HTTPS (Nginx Proxy Manager), a
  Docker management UI (Portainer), a database UI (Adminer), uptime
  monitoring (Uptime Kuma), and automated backups — all open source.
- **`prisma/schema.prisma`** — the canonical data model. The app currently
  talks to Postgres via `pg` directly rather than generated Prisma Client,
  because this environment's network blocks Prisma's engine download — see
  "The Prisma CLI situation" in `PRODUCTION_READINESS.md` for the one-time
  swap once you're on a normal network.

## Setup

1. **Postgres**: have a Postgres 16+ database available (local install,
   Docker, or a managed provider — Supabase/Neon/RDS all work).
2. **Env vars**: `cp .env.example .env` and fill in `DATABASE_URL`,
   `AUTH_SECRET`, and `AI_ENCRYPTION_KEY` (see comments in the file for how).
3. **Schema**: with real network access, run:
   ```bash
   npx prisma migrate dev --name init
   ```
   (If you hit the same engine-download block this environment did, apply
   `prisma/migrations/20260819000000_init/migration.sql` directly via `psql`
   instead — it's the exact DDL, already verified against a live database.)
4. **Install & run**:
   ```bash
   npm install
   npm run dev
   ```
5. Open http://localhost:3000 — you'll land on `/register` to create your
   firm's first admin account, then sign in normally from there.

## Features implemented

**Core practice management**
- **Real multi-tenant auth** — register a firm, invite/create users with
  roles (Admin/Lawyer/Paralegal/Client), JWT session cookies, middleware-
  enforced route protection. Verified end-to-end including adversarial
  cross-tenant isolation testing (see `PRODUCTION_READINESS.md`).
- **Dashboard** — active matters, upcoming hearings, open compliance items, recent activity.
- **Client onboarding** — guided flow: basic details → AI conflict check → KYC → e-signed engagement letter.
- **Cases** — list + detail view per matter, with tabs for research, documents, evidence, chat, meetings, and compliance.
- **Filing compliance checklist** — per-case checklist with due dates and overdue flags.
- **Time & billing** — log billable time per matter, running totals, unbilled amounts, simple invoice generation with a one-click WhatsApp send.
- **Calendar** — book hearings/meetings/deadlines, AI conflict detection, AI open-slot suggestions, WhatsApp reminder links.
- **eCourts cause-list sync** — simulated sync that matches a mock cause list to open matters by case number.
- **Client portal** — a client-facing view of upcoming schedule, and a grievance submission form the firm can triage.
- **Activity log** — a real, hash-chained, database-trigger-enforced append-only audit trail (see below).

**AI features**
- **AI clause finder + drafting** — detects 9 clause types with a risk rating and drafts first-draft clause language.
- **Full document generator** — Legal Notice, Reply to Legal Notice, Vakalatnama, Affidavit.
- **AI chat with case documents**, **AI case research assistant**, **meeting transcription**, **voice case creation**, **AI legal research**, **legal term glossary** — see `SKILLS.md` for full detail on each.
- **Law AI Assistant** (`/assistant`) — general-purpose legal chat.
- **Real, pluggable AI provider support, now firm-wide and server-side** — an admin sets Claude/OpenAI/Google AI once for the whole firm on the Settings page; the API key is AES-256-GCM encrypted and stored on the `Firm` record, decrypted only inside the server-side `/api/ai` route. It is never sent to, or stored in, any browser. Falls back to the local heuristic engine when no provider is configured.

**Security & compliance**
- **Real authentication**: bcrypt password hashing, JWT session cookies, proxy/middleware-enforced on every route.
- **Real multi-tenancy**: every table carries a `firmId`; every query filters by the authenticated session's firm. Tested adversarially — a second firm's session cannot read or modify a first firm's data (confirmed via direct PATCH attempt returning 404 and a DB-level check that nothing changed).
- **Real hash-chained audit log**: each `AuditEvent` row's hash covers the previous row's hash; a Postgres trigger rejects any `UPDATE`/`DELETE` on the table outright (tested — a raw SQL `UPDATE` against a logged row was rejected by the database itself). Verify the chain's integrity anytime from Settings.
- **Server-side AI key encryption**: AES-256-GCM, key derivation via a server-only env var (production should use a KMS — see `PRODUCTION_READINESS.md`).
- **Evidence log** — upload/attach evidence with a chain-of-custody note, timestamped in the audit log.

**Accessibility & mobile**
- Responsive layout with a slide-over drawer nav on mobile, skip-to-content link, `aria-current` on nav, labeled icon buttons, visible focus rings, `prefers-reduced-motion` support.
- **Multilingual UI** — navigation, page headers, status labels in **English, Hindi, Marathi, Telugu, Tamil, and Bengali**.

## What's real vs. simulated — updated

- **Persistence, auth, multi-tenancy, AI-key encryption, audit trail**: all
  real, all verified against a live Postgres instance (see
  `PRODUCTION_READINESS.md` for exactly how each was tested).
- **Local "AI" heuristics** (`src/lib/ai.ts`): still deterministic
  regex/template logic for clause finding, drafting, etc. — zero cost, zero
  setup, used whenever a firm hasn't configured a real provider.
- **Real AI** (when a firm's admin configures a key in Settings): genuine
  calls to Anthropic/OpenAI/Google, server-relayed, server-key-stored.
- **eCourts sync, legal research corpus, glossary**: still fabricated demo
  data, not live integrations.
- **Voice transcription, WhatsApp links**: both genuinely real (native
  browser API; `wa.me` deep links), unchanged from before.
- **Translations**: cover UI chrome, not every form label or AI-generated
  document — see the note in `PRODUCTION_READINESS.md`.

## Structure

\`\`\`
src/
  app/
    api/                27 route handlers — auth, bootstrap, and CRUD for
                        every entity, all firmId-scoped from the session
    login/, register/   auth pages
    (feature pages)     dashboard, cases, clients, onboarding, calendar,
                        court-sync, voice-intake, research, billing,
                        assistant, portal, activity, settings
  components/           Shell (responsive nav), SecurityGate, LanguageSwitcher, shared UI
  lib/
    db.ts               Postgres connection pool + query helper (pg)
    auth.ts             bcrypt + JWT sessions
    audit.ts             hash-chained audit log
    server-crypto.ts     AES-256-GCM for AI key encryption
    api-helpers.ts       shared session-check helper for API routes
    types.ts, mock-data.ts, ai.ts, ai-provider.ts, whatsapp.ts, store.tsx
    i18n/                locales, dictionaries, LocaleProvider
  proxy.ts               auth middleware (Next.js 16 "proxy" convention)
prisma/
  schema.prisma          canonical data model
  migrations/             hand-derived SQL (see PRODUCTION_READINESS.md)
\`\`\`
