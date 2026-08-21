#!/bin/sh
set -e

echo "Waiting for Postgres at ${DATABASE_URL%%\?*}..."
until psql "$DATABASE_URL" -c '\q' 2>/dev/null; do
  sleep 1
done
echo "Postgres is reachable."

# Idempotency check: this app currently applies its schema via the
# hand-derived SQL in prisma/migrations (see PRODUCTION_READINESS.md for
# why — the Prisma CLI's engine download was blocked in the sandbox this
# was built in; on a real VPS with normal internet, switch this to
# `npx prisma migrate deploy` instead, which tracks applied migrations
# properly via Prisma's own _prisma_migrations table).
TABLE_EXISTS=$(psql "$DATABASE_URL" -tAc "SELECT to_regclass('public.\"Firm\"') IS NOT NULL;")
if [ "$TABLE_EXISTS" != "t" ]; then
  echo "Schema not found — applying prisma/migrations/20260819000000_init/migration.sql..."
  psql "$DATABASE_URL" -f prisma/migrations/20260819000000_init/migration.sql
  echo "Schema applied."
else
  echo "Schema already present — skipping migration."
fi

exec "$@"
