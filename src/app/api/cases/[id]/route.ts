import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { query, queryOne } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId } = auth.session;
  const { id } = await params;
  const patch = await req.json();

  const existing = await queryOne<{ id: string }>(`SELECT id FROM "LegalCase" WHERE id = $1 AND "firmId" = $2`, [id, firmId]);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed = ["clientId", "title", "practiceArea", "status", "courtName", "caseNumber", "nextHearing", "filingDeadline"];
  const fields = Object.keys(patch).filter((f) => allowed.includes(f));
  if (fields.length === 0) return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });

  const setClause = fields.map((f, i) => `"${f}" = $${i + 2}`).join(", ");
  const row = await queryOne(
    `UPDATE "LegalCase" SET ${setClause}, "updatedAt" = now() WHERE id = $1 RETURNING *`,
    [id, ...fields.map((f) => patch[f])]
  );
  return NextResponse.json(row);
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId } = auth.session;
  const { id } = await params;
  const row = await queryOne(`SELECT * FROM "LegalCase" WHERE id = $1 AND "firmId" = $2`, [id, firmId]);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const compliance = await query(`SELECT * FROM "ComplianceItem" WHERE "caseId" = $1 ORDER BY "dueDate"`, [id]);
  const documents = await query(`SELECT * FROM "CaseDocument" WHERE "caseId" = $1 ORDER BY "uploadedAt" DESC`, [id]);
  const evidence = await query(`SELECT * FROM "Evidence" WHERE "caseId" = $1 ORDER BY "addedAt" DESC`, [id]);
  return NextResponse.json({ ...row as object, compliance, documents, evidence });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId } = auth.session;
  const { id } = await params;

  const existing = await queryOne<{ id: string }>(`SELECT id FROM "LegalCase" WHERE id = $1 AND "firmId" = $2`, [id, firmId]);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Child rows (compliance, documents, evidence, time entries, etc.) cascade
  // via ON DELETE CASCADE, so deleting the case cleans them up atomically.
  await query(`DELETE FROM "LegalCase" WHERE id = $1`, [id]);
  return NextResponse.json({ ok: true });
}
