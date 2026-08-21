import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { query, queryOne } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; docId: string }> }) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId, userId } = auth.session;
  const { id: caseId, docId } = await params;

  const doc = await queryOne<{ id: string; name: string }>(
    `SELECT cd.id, cd.name FROM "CaseDocument" cd
     JOIN "LegalCase" lc ON lc.id = cd."caseId"
     WHERE cd.id = $1 AND cd."caseId" = $2 AND lc."firmId" = $3`,
    [docId, caseId, firmId]
  );
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await query(`DELETE FROM "CaseDocument" WHERE id = $1`, [docId]);
  await recordAuditEvent({
    firmId,
    userId,
    action: "document_deleted",
    caseId,
    detail: `Document deleted: ${doc.name}`,
  });
  return NextResponse.json({ ok: true });
}
