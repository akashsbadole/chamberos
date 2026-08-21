import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { query, queryOne } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
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

  const row = await queryOne(`UPDATE "ComplianceItem" SET done = NOT done WHERE id = $1 RETURNING *`, [id]);
  await recordAuditEvent({
    firmId,
    userId,
    action: item.done ? "compliance_reopened" : "compliance_completed",
    caseId: item.caseId,
    detail: `${item.done ? "Reopened" : "Completed"}: ${item.label}`,
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
