import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { queryOne, withTransaction } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";
import { encryptPII } from "@/lib/server-crypto";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId, userId } = auth.session;
  const { id: caseId } = await params;

  const owned = await queryOne(`SELECT id FROM "LegalCase" WHERE id = $1 AND "firmId" = $2`, [caseId, firmId]);
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { id, title, recordedAt, transcript, summary, actionItems, saveAsDocument = true } = body;
  if (!title || !transcript || !summary) return NextResponse.json({ error: "title, transcript and summary required" }, { status: 400 });
  const meetingId = id ?? `meet_${crypto.randomUUID()}`;
  const docId = `doc_${meetingId}`;
  const encTranscript = encryptPII(String(transcript));
  const encSummary = encryptPII(String(summary));
  const { row, docRow } = await withTransaction(async (tx) => {
    const r = await tx.queryOne(
      `INSERT INTO "MeetingNote" (id, "caseId", title, "recordedAt", transcript, summary, "actionItems") VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [meetingId, caseId, String(title), recordedAt ?? new Date().toISOString(), encTranscript, encSummary, Array.isArray(actionItems) ? actionItems : []]
    );
    let dRow: unknown = null;
    if (saveAsDocument) {
      dRow = await tx.queryOne(
        `INSERT INTO "CaseDocument" (id, "caseId", name, content, "uploadedAt") VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [docId, caseId, `Meeting — ${title}`, transcript, recordedAt ?? new Date().toISOString()]
      );
    }
    return { row: r, docRow: dRow };
  });
  await recordAuditEvent({ firmId, userId, action: "meeting_transcribed", caseId, detail: `Meeting recorded: ${title}${saveAsDocument ? " + doc" : ""}` });
  return NextResponse.json({ meeting: row, document: docRow });
}
