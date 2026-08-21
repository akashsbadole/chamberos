import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { query, queryOne } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";
import { pushInvoiceToAccounting } from "@/lib/accounting";
import { sendEmail } from "@/lib/email";

export async function GET() {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const rows = await query(`SELECT * FROM "Invoice" WHERE "firmId"=$1 ORDER BY "createdAt" DESC LIMIT 200`, [auth.session.firmId]);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId, userId } = auth.session;
  const { caseId, clientId, lineItems, taxRate, dueDate, status } = await req.json().catch(()=>({}));
  if (!Array.isArray(lineItems) || lineItems.length===0) return NextResponse.json({ error: "lineItems required" }, { status:400 });
  const subtotal = lineItems.reduce((s:number, l:{amount:number})=> s + Number(l.amount||0), 0);
  const tax = taxRate ? subtotal * Number(taxRate)/100 : 0;
  const total = subtotal + tax;
  const count = (await query(`SELECT COUNT(*) as c FROM "Invoice" WHERE "firmId"=$1`, [firmId]) as {c:string}[])[0];
  const n = Number(count.c) + 1;
  const number = `INV-${new Date().getFullYear()}-${String(n).padStart(4,"0")}`;
  const id = `inv_${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const row = await queryOne(`INSERT INTO "Invoice" (id,"firmId","caseId","clientId",number,status,"lineItems",subtotal,"taxRate",total,"dueDate","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$12) RETURNING *`, [id, firmId, caseId||null, clientId||null, number, status||"draft", JSON.stringify(lineItems), subtotal, taxRate?String(taxRate):null, total, dueDate||null, now]);
  await recordAuditEvent({ firmId, userId, action: "invoice_created", detail: `Invoice ${number} ${total}` });
  // Hooks: accounting + email (best-effort, no await blocking)
  pushInvoiceToAccounting({ id, number, total, clientId: clientId||undefined }).catch(()=>{});
  if (clientId) {
    query(`SELECT email FROM "Client" WHERE id=$1 AND "firmId"=$2`, [clientId, firmId]).then(rows=>{
      const email = (rows as {email:string}[])[0]?.email;
      if(email) sendEmail({ to: email, subject: `Invoice ${number} — ₹${Number(total).toLocaleString("en-IN")}`, html: `<p>Invoice ${number} for ₹${Number(total).toLocaleString("en-IN")} is ready.</p>`, firmId, userId }).catch(()=>{});
    }).catch(()=>{});
  }
  return NextResponse.json(row, { status:201 });
}
