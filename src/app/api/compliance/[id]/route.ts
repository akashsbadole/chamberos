import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { query, queryOne } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId, userId } = auth.session;
  const { id } = await params;

  const item = await queryOne<{ id: string; caseId: string; label: string; done: boolean }>(
    `SELECT ci.id, ci."caseId", ci.label, ci.done FROM "ComplianceItem" ci
     JOIN "LegalCase" lc ON lc.id = ci."caseId" WHERE ci.id = $1 AND lc."firmId" = $2`,
    [id, firmId]
  );
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: { label?: string; dueDate?: string; done?: boolean } = {};
  try { body = await req.json(); } catch { body = {}; }
  // If no explicit fields, toggle done (backward compat for existing UI)
  if (body.label === undefined && body.dueDate === undefined && body.done === undefined) {
    const row = await queryOne(`UPDATE "ComplianceItem" SET done = NOT done WHERE id = $1 RETURNING *`, [id]);
    await recordAuditEvent({
      firmId, userId,
      action: !item.done ? "compliance_completed" : "compliance_reopened",
      caseId: item.caseId, detail: `${!item.done ? "Completed" : "Reopened"}: ${item.label}`,
    });
    return NextResponse.json(row);
  }
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;
  if (body.label !== undefined) {
    if (!String(body.label).trim()) return NextResponse.json({ error: "label required" }, { status: 400 });
    fields.push(`label = $${++idx}`); values.push(String(body.label).trim());
  }
  if (body.dueDate !== undefined) {
    const d = new Date(body.dueDate);
    if (isNaN(d.getTime())) return NextResponse.json({ error: "invalid dueDate" }, { status: 400 });
    fields.push(`"dueDate" = $${++idx}`); values.push(d.toISOString());
  }
  if (body.done !== undefined) { fields.push(`done = $${++idx}`); values.push(!!body.done); }
  if (fields.length === 0) return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  const row = await queryOne(`UPDATE "ComplianceItem" SET ${fields.join(", ")} WHERE id = $1 RETURNING *`, [id, ...values]);
  await recordAuditEvent({
    firmId, userId,
    action: "compliance_updated",
    caseId: item.caseId,
    detail: `Updated: ${body.label ?? item.label}`,
  });
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId, userId } = auth.session;
  const { id } = await params;

  const item = await queryOne<{ id: string; caseId: string; label: string }>(
    `SELECT ci.id, ci."caseId", ci.label FROM "ComplianceItem" ci
     JOIN "LegalCase" lc ON lc.id = ci."caseId" WHERE ci.id = $1 AND lc."firmId" = $2`,
    [id, firmId]
  );
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await query(`DELETE FROM "ComplianceItem" WHERE id = $1`, [id]);
  await recordAuditEvent({
    firmId,
    userId,
    action: "compliance_deleted",
    caseId: item.caseId,
    detail: `Deleted: ${item.label}`,
  });
  return NextResponse.json({ ok: true });
}
