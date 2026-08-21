import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";
import { pushInvoiceToAccounting } from "@/lib/accounting";

function nextRun(cadence: string, from: Date): Date {
  const d = new Date(from);
  switch (cadence) {
    case "weekly": d.setDate(d.getDate()+7); break;
    case "monthly": d.setMonth(d.getMonth()+1); break;
    case "quarterly": d.setMonth(d.getMonth()+3); break;
    case "yearly": d.setFullYear(d.getFullYear()+1); break;
    default: d.setMonth(d.getMonth()+1);
  }
  return d;
}

export async function GET(req: NextRequest) {
  // Protect with CRON_SECRET if set (Vercel Cron, etc.)
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}` && req.nextUrl.searchParams.get("secret") !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  const now = new Date();
  const rows = await query(`SELECT * FROM "RecurringInvoice" WHERE active=true AND "nextRunAt" <= $1`, [now.toISOString()]) as { id:string; firmId:string; caseId?:string; clientId?:string; cadence:string; lineItems:unknown; taxRate?:string; nextRunAt:string }[];
  let created = 0;
  for (const r of rows) {
    const lineItems = typeof r.lineItems === "string" ? JSON.parse(r.lineItems as string) : r.lineItems as {amount:number}[];
    const subtotal = (lineItems as {amount:number}[]).reduce((s, l)=> s+Number(l.amount||0),0);
    const tax = r.taxRate ? subtotal * Number(r.taxRate)/100 : 0;
    const total = subtotal + tax;
    const count = (await query(`SELECT COUNT(*) as c FROM "Invoice" WHERE "firmId"=$1`, [r.firmId]) as {c:string}[])[0];
    const n = Number(count.c) + 1 + created;
    const number = `INV-${now.getFullYear()}-${String(n).padStart(4,"0")}`;
    const id = `inv_${crypto.randomUUID()}`;
    const iso = now.toISOString();
    try {
      await queryOne(`INSERT INTO "Invoice" (id,"firmId","caseId","clientId",number,status,"lineItems",subtotal,"taxRate",total,"dueDate","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,'draft',$6,$7,$8,$9,$10,$11,$11) RETURNING id`, [id, r.firmId, r.caseId||null, r.clientId||null, number, JSON.stringify(lineItems), subtotal, r.taxRate?String(r.taxRate):null, total, null, iso]);
      const nxt = nextRun(r.cadence, new Date(r.nextRunAt));
      await queryOne(`UPDATE "RecurringInvoice" SET "lastRunAt"=$1, "nextRunAt"=$2, "updatedAt"=$1 WHERE id=$3`, [iso, nxt.toISOString(), r.id]);
      await recordAuditEvent({ firmId: r.firmId, userId: null, action: "recurring_invoice_generated", detail: `Recurring ${r.id} → Invoice ${number}` });
      pushInvoiceToAccounting({ id, number, total, clientId: r.clientId||undefined }).catch(()=>{});
      created++;
    } catch (e) { console.error("[cron:recurring] failed for", r.id, e); }
  }
  return NextResponse.json({ ok: true, evaluated: rows.length, created });
}

export async function POST(req: NextRequest) { return GET(req); }
