import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { queryOne } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId, userId } = auth.session;
  const { id: caseId } = await params;

  const owned = await queryOne(`SELECT id FROM "LegalCase" WHERE id = $1 AND "firmId" = $2`, [caseId, firmId]);
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { id, title, recordedAt, transcript, summary, actionItems } = await req.json();
  const row = await queryOne(
    `INSERT INTO "MeetingNote" (id, "caseId", title, "recordedAt", transcript, summary, "actionItems") VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [id, caseId, title, recordedAt ?? new Date().toISOString(), transcript, summary, actionItems ?? []]
  );
  // Meeting transcripts are also indexed as a case document, same as before,
  // so AI Chat can be grounded in them.
  const docId = `doc_${id}`;
  const docRow = await queryOne(
    `INSERT INTO "CaseDocument" (id, "caseId", name, content, "uploadedAt") VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [docId, caseId, `Meeting — ${title}`, transcript, recordedAt ?? new Date().toISOString()]
  );
  await recordAuditEvent({ firmId, userId, action: "meeting_transcribed", caseId, detail: `Meeting recorded: ${title}` });
  return NextResponse.json({ meeting: row, document: docRow });
}
