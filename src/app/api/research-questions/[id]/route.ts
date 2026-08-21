import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { query, queryOne } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId, userId } = auth.session;
  const { id } = await params;

  const existing = await queryOne<{ id: string; caseId: string }>(
    `SELECT rq.id, rq."caseId" FROM "ResearchQuestion" rq JOIN "LegalCase" lc ON lc.id = rq."caseId" WHERE rq.id = $1 AND lc."firmId" = $2`,
    [id, firmId]
  );
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { answer } = await req.json();
  const row = await queryOne(`UPDATE "ResearchQuestion" SET answered = true, answer = $2 WHERE id = $1 RETURNING *`, [id, answer]);
  await recordAuditEvent({ firmId, userId, action: "research_question_answered", caseId: existing.caseId, detail: `Answered: ${String(answer).slice(0, 80)}` });
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId, userId } = auth.session;
  const { id } = await params;

  const existing = await queryOne<{ id: string; caseId: string }>(
    `SELECT rq.id, rq."caseId" FROM "ResearchQuestion" rq JOIN "LegalCase" lc ON lc.id = rq."caseId" WHERE rq.id = $1 AND lc."firmId" = $2`,
    [id, firmId]
  );
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await query(`DELETE FROM "ResearchQuestion" WHERE id = $1`, [id]);
  await recordAuditEvent({ firmId, userId, action: "research_question_deleted", caseId: existing.caseId, detail: `Deleted research question` });
  return NextResponse.json({ ok: true });
}
