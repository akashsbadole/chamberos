import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { queryOne } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId, userId } = auth.session;

  const { id, caseId, title, start, end, type, location } = await req.json();
  const row = await queryOne(
    `INSERT INTO "CalendarEvent" (id, "firmId", "caseId", title, start, "end", type, location) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [id, firmId, caseId || null, title, start, end, type, location || null]
  );
  await recordAuditEvent({ firmId, userId, action: "event_scheduled", caseId: caseId || null, detail: `Scheduled: ${title}` });
  return NextResponse.json(row);
}
