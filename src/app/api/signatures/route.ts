import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { query, queryOne } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";
import { createDocusignEnvelope, docusignEnabled } from "@/lib/esign";

export async function GET() {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const rows = await query(`SELECT * FROM "SignatureRequest" WHERE "firmId"=$1 ORDER BY "createdAt" DESC`, [auth.session.firmId]);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId, userId } = auth.session;
  const { documentId, documentName, signerName, signerEmail } = await req.json().catch(()=>({}));
  if (!documentId || !signerName?.trim() || !signerEmail?.trim()) return NextResponse.json({ error: "documentId, signerName, signerEmail required" }, { status:400 });
  const token = crypto.randomUUID().replace(/-/g,"");
  const id = `sig_${crypto.randomUUID()}`;
  // DocuSign hook: if configured, create envelope (still store local token for fallback)
  if (docusignEnabled()) { await createDocusignEnvelope({ documentName: documentName || documentId, signerEmail, signerName, documentBase64: "" }); }
  const row = await queryOne(`INSERT INTO "SignatureRequest" (id,"firmId","documentId","documentName","signerName","signerEmail",status,token,"createdAt") VALUES ($1,$2,$3,$4,$5,$6,'pending',$7,$8) RETURNING *`, [id, firmId, documentId, documentName || null, signerName.trim(), signerEmail.trim().toLowerCase(), token, new Date().toISOString()]);
  await recordAuditEvent({ firmId, userId, action: "signature_requested", detail: `Signature for ${documentName || documentId} to ${signerEmail}` });
  return NextResponse.json(row, { status:201 });
}
