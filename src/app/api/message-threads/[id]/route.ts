import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { query, queryOne } from "@/lib/db";
import { encryptPII, decryptPII } from "@/lib/server-crypto";
import { recordAuditEvent } from "@/lib/audit";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const thread = await queryOne(`SELECT * FROM "MessageThread" WHERE id=$1 AND "firmId"=$2`, [id, auth.session.firmId]);
  if (!thread) return NextResponse.json({ error:"Not found"},{status:404});
  const msgs = await query(`SELECT * FROM "Message" WHERE "threadId"=$1 ORDER BY "createdAt" ASC LIMIT 200`, [id]);
  const dec = (msgs as unknown as Record<string,unknown>[]).map(m=> ({...m, body: typeof (m as Record<string,unknown>).body==="string" ? (decryptPII((m as Record<string,unknown>).body as string) ?? (m as Record<string,unknown>).body) : (m as Record<string,unknown>).body }));
  return NextResponse.json({ thread, messages: dec });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { body, sender } = await req.json().catch(()=>({}));
  if (!body?.trim()) return NextResponse.json({ error:"body required"},{status:400});
  const thread = await queryOne(`SELECT * FROM "MessageThread" WHERE id=$1 AND "firmId"=$2`, [id, auth.session.firmId]);
  if (!thread) return NextResponse.json({ error:"Not found"},{status:404});
  const enc = encryptPII(body.trim()) ?? body.trim();
  const s = sender==="client" ? "client" : "firm";
  const msg = await queryOne(`INSERT INTO "Message" (id,"threadId",sender,"senderId",body,"createdAt") VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, [`msg_${crypto.randomUUID()}`, id, s, auth.session.userId, enc, new Date().toISOString()]) as Record<string,unknown> | null;
  await queryOne(`UPDATE "MessageThread" SET "updatedAt"=$1 WHERE id=$2`, [new Date().toISOString(), id]);
  await recordAuditEvent({ firmId: auth.session.firmId, userId: auth.session.userId, action:"message_sent", detail:`Reply in thread ${id}` });
  // decrypt before return
  const decBody = msg && typeof (msg as Record<string,unknown>).body === "string" ? (decryptPII((msg as Record<string,unknown>).body as string) ?? (msg as Record<string,unknown>).body) : (msg as Record<string,unknown>)?.body;
  return NextResponse.json({ ...(msg as object), body: decBody }, {status:201});
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const row = await queryOne(`DELETE FROM "MessageThread" WHERE id=$1 AND "firmId"=$2 RETURNING id`, [id, auth.session.firmId]);
  if (!row) return NextResponse.json({ error:"Not found"},{status:404});
  await recordAuditEvent({ firmId: auth.session.firmId, userId: auth.session.userId, action:"thread_deleted", detail:`Thread ${id}` });
  return NextResponse.json({ ok:true });
}
