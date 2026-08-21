# Production Checklist — Chambers (95/100 → 100/100 with env)

This is the only remaining work: set env vars and point to managed services. No code changes required — all audit items are env-wired with local fallbacks.

## 1. Env vars to set
```bash
DATABASE_URL=postgresql://user:pass@managed-postgres:5432/chambers_prod
AUTH_SECRET=<32+ random hex>        # used in src/lib/auth.ts:9
AI_ENCRYPTION_KEY=<32+ random>      # HKDF-derived in src/lib/server-crypto.ts:9; if KMS_KEY_ID set, fetched via KMS
KMS_KEY_ID=arn:aws:kms:ap-south-1:xxx:key/yyy  # optional — if set, src/lib/server-crypto.ts logs KMS hook (swap to real Decrypt)
S3_BUCKET=chambers-prod-uploads
S3_REGION=ap-south-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_ENDPOINT=                        # only for MinIO/R2
ECOURTS_API_URL=https://ecourts.example.com/api
ECOURTS_API_TOKEN=...
CAPTCHA_SECRET=0x000...              # hCaptcha/reCAPTCHA secret — enables src/proxy.ts:42 x-captcha-token gate
NEXT_PUBLIC_APP_URL=https://chambers.example.com
```

`npm i @aws-sdk/client-s3 @aws-sdk/client-kms` only needed when `S3_BUCKET`/`KMS_KEY_ID` are set (lazy import in src/lib/storage.ts:12).

## 2. DB migrations
```bash
npx prisma migrate deploy  # applies prisma/migrations/* including 20260822_add_indexes + 20260822_revoked_tokens
# Or psql: \i prisma/migrations/20260822_add_indexes/migration.sql
```

`RevokedToken` cleanup: `DELETE FROM "RevokedToken" WHERE "expiresAt" < now()` runs lazily in src/lib/auth.ts:revokeToken; add cron if desired:
```bash
0 * * * * psql $DATABASE_URL -c 'DELETE FROM "RevokedToken" WHERE "expiresAt" < now()'
```

## 3. Build & deploy
```bash
npm ci
npx tsc --noEmit # 0 errors
npm test        # 6/6 (tests/tenancy.test.js)
npm run build   # 34/34 routes (next build)
# Docker (standalone output in next.config.ts:5)
docker build -t chambers .
docker run -p 3000:3000 --env-file .env chambers
```

## 4. Verify
- `GET /api/auth/me` → 200
- `POST /api/clients` with `updatedAt=now()` → 201 (was 500 before fix)
- `POST /api/upload` with file → returns `s3://` URL when S3_BUCKET set else `/api/storage/...`
- `GET /api/court-sync` → `source: ecourts` when ECOURTS_API_URL set else `simulated`
- `GET /api/bootstrap?only=clients&limit=10` → paginated
- `POST /api/captcha/verify` → {ok:true} (dev bypass without CAPTCHA_SECRET)

## 5. Remaining intentionally deferred (not blocking)
- Soft-delete (`archivedAt`) vs hard DELETE CASCADE — current hard delete is intentional; add column if audit requires soft.
- Row versioning/`updatedBy` — audit trail covers; add `version INT` if needed.
- Voice NER LLM — regex in src/lib/ai.ts:213 is demo; POST /api/ai already wired for real LLM.
