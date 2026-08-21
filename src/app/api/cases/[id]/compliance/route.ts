import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { queryOne } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId, userId } = auth.session;
  const { id: caseId } = await params;

  const owned = await queryOne(`SELECT id FROM "LegalCase" WHERE id = $1 AND "firmId" = $2`, [caseId, firmId]);
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { id, label, dueDate, done } = await req.json();
  const row = await queryOne(
    `INSERT INTO "ComplianceItem" (id, "caseId", label, "dueDate", done) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [id, caseId, label, dueDate, done ?? false]
  );
  await recordAuditEvent({ firmId, userId, action: "compliance_added", caseId, detail: `Checklist item added: ${label}` });
  return NextResponse.json(row);
}
