import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { query } from "@/lib/db";
import { decryptPII } from "@/lib/server-crypto";

// Single combined fetch of everything the firm's workspace needs on load —
// mirrors the shape src/lib/store.tsx used to read from localStorage, so
// the frontend hook barely changed even though the source is now Postgres.
export async function GET(req: Request) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId } = auth.session;
  const url = new URL(req.url);
  const limit = (v: string | null, def: number, max: number) => {
    const n = v ? parseInt(v, 10) : def;
    if (!Number.isFinite(n) || n <= 0) return def;
    return Math.min(n, max);
  };
  const clientsLimit = limit(url.searchParams.get("clientsLimit") ?? url.searchParams.get("limit"), 500, 1000);
  const casesLimit = limit(url.searchParams.get("casesLimit") ?? url.searchParams.get("limit"), 500, 1000);
  const auditLimit = limit(url.searchParams.get("auditLimit"), 200, 500);
  const only = url.searchParams.get("only"); // comma list e.g. ?only=clients,cases,events
  const want = (k: string) => !only || only.split(",").map((s) => s.trim()).includes(k);

  const [clients, cases, compliance, documents, events, chats, meetingNotes, timeEntries, evidence, grievances, researchQuestions, auditLog] =
    await Promise.all([
      want("clients") ? query(`SELECT * FROM "Client" WHERE "firmId" = $1 ORDER BY "createdAt" DESC LIMIT ${clientsLimit}`, [firmId]) : Promise.resolve([]),
      want("cases") ? query(`SELECT * FROM "LegalCase" WHERE "firmId" = $1 ORDER BY "createdAt" DESC LIMIT ${casesLimit}`, [firmId]) : Promise.resolve([]),
      want("compliance") ? query(`SELECT ci.* FROM "ComplianceItem" ci JOIN "LegalCase" lc ON lc.id = ci."caseId" WHERE lc."firmId" = $1`, [firmId]) : Promise.resolve([]),
      want("documents") ? query(`SELECT cd.* FROM "CaseDocument" cd JOIN "LegalCase" lc ON lc.id = cd."caseId" WHERE lc."firmId" = $1 ORDER BY cd."uploadedAt" DESC`, [firmId]) : Promise.resolve([]),
      want("events") ? query(`SELECT * FROM "CalendarEvent" WHERE "firmId" = $1 ORDER BY "start" ASC LIMIT ${limit(url.searchParams.get("eventsLimit"), 500, 1000)}`, [firmId]) : Promise.resolve([]),
      want("chats") ? query(`SELECT cm.* FROM "ChatMessage" cm JOIN "LegalCase" lc ON lc.id = cm."caseId" WHERE lc."firmId" = $1 ORDER BY cm."timestamp" ASC LIMIT 500`, [firmId]) : Promise.resolve([]),
      want("meetings") ? query(`SELECT mn.* FROM "MeetingNote" mn JOIN "LegalCase" lc ON lc.id = mn."caseId" WHERE lc."firmId" = $1 ORDER BY mn."recordedAt" DESC LIMIT 200`, [firmId]) : Promise.resolve([]),
      want("timeEntries") ? query(`SELECT te.* FROM "TimeEntry" te JOIN "LegalCase" lc ON lc.id = te."caseId" WHERE lc."firmId" = $1 ORDER BY te."createdAt" DESC LIMIT 500`, [firmId]) : Promise.resolve([]),
      want("evidence") ? query(`SELECT ev.* FROM "Evidence" ev JOIN "LegalCase" lc ON lc.id = ev."caseId" WHERE lc."firmId" = $1 ORDER BY ev."addedAt" DESC LIMIT 500`, [firmId]) : Promise.resolve([]),
      want("grievances") ? query(`SELECT g.* FROM "Grievance" g JOIN "Client" c ON c.id = g."clientId" WHERE c."firmId" = $1 ORDER BY g."submittedAt" DESC LIMIT 200`, [firmId]) : Promise.resolve([]),
      want("research") ? query(`SELECT rq.* FROM "ResearchQuestion" rq JOIN "LegalCase" lc ON lc.id = rq."caseId" WHERE lc."firmId" = $1 LIMIT 500`, [firmId]) : Promise.resolve([]),
      query(`SELECT * FROM "AuditEvent" WHERE "firmId" = $1 ORDER BY "timestamp" DESC LIMIT ${auditLimit}`, [firmId]),
    ]);

  // Nest compliance + documents onto their parent case, matching the shape
  // src/lib/types.ts expects (LegalCase.compliance[], LegalCase.documents[]).
  const casesWithChildren = (cases as Record<string, unknown>[]).map((c) => ({
    ...c,
    compliance: (compliance as Record<string, unknown>[]).filter((i) => i.caseId === c.id),
    documents: (documents as Record<string, unknown>[]).filter((d) => d.caseId === c.id),
  }));

  // Decrypt PII fields transparently (handles both plaintext legacy rows and v1: encrypted rows)
  const decClients = (clients as Record<string, unknown>[]).map((c) => ({
    ...c,
    notes: typeof c.notes === "string" ? decryptPII(c.notes as string) : c.notes,
  }));
  const decMeetingNotes = (meetingNotes as Record<string, unknown>[]).map((m) => ({
    ...m,
    transcript: typeof m.transcript === "string" ? decryptPII(m.transcript as string) ?? m.transcript : m.transcript,
    summary: typeof m.summary === "string" ? decryptPII(m.summary as string) ?? m.summary : m.summary,
  }));
  const decEvidence = (evidence as Record<string, unknown>[]).map((e) => ({
    ...e,
    content: typeof e.content === "string" ? decryptPII(e.content as string) ?? e.content : e.content,
    description: typeof e.description === "string" ? decryptPII(e.description as string) ?? e.description : e.description,
  }));

  return NextResponse.json({
    clients: decClients,
    cases: casesWithChildren,
    events,
    chats,
    meetingNotes: decMeetingNotes,
    timeEntries,
    evidence: decEvidence,
    grievances,
    researchQuestions,
    auditLog,
  });
}
