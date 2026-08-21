import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { query } from "@/lib/db";

// Single combined fetch of everything the firm's workspace needs on load —
// mirrors the shape src/lib/store.tsx used to read from localStorage, so
// the frontend hook barely changed even though the source is now Postgres.
export async function GET() {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId } = auth.session;

  const [clients, cases, compliance, documents, events, chats, meetingNotes, timeEntries, evidence, grievances, researchQuestions, auditLog] =
    await Promise.all([
      query(`SELECT * FROM "Client" WHERE "firmId" = $1 ORDER BY "createdAt" DESC`, [firmId]),
      query(`SELECT * FROM "LegalCase" WHERE "firmId" = $1 ORDER BY "createdAt" DESC`, [firmId]),
      query(
        `SELECT ci.* FROM "ComplianceItem" ci JOIN "LegalCase" lc ON lc.id = ci."caseId" WHERE lc."firmId" = $1`,
        [firmId]
      ),
      query(
        `SELECT cd.* FROM "CaseDocument" cd JOIN "LegalCase" lc ON lc.id = cd."caseId" WHERE lc."firmId" = $1 ORDER BY cd."uploadedAt" DESC`,
        [firmId]
      ),
      query(`SELECT * FROM "CalendarEvent" WHERE "firmId" = $1 ORDER BY "start" ASC`, [firmId]),
      query(
        `SELECT cm.* FROM "ChatMessage" cm JOIN "LegalCase" lc ON lc.id = cm."caseId" WHERE lc."firmId" = $1 ORDER BY cm."timestamp" ASC`,
        [firmId]
      ),
      query(
        `SELECT mn.* FROM "MeetingNote" mn JOIN "LegalCase" lc ON lc.id = mn."caseId" WHERE lc."firmId" = $1 ORDER BY mn."recordedAt" DESC`,
        [firmId]
      ),
      query(
        `SELECT te.* FROM "TimeEntry" te JOIN "LegalCase" lc ON lc.id = te."caseId" WHERE lc."firmId" = $1 ORDER BY te."createdAt" DESC`,
        [firmId]
      ),
      query(
        `SELECT ev.* FROM "Evidence" ev JOIN "LegalCase" lc ON lc.id = ev."caseId" WHERE lc."firmId" = $1 ORDER BY ev."addedAt" DESC`,
        [firmId]
      ),
      query(
        `SELECT g.* FROM "Grievance" g JOIN "Client" c ON c.id = g."clientId" WHERE c."firmId" = $1 ORDER BY g."submittedAt" DESC`,
        [firmId]
      ),
      query(
        `SELECT rq.* FROM "ResearchQuestion" rq JOIN "LegalCase" lc ON lc.id = rq."caseId" WHERE lc."firmId" = $1`,
        [firmId]
      ),
      query(`SELECT * FROM "AuditEvent" WHERE "firmId" = $1 ORDER BY "timestamp" DESC LIMIT 200`, [firmId]),
    ]);

  // Nest compliance + documents onto their parent case, matching the shape
  // src/lib/types.ts expects (LegalCase.compliance[], LegalCase.documents[]).
  const casesWithChildren = (cases as Record<string, unknown>[]).map((c) => ({
    ...c,
    compliance: (compliance as Record<string, unknown>[]).filter((i) => i.caseId === c.id),
    documents: (documents as Record<string, unknown>[]).filter((d) => d.caseId === c.id),
  }));

  return NextResponse.json({
    clients,
    cases: casesWithChildren,
    events,
    chats,
    meetingNotes,
    timeEntries,
    evidence,
    grievances,
    researchQuestions,
    auditLog,
  });
}
