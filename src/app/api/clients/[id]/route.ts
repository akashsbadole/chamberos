import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { query, queryOne } from "@/lib/db";
import { decryptPII, encryptPII } from "@/lib/server-crypto";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId } = auth.session;
  const { id } = await params;
  const patch = await req.json();

  const existing = await queryOne<{ id: string }>(`SELECT id FROM "Client" WHERE id = $1 AND "firmId" = $2`, [id, firmId]);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed = ["name", "email", "phone", "matterType", "status", "conflictChecked", "conflictFlags", "kycVerified", "engagementSigned", "notes"];
  const fields = Object.keys(patch).filter((f) => allowed.includes(f));
  if (fields.length === 0) return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });

  // Basic validation
  if (patch.email !== undefined && typeof patch.email === "string" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patch.email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  if (patch.status !== undefined && !["intake", "conflict_check", "kyc", "engagement", "active"].includes(patch.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  if (patch.phone !== undefined && typeof patch.phone === "string" && patch.phone && !/^\+?[0-9\s\-()]{7,20}$/.test(patch.phone)) {
    return NextResponse.json({ error: "Invalid phone" }, { status: 400 });
  }

  const setClause = fields.map((f, i) => `"${f}" = $${i + 2}`).join(", ");
  const values = fields.map((f) => {
    const v = patch[f];
    if (f === "notes" && typeof v === "string") return encryptPII(v);
    if (f === "conflictFlags" && !Array.isArray(v)) return [];
    return v;
  });
  const row = await queryOne(
    `UPDATE "Client" SET ${setClause}, "updatedAt" = now() WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  return NextResponse.json(row);
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId } = auth.session;
  const { id } = await params;
  const row = await queryOne<Record<string, unknown>>(`SELECT * FROM "Client" WHERE id = $1 AND "firmId" = $2`, [id, firmId]);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (typeof row.notes === "string") row.notes = decryptPII(row.notes as string);
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId } = auth.session;
  const { id } = await params;

  const existing = await queryOne<{ id: string }>(`SELECT id FROM "Client" WHERE id = $1 AND "firmId" = $2`, [id, firmId]);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Guard against FK conflicts — clients are referenced by cases and grievances.
  const refs = await queryOne<{ cases: string; grievances: string }>(
    `SELECT
       (SELECT count(*)::text FROM "LegalCase" WHERE "clientId" = $1) AS cases,
       (SELECT count(*)::text FROM "Grievance" WHERE "clientId" = $1) AS grievances`,
    [id]
  );
  if (refs && (Number(refs.cases) > 0 || Number(refs.grievances) > 0)) {
    return NextResponse.json(
      { error: "Client has linked cases or grievances. Reassign or delete them first.", cases: Number(refs.cases), grievances: Number(refs.grievances) },
      { status: 409 }
    );
  }

  await query(`DELETE FROM "Client" WHERE id = $1`, [id]);
  return NextResponse.json({ ok: true });
}
