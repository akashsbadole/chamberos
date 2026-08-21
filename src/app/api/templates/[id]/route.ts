import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { queryOne } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId, userId } = auth.session;
  const body = await req.json().catch(()=>({}));
  const fields: string[] = []; const vals: unknown[] = []; let i=1;
  if (body.name !== undefined) { fields.push(`name = $${++i}`); vals.push(String(body.name).trim()); }
  if (body.category !== undefined) { const c = String(body.category); if (["contract","pleading","letter","other"].includes(c)) { fields.push(`category = $${++i}`); vals.push(c); } }
  if (body.body !== undefined) { fields.push(`body = $${++i}`); vals.push(String(body.body)); }
  if (fields.length===0) return NextResponse.json({ error: "No fields" }, { status:400 });
  fields.push(`"updatedAt" = $${++i}`); vals.push(new Date().toISOString());
  const row = await queryOne(`UPDATE "DocumentTemplate" SET ${fields.join(", ")} WHERE id=$1 AND "firmId"=$${++i} RETURNING *`, [id, ...vals, firmId]);
  if (!row) return NextResponse.json({ error: "Not found" }, { status:404 });
  await recordAuditEvent({ firmId, userId, action: "template_updated", detail: `Template ${id}` });
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId, userId } = auth.session;
  const row = await queryOne(`DELETE FROM "DocumentTemplate" WHERE id=$1 AND "firmId"=$2 RETURNING id`, [id, firmId]);
  if (!row) return NextResponse.json({ error: "Not found" }, { status:404 });
  await recordAuditEvent({ firmId, userId, action: "template_deleted", detail: `Template ${id}` });
  return NextResponse.json({ ok: true });
}
