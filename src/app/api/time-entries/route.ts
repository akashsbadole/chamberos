import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { queryOne } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId, userId } = auth.session;

  const { id, caseId, description, minutes, rate, billed } = await req.json();

  const owned = await queryOne(`SELECT id FROM "LegalCase" WHERE id = $1 AND "firmId" = $2`, [caseId, firmId]);
  if (!owned) return NextResponse.json({ error: "Case not found" }, { status: 404 });

  const row = await queryOne(
    `INSERT INTO "TimeEntry" (id, "caseId", "userId", description, minutes, rate, billed) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [id, caseId, userId, description, minutes, rate, billed ?? false]
  );
  await recordAuditEvent({ firmId, userId, action: "time_logged", caseId, detail: `Logged ${minutes} min — ${description}` });
  return NextResponse.json(row);
}
