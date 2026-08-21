import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { queryOne } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId, userId } = auth.session;

  const { id, caseId, description, minutes, rate, billed } = await req.json();
  if (!caseId) return NextResponse.json({ error: "caseId required" }, { status: 400 });
  if (!description || !String(description).trim()) return NextResponse.json({ error: "description required" }, { status: 400 });
  if (!Number.isFinite(Number(minutes)) || Number(minutes) <= 0) return NextResponse.json({ error: "minutes must be > 0" }, { status: 400 });
  if (!Number.isFinite(Number(rate)) || Number(rate) < 0) return NextResponse.json({ error: "rate must be >= 0" }, { status: 400 });

  const owned = await queryOne(`SELECT id FROM "LegalCase" WHERE id = $1 AND "firmId" = $2`, [caseId, firmId]);
  if (!owned) return NextResponse.json({ error: "Case not found" }, { status: 404 });

  const row = await queryOne(
    `INSERT INTO "TimeEntry" (id, "caseId", "userId", description, minutes, rate, billed) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [id ?? `time_${crypto.randomUUID()}`, caseId, userId, String(description).trim(), Math.floor(Number(minutes)), Number(rate), !!billed]
  );
  await recordAuditEvent({ firmId, userId, action: "time_logged", caseId, detail: `Logged ${minutes} min — ${description}` });
  return NextResponse.json(row);
}
