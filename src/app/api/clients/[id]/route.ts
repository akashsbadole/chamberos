import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { query, queryOne } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId } = auth.session;
  const { id } = await params;
  const patch = await req.json();

  const existing = await queryOne<{ id: string }>(`SELECT id FROM "Client" WHERE id = $1 AND "firmId" = $2`, [id, firmId]);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const fields = Object.keys(patch);
  if (fields.length === 0) return NextResponse.json({ error: "No fields to update" }, { status: 400 });

  const setClause = fields.map((f, i) => `"${f}" = $${i + 2}`).join(", ");
  const row = await queryOne(
    `UPDATE "Client" SET ${setClause}, "updatedAt" = now() WHERE id = $1 RETURNING *`,
    [id, ...fields.map((f) => patch[f])]
  );
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
