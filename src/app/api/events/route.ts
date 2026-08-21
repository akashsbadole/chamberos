import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { queryOne } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId, userId } = auth.session;

  const { id, caseId, title, start, end, type, location, meetingLink, description } = await req.json();
  // Video hook: if meeting and no link but VIDEO_PROVIDER set, could auto-create (call createVideoMeeting)
  const row = await queryOne(
    `INSERT INTO "CalendarEvent" (id, "firmId", "caseId", title, start, "end", type, location, "meetingLink", description) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [id, firmId, caseId || null, title, start, end, type, location || null, meetingLink || null, description || null]
  );
  await recordAuditEvent({ firmId, userId, action: "event_scheduled", caseId: caseId || null, detail: `Scheduled: ${title}` });
  return NextResponse.json(row);
}
