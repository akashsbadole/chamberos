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

  const { id, name, content, uploadedAt } = await req.json();
  const row = await queryOne(
    `INSERT INTO "CaseDocument" (id, "caseId", name, content, "uploadedAt") VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [id, caseId, name, content, uploadedAt ?? new Date().toISOString()]
  );
  await recordAuditEvent({ firmId, userId, action: "document_added", caseId, detail: `Document added: ${name}` });
  return NextResponse.json(row);
}
