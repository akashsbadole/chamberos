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

  const { id, name, content, uploadedAt, storageKey, mimeType, size } = await req.json();
  // versioning: count existing docs with same name for this case
  const existing = await queryOne(`SELECT COUNT(*) as c FROM "CaseDocument" WHERE "caseId"=$1 AND name=$2`, [caseId, name]) as { c: string } | null;
  const version = existing ? Number(existing.c) + 1 : 1;
  const row = await queryOne(
    `INSERT INTO "CaseDocument" (id, "caseId", name, content, "uploadedAt", "storageKey", "mimeType", size, version) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [id, caseId, name, content ?? "", uploadedAt ?? new Date().toISOString(), storageKey||null, mimeType||null, size?Number(size):null, version]
  );
  await recordAuditEvent({ firmId, userId, action: "document_added", caseId, detail: `Document added: ${name}` });
  return NextResponse.json(row);
}
