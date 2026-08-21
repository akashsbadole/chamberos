import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { query, queryOne } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId } = auth.session;
  const { id } = await params;
  const row = await queryOne(`SELECT te.* FROM "TimeEntry" te JOIN "LegalCase" lc ON lc.id = te."caseId" WHERE te.id = $1 AND lc."firmId" = $2`, [id, firmId]);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId } = auth.session;
  const { id } = await params;

  const existing = await queryOne(
    `SELECT te.id FROM "TimeEntry" te JOIN "LegalCase" lc ON lc.id = te."caseId" WHERE te.id = $1 AND lc."firmId" = $2`,
    [id, firmId]
  );
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: { billed?: boolean; description?: string; minutes?: number; rate?: number } = {};
  try { body = await req.json(); } catch { body = {}; }
  if (body.billed === undefined && body.description === undefined && body.minutes === undefined && body.rate === undefined) {
    const row = await queryOne(`UPDATE "TimeEntry" SET billed = NOT billed WHERE id = $1 RETURNING *`, [id]);
    return NextResponse.json(row);
  }
  const fields: string[] = []; const values: unknown[] = []; let idx = 1;
  if (body.description !== undefined) {
    if (!String(body.description).trim()) return NextResponse.json({ error: "description required" }, { status: 400 });
    fields.push(`description = $${++idx}`); values.push(String(body.description).trim());
  }
  if (body.minutes !== undefined) {
    if (!Number.isFinite(Number(body.minutes)) || Number(body.minutes) <= 0) return NextResponse.json({ error: "minutes must be > 0" }, { status: 400 });
    fields.push(`minutes = $${++idx}`); values.push(Math.floor(Number(body.minutes)));
  }
  if (body.rate !== undefined) {
    if (!Number.isFinite(Number(body.rate)) || Number(body.rate) < 0) return NextResponse.json({ error: "rate must be >= 0" }, { status: 400 });
    fields.push(`rate = $${++idx}`); values.push(Number(body.rate));
  }
  if (body.billed !== undefined) { fields.push(`billed = $${++idx}`); values.push(!!body.billed); }
  if (fields.length === 0) return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  const row = await queryOne(`UPDATE "TimeEntry" SET ${fields.join(", ")} WHERE id = $1 RETURNING *`, [id, ...values]);
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId } = auth.session;
  const { id } = await params;

  const existing = await queryOne(
    `SELECT te.id FROM "TimeEntry" te JOIN "LegalCase" lc ON lc.id = te."caseId" WHERE te.id = $1 AND lc."firmId" = $2`,
    [id, firmId]
  );
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await query(`DELETE FROM "TimeEntry" WHERE id = $1`, [id]);
  return NextResponse.json({ ok: true });
}
