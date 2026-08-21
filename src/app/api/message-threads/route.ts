import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { query, queryOne } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";
import { encryptPII, decryptPII } from "@/lib/server-crypto";

export async function GET() {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const threads = await query(`SELECT t.*, c.name as clientName FROM "MessageThread" t LEFT JOIN "Client" c ON c.id=t."clientId" WHERE t."firmId"=$1 ORDER BY t."updatedAt" DESC LIMIT 100`, [auth.session.firmId]);
  // include last message preview
  for (const t of threads as Record<string,unknown>[]) {
    const last = await queryOne(`SELECT body, "createdAt", sender FROM "Message" WHERE "threadId"=$1 ORDER BY "createdAt" DESC LIMIT 1`, [t.id]) as Record<string,unknown> | null;
    if (last && typeof (last as Record<string,unknown>).body === "string") (t as Record<string,unknown>).lastBody = decryptPII((last as Record<string,unknown>).body as string) ?? (last as Record<string,unknown>).body;
    (t as Record<string,unknown>).lastMeta = last;
  }
  return NextResponse.json(threads);
}

export async function POST(req: NextRequest) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId, userId } = auth.session;
  const { clientId, caseId, subject, body } = await req.json().catch(()=>({}));
  if (!clientId) return NextResponse.json({ error:"clientId required"},{status:400});
  if (!body?.trim()) return NextResponse.json({ error:"body required"},{status:400});
  const now = new Date().toISOString();
  const threadId = `thr_${crypto.randomUUID()}`;
  const encBody = encryptPII(body.trim()) ?? body.trim();
  await queryOne(`INSERT INTO "MessageThread" (id,"firmId","clientId","caseId",subject,"createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$6) RETURNING *`, [threadId, firmId, clientId, caseId||null, subject?.trim()||null, now]);
  await queryOne(`INSERT INTO "Message" (id,"threadId",sender,"senderId",body,"createdAt") VALUES ($1,$2,'firm',$3,$4,$5) RETURNING *`, [`msg_${crypto.randomUUID()}`, threadId, userId, encBody, now]);
  await recordAuditEvent({ firmId, userId, action:"message_sent", detail:`Message to client ${clientId}` });
  const thread = await queryOne(`SELECT * FROM "MessageThread" WHERE id=$1`, [threadId]);
  return NextResponse.json(thread, {status:201});
}
