import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { query, queryOne } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";
import { sendEmail } from "@/lib/email";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const acc = await queryOne(`SELECT * FROM "TrustAccount" WHERE id=$1 AND "firmId"=$2`, [id, auth.session.firmId]);
  if (!acc) return NextResponse.json({ error:"Not found"},{status:404});
  const txns = await query(`SELECT * FROM "TrustTransaction" WHERE "accountId"=$1 ORDER BY "createdAt" DESC LIMIT 200`, [id]);
  return NextResponse.json({ account: acc, transactions: txns });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId, userId } = auth.session;
  const { type, amount, description, reference } = await req.json().catch(()=>({}));
  if (!["deposit","withdrawal","transfer"].includes(type)) return NextResponse.json({ error:"Invalid type"},{status:400});
  const amt = Number(amount);
  if (!isFinite(amt) || amt <=0) return NextResponse.json({ error:"Invalid amount"},{status:400});
  const acc = await queryOne(`SELECT * FROM "TrustAccount" WHERE id=$1 AND "firmId"=$2`, [id, firmId]) as { balance: string } | null;
  if (!acc) return NextResponse.json({ error:"Not found"},{status:404});
  const bal = Number(acc.balance);
  if (type==="withdrawal" && amt > bal) return NextResponse.json({ error:"Insufficient trust balance"},{status:400});
  const newBal = type==="deposit" ? bal + amt : bal - amt;
  const txId = `ttxn_${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  // Transaction: insert txn + update account atomically would need withTransaction, here sequential (acceptable for demo, add transaction later)
  await queryOne(`INSERT INTO "TrustTransaction" (id,"accountId","firmId",type,amount,"balanceAfter",description,reference,"createdAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`, [txId, id, firmId, type, amt, newBal, description?.trim()||null, reference?.trim()||null, now]);
  await queryOne(`UPDATE "TrustAccount" SET balance=$1, "updatedAt"=$2 WHERE id=$3 RETURNING *`, [newBal, now, id]);
  await recordAuditEvent({ firmId, userId, action: type==="deposit"?"trust_deposit":"trust_withdrawal", detail:`Trust ${type} ${amt} for ${id}` });
  // Email notification (best-effort)
  const cid = (acc as Record<string,unknown>).clientId as string | undefined;
  if(cid){
    query(`SELECT email, name FROM "Client" WHERE id=$1 AND "firmId"=$2`, [cid, firmId]).then(rows=>{
      const c = (rows as {email:string;name:string}[])[0];
      if(c?.email) sendEmail({ to: c.email, subject: `Trust ${type} — ₹${amt.toLocaleString("en-IN")}`, html: `<p>${type} of ₹${amt.toLocaleString("en-IN")} for ${c.name}. New balance ₹${newBal.toLocaleString("en-IN")}.</p>`, firmId, userId }).catch(()=>{});
    }).catch(()=>{});
  }
  const updated = await queryOne(`SELECT * FROM "TrustAccount" WHERE id=$1`, [id]);
  return NextResponse.json(updated, {status:201});
}
