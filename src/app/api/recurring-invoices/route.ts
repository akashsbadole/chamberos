import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { query, queryOne } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";

export async function GET() {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const rows = await query(`SELECT * FROM "RecurringInvoice" WHERE "firmId"=$1 ORDER BY "nextRunAt" ASC`, [auth.session.firmId]);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId, userId } = auth.session;
  const { caseId, clientId, cadence, lineItems, taxRate, nextRunAt } = await req.json().catch(()=>({}));
  if (!Array.isArray(lineItems) || lineItems.length===0) return NextResponse.json({ error:"lineItems required"},{status:400});
  if (!["weekly","monthly","quarterly","yearly"].includes(cadence)) return NextResponse.json({ error:"Invalid cadence"},{status:400});
  const id = `rec_${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const next = nextRunAt ? new Date(nextRunAt).toISOString() : new Date(Date.now()+30*24*3600*1000).toISOString();
  const row = await queryOne(`INSERT INTO "RecurringInvoice" (id,"firmId","caseId","clientId",cadence,"lineItems","taxRate","nextRunAt","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9) RETURNING *`, [id, firmId, caseId||null, clientId||null, cadence, JSON.stringify(lineItems), taxRate?String(taxRate):null, next, now]);
  await recordAuditEvent({ firmId, userId, action:"recurring_invoice_created", detail:`Recurring ${cadence} ${id}` });
  return NextResponse.json(row,{status:201});
}
