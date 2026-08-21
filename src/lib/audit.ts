import crypto from "crypto";
import { query, queryOne } from "./db";

// Hash-chained, append-only audit log. Each row's hash covers the previous
// row's hash + this row's own fields, so altering or deleting a historical
// row (bypassing the DB trigger somehow, e.g. a superuser) breaks the chain
// and is detectable by verifyChain(). The trigger in the migration SQL is
// the primary defense; this hash chain is defense-in-depth on top of it.

interface AuditRow {
  hash: string;
}

export async function recordAuditEvent(params: {
  firmId: string;
  userId?: string | null;
  action: string;
  caseId?: string | null;
  clientId?: string | null;
  detail: string;
}) {
  const prev = await queryOne<AuditRow>(
    `SELECT hash FROM "AuditEvent" WHERE "firmId" = $1 ORDER BY "timestamp" DESC LIMIT 1`,
    [params.firmId]
  );
  const prevHash = prev?.hash ?? null;
  const id = `audit_${crypto.randomUUID()}`;
  // Hash on the epoch-ms integer, not a JS-formatted ISO string — Postgres
  // reformats timestamps on read-back (different separators/precision), so
  // hashing against a string that won't round-trip identically would make
  // verifyChain() falsely report tampering on every row. Epoch ms survives
  // the TIMESTAMP(3) round trip exactly.
  const timestampMs = Date.now();

  const hash = crypto
    .createHash("sha256")
    .update(`${prevHash ?? ""}|${params.firmId}|${params.action}|${params.detail}|${timestampMs}`)
    .digest("hex");

  await query(
    `INSERT INTO "AuditEvent" (id, "firmId", "userId", "timestamp", action, "caseId", "clientId", detail, "prevHash", hash)
     VALUES ($1, $2, $3, to_timestamp($4::double precision / 1000), $5, $6, $7, $8, $9, $10)`,
    [
      id,
      params.firmId,
      params.userId ?? null,
      timestampMs,
      params.action,
      params.caseId ?? null,
      params.clientId ?? null,
      params.detail,
      prevHash,
      hash,
    ]
  );

  return { id, hash };
}

// Walks the chain for a firm and confirms every row's hash matches its
// recomputed value and correctly references the previous row. Call this
// from an admin "verify audit integrity" action.
export async function verifyChain(firmId: string): Promise<{ valid: boolean; brokenAt: string | null }> {
  const rows = await query<{
    id: string;
    action: string;
    detail: string;
    epochMs: string; // bigint comes back as string from pg
    prevHash: string | null;
    hash: string;
  }>(
    `SELECT id, action, detail, (EXTRACT(EPOCH FROM "timestamp") * 1000)::bigint AS "epochMs", "prevHash", hash
     FROM "AuditEvent" WHERE "firmId" = $1 ORDER BY "timestamp" ASC`,
    [firmId]
  );

  let expectedPrev: string | null = null;
  for (const row of rows) {
    if (row.prevHash !== expectedPrev) return { valid: false, brokenAt: row.id };
    const recomputed: string = crypto
      .createHash("sha256")
      .update(`${row.prevHash ?? ""}|${firmId}|${row.action}|${row.detail}|${row.epochMs}`)
      .digest("hex");
    if (recomputed !== row.hash) return { valid: false, brokenAt: row.id };
    expectedPrev = row.hash;
  }
  return { valid: true, brokenAt: null };
}
