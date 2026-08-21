# Production readiness

**Updated status: the core backend is now real, running, and verified —
Postgres, authentication, multi-tenancy, server-side AI keys, and a
hash-chained audit log all actually work today, tested end-to-end against a
live database. What's left is hardening and operational maturity, not
architecture.**

## What changed from the earlier prototype assessment

The previous version of this document listed persistence, auth, and
multi-tenancy as blocking gaps. They're now implemented:

| Category | Status | Verified how |
|---|---|---|
| **Persistence** | ✅ Real Postgres 16 | Schema applied, data survives server restarts (tested across separate dev-server runs) |
| **Authentication** | ✅ Real | bcrypt password hashing, JWT session cookies (`jose`), tested register→login→session round-trip |
| **Multi-tenancy** | ✅ Real, tested adversarially | Registered two separate firms; confirmed Firm B's bootstrap fetch returns zero of Firm A's data, and a direct PATCH attempt against Firm A's client using Firm B's session returns 404 and the DB row is verifiably unmodified |
| **AI provider keys** | ✅ Server-side only | AES-256-GCM encrypted on the `Firm` row, decrypted only inside `/api/ai`; never sent to or stored in the browser |
| **Audit trail** | ✅ Real, hash-chained | Each row's hash covers the previous row's hash; a database trigger rejects `UPDATE`/`DELETE` outright — tested by attempting a raw SQL `UPDATE` against a logged event and confirming Postgres rejected it |
| Data model | ✅ Ready | `prisma/schema.prisma`, applied as real DDL (`prisma/migrations/20260819000000_init/migration.sql`) |
| UI/UX, accessibility, mobile, i18n | ✅ Production-grade | Unchanged from before — responsive layout, keyboard/focus support, 6 languages |
| **Prisma CLI / Prisma Client** | ⚠️ Blocked in this environment only | See "The Prisma CLI situation" below — the app currently talks to Postgres via `pg` directly, not generated Prisma Client |
| **Testing** | ❌ None | No automated tests exist yet |
| **Observability** | ❌ None | No error tracking, logging, or uptime monitoring |
| **DPDP compliance** | ❌ Not assessed | Still a legal review, not an engineering task — see below |
| **Secrets management** | ⚠️ Dev-grade | `.env` has plaintext dev secrets; needs a real secrets manager in production |

## The Prisma CLI situation

`prisma migrate dev`, `prisma generate`, and even `prisma --version` all
require downloading a Rust engine binary from `binaries.prisma.sh`. In the
sandboxed environment this was built in, that host is blocked by the egress
proxy (`403 host_not_allowed`) — confirmed on both Prisma 7.9.1 and 5.22.0.

This is an environment limitation, not a schema or architecture problem:

- **`prisma/schema.prisma`** is complete and correct — it's the schema that
  was actually applied to Postgres (by hand-deriving equivalent SQL DDL and
  running it via `psql`, since the CLI couldn't run).
- **`prisma/migrations/20260819000000_init/migration.sql`** contains that
  exact DDL, verified against a live database (tables, indexes, foreign
  keys, and the audit-immutability trigger all created and tested).
- **The app's data layer** (`src/lib/db.ts` + every `src/app/api/**/route.ts`
  file) currently uses `pg` directly with parameterized queries — fully
  functional, not a stub. This is what was actually tested end-to-end above.

**When you're in a normal network environment** (your own machine, CI, or
any host that isn't behind this specific sandbox's proxy):

1. Delete `prisma/migrations/20260819000000_init/` (it's hand-written, not
   Prisma-generated — let Prisma create its own so its internal tracking
   table stays authoritative).
2. Run `npx prisma migrate dev --name init` against a fresh database.
3. Run `npx prisma generate`.
4. Swap `src/lib/db.ts`'s `pg` calls for the generated Prisma Client — every
   call site uses the same `query<T>()` / `queryOne<T>()` pattern, so this
   is a mechanical find-and-replace per file, not a redesign. Prisma Client
   also buys you compile-time-checked queries, which raw `pg` doesn't have.

## Remaining gaps to close before real client data touches this

### 1. Prisma Client swap (see above) — mechanical, not architectural.

### 2. Secrets management
- `AUTH_SECRET` and `AI_ENCRYPTION_KEY` are plaintext dev values in `.env`.
  In production these must come from a real secrets manager (AWS Secrets
  Manager, GCP Secret Manager, Vault) and `AI_ENCRYPTION_KEY` specifically
  should be a KMS-managed key, not an application-level env var — see the
  note in `src/lib/server-crypto.ts`.
- Rotate `AUTH_SECRET` requires invalidating all existing sessions (JWTs
  signed with the old secret stop verifying) — plan for this operationally.

### 3. Rate limiting & abuse protection
- `/api/auth/login` and `/api/auth/register` have no rate limiting — add it
  before this is internet-facing (brute-force and account-enumeration risk).
- `/api/ai` calls a paid third-party API per request with no per-firm quota
  — add usage tracking and limits before opening this to real users.

### 4. Session/token hardening
- Current session is a single long-lived (7-day) JWT with no revocation
  mechanism short of rotating `AUTH_SECRET` for everyone. Consider a
  refresh-token pattern or a session table you can invalidate per-user for
  production (e.g. on logout-everywhere or a compromised-account response).

### 5. File/object storage
- `CaseDocument.content` and `Evidence.content` are still stored as text
  directly in Postgres — fine for the current text-based demo content, but
  scanned images or large attachments should move to S3-compatible object
  storage with the DB holding a pointer, before this handles real evidence
  uploads at scale.

### 6. Testing
- The verification in this document (multi-tenant isolation, audit
  immutability, auth round-trip) was done manually via `curl` and a
  standalone script during development. None of it is codified as an
  automated test yet. At minimum, turn the multi-tenant isolation check
  into a real integration test — it's the single highest-value test in the
  system, and it should run on every change, not just once by hand.

### 7. Observability
- No error tracking (Sentry or similar), no structured logging, no uptime
  monitoring. Add before any real client relies on hearing-date reminders
  or filing deadlines surfaced by this app.

### 8. DPDP Act 2023 compliance
- This is a legal review, not an engineering task — loop in counsel before
  onboarding real client data. At minimum you'll need a documented data
  processing basis, a privacy policy, a breach-notification procedure, and
  a clear disclosure that client data may be sent to a third-party AI
  provider once a firm configures one in Settings.

## What does NOT need to change
- React component structure, Tailwind theming, page layouts — unaffected by
  the backend work.
- The AI skill functions in `src/lib/ai.ts` (see `SKILLS.md`) — identical
  regardless of where the surrounding data comes from.
- The i18n dictionary system — independent of the persistence layer.
- The core schema design (`Firm`/`User`/`Client`/`LegalCase`/... and their
  relationships) — this is what was actually built and tested; only the
  ORM library sitting on top of it needs to change.
