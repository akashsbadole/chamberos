import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { putObject } from "@/lib/storage";
import { queryOne } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId, userId } = auth.session;
  const form = await req.formData().catch(()=> null);
  if (!form) return NextResponse.json({ error: "Invalid form" }, { status: 400 });
  const file = form.get("file") as File | null;
  const caseId = form.get("caseId") as string | null;
  if (!file) return NextResponse.json({ error: "file required" }, { status: 400 });
  if (caseId) {
    const owned = await queryOne(`SELECT id FROM "LegalCase" WHERE id=$1 AND "firmId"=$2`, [caseId, firmId]);
    if (!owned) return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  // 10MB limit
  if (bytes.length > 10 * 1024 * 1024) return NextResponse.json({ error: "File too large (10MB max)" }, { status: 413 });
  const key = `${firmId}/${caseId ?? "general"}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,"_")}`;
  const { url } = await putObject(key, bytes, file.type || "application/octet-stream");
  // Also create a CaseDocument pointer if caseId provided (so it appears in matter docs)
  if (caseId) {
    const docId = `doc_${crypto.randomUUID()}`;
    await queryOne(`INSERT INTO "CaseDocument" (id, "caseId", name, content, "uploadedAt") VALUES ($1,$2,$3,$4,$5) RETURNING id`, [docId, caseId, file.name, `File stored: ${url} (${file.type}, ${bytes.length} bytes)`, new Date().toISOString()]);
    await recordAuditEvent({ firmId, userId, action: "file_uploaded", caseId, detail: `Uploaded ${file.name} -> ${key}` });
    return NextResponse.json({ ok: true, key, url, docId });
  }
  await recordAuditEvent({ firmId, userId, action: "file_uploaded", detail: `Uploaded ${file.name} -> ${key}` });
  return NextResponse.json({ ok: true, key, url });
}
