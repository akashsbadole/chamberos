import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { queryOne } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";
import { encryptPII } from "@/lib/server-crypto";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId, userId } = auth.session;
  const { id: caseId } = await params;

  const owned = await queryOne(`SELECT id FROM "LegalCase" WHERE id = $1 AND "firmId" = $2`, [caseId, firmId]);
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { id, label, source, description, collectedDate, addedAt, kind, content } = await req.json();
  if (!label) return NextResponse.json({ error: "label required" }, { status: 400 });
  const encDesc = description ? encryptPII(String(description)) : null;
  const encContent = content ? encryptPII(String(content)) : null;
  const row = await queryOne(
    `INSERT INTO "Evidence" (id, "caseId", label, source, description, "collectedDate", "addedAt", kind, content)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [id ?? `ev_item_${crypto.randomUUID()}`, caseId, String(label), source || null, encDesc, collectedDate ? new Date(collectedDate).toISOString() : new Date().toISOString(), addedAt ?? new Date().toISOString(), kind ?? "other", encContent]
  );
  await recordAuditEvent({ firmId, userId, action: "evidence_added", caseId, detail: `Evidence logged: ${label} (${kind})` });
  return NextResponse.json(row);
}
