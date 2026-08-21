import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { query, queryOne } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; evidenceId: string }> }) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId, userId } = auth.session;
  const { id: caseId, evidenceId } = await params;

  const ev = await queryOne<{ id: string; label: string; kind: string }>(
    `SELECT e.id, e.label, e.kind FROM "Evidence" e
     JOIN "LegalCase" lc ON lc.id = e."caseId"
     WHERE e.id = $1 AND e."caseId" = $2 AND lc."firmId" = $3`,
    [evidenceId, caseId, firmId]
  );
  if (!ev) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await query(`DELETE FROM "Evidence" WHERE id = $1`, [evidenceId]);
  await recordAuditEvent({
    firmId,
    userId,
    action: "evidence_deleted",
    caseId,
    detail: `Evidence deleted: ${ev.label} (${ev.kind})`,
  });
  return NextResponse.json({ ok: true });
}
