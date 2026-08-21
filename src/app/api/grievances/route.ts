import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { queryOne } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId, userId } = auth.session;

  const { id, clientId, caseId, subject, message } = await req.json();

  const owned = await queryOne(`SELECT id FROM "Client" WHERE id = $1 AND "firmId" = $2`, [clientId, firmId]);
  if (!owned) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const row = await queryOne(
    `INSERT INTO "Grievance" (id, "clientId", "caseId", subject, message, status) VALUES ($1,$2,$3,$4,$5,'open') RETURNING *`,
    [id, clientId, caseId || null, subject, message]
  );
  await recordAuditEvent({ firmId, userId, action: "grievance_raised", caseId: caseId || null, clientId, detail: `Grievance raised: ${subject}` });
  return NextResponse.json(row);
}
