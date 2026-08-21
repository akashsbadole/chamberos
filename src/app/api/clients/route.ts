import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { queryOne } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId, userId } = auth.session;

  const body = await req.json();
  const { id, name, email, phone, matterType, status, conflictChecked, conflictFlags, kycVerified, engagementSigned, notes } = body;

  const row = await queryOne(
    `INSERT INTO "Client" (id, "firmId", name, email, phone, "matterType", status, "conflictChecked", "conflictFlags", "kycVerified", "engagementSigned", notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [id, firmId, name, email, phone, matterType, status, conflictChecked, conflictFlags ?? [], kycVerified, engagementSigned, notes ?? null]
  );

  await recordAuditEvent({ firmId, userId, action: "client_onboarded", clientId: id, detail: `Client onboarded: ${name}` });

  return NextResponse.json(row);
}
