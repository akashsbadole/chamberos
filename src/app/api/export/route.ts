import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { query } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";

export async function GET(req: Request) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId, userId } = auth.session;
  const url = new URL(req.url);
  const format = url.searchParams.get("format") ?? "json"; // json | csv
  const [clients, cases, events, timeEntries, evidence, grievances] = await Promise.all([
    query(`SELECT * FROM "Client" WHERE "firmId" = $1`, [firmId]),
    query(`SELECT * FROM "LegalCase" WHERE "firmId" = $1`, [firmId]),
    query(`SELECT * FROM "CalendarEvent" WHERE "firmId" = $1`, [firmId]),
    query(`SELECT te.* FROM "TimeEntry" te JOIN "LegalCase" lc ON lc.id=te."caseId" WHERE lc."firmId"=$1`, [firmId]),
    query(`SELECT ev.* FROM "Evidence" ev JOIN "LegalCase" lc ON lc.id=ev."caseId" WHERE lc."firmId"=$1`, [firmId]),
    query(`SELECT g.* FROM "Grievance" g JOIN "Client" c ON c.id=g."clientId" WHERE c."firmId"=$1`, [firmId]),
  ]);
  await recordAuditEvent({ firmId, userId, action: "data_exported", detail: `Export ${format}` });
  if (format === "csv") {
    // Minimal CSV for clients as example; clients can extend
    const header = "id,name,email,phone,matterType,status\n";
    const rows = (clients as Record<string,unknown>[]).map(c => `${c.id},"${String(c.name).replace(/"/g,'""')}",${c.email},${c.phone},${c.matterType},${c.status}`).join("\n");
    return new NextResponse(header + rows, { headers: { "content-type": "text/csv", "content-disposition": "attachment; filename=clients.csv" } });
  }
  return NextResponse.json({ clients, cases, events, timeEntries, evidence, grievances, exportedAt: new Date().toISOString() });
}
