import { Pool } from "pg";

// Single shared connection pool for the whole server process. Next.js can
// hot-reload server modules in dev, so we stash the pool on globalThis to
// avoid opening a fresh pool (and leaking connections) on every reload.
declare global {
  var __chambersPgPool: Pool | undefined;
}

export const pool =
  globalThis.__chambersPgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__chambersPgPool = pool;
}

// Thin query helper. Swap this whole file for a generated Prisma Client
// import once `prisma generate` can run (see PRODUCTION_READINESS.md) —
// every call site uses `query<T>(...)` so the swap is mechanical.
export async function query<T = unknown>(text: string, params: unknown[] = []): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}

export async function queryOne<T = unknown>(text: string, params: unknown[] = []): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}
