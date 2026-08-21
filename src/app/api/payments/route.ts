import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { query, queryOne } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";
import { createStripeCheckout, stripeEnabled } from "@/lib/payments";
import { pushPaymentToAccounting } from "@/lib/accounting";

export async function GET() {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const rows = await query(`SELECT p.*, i.number as invoiceNumber FROM "Payment" p LEFT JOIN "Invoice" i ON i.id=p."invoiceId" WHERE p."firmId"=$1 ORDER BY p."createdAt" DESC LIMIT 200`, [auth.session.firmId]);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId, userId } = auth.session;
  const { invoiceId, amount, method, currency } = await req.json().catch(()=>({}));
  if (!amount || isNaN(Number(amount))) return NextResponse.json({ error:"amount required"},{status:400});
  const m = ["stripe","paypal","upi","cash","trust"].includes(method) ? method : "cash";
  if (m==="stripe" && stripeEnabled()) {
    const checkout = await createStripeCheckout(Number(amount), currency||"inr", invoiceId);
    if (checkout?.url) return NextResponse.json({ checkoutUrl: checkout.url, stripe:true });
  }
  // Manual / fallback — record payment
  const id = `pay_${crypto.randomUUID()}`;
  const row = await queryOne(`INSERT INTO "Payment" (id,"firmId","invoiceId",amount,method,status,"createdAt") VALUES ($1,$2,$3,$4,$5,'succeeded',$6) RETURNING *`, [id, firmId, invoiceId||null, Number(amount), m, new Date().toISOString()]);
  if (invoiceId) {
    // If invoice total paid, mark paid
    const inv = await queryOne(`SELECT total FROM "Invoice" WHERE id=$1 AND "firmId"=$2`, [invoiceId, firmId]) as {total:string}|null;
    if (inv) {
      const paid = (await query(`SELECT COALESCE(SUM(amount),0) as s FROM "Payment" WHERE "invoiceId"=$1 AND status='succeeded'`, [invoiceId]) as {s:string}[])[0];
      if (Number(paid.s) >= Number(inv.total)) await queryOne(`UPDATE "Invoice" SET status='paid', "updatedAt"=$1 WHERE id=$2`, [new Date().toISOString(), invoiceId]);
    }
  }
  await recordAuditEvent({ firmId, userId, action:"payment_recorded", detail:`Payment ${amount} via ${m} for ${invoiceId||"no invoice"}`});
  pushPaymentToAccounting({ id, amount: Number(amount), invoiceId: invoiceId||undefined }).catch(()=>{});
  return NextResponse.json(row, {status:201});
}
