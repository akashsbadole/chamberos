import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { queryOne } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { active, cadence, nextRunAt } = await req.json().catch(()=>({}));
  const fields:string[]=[]; const vals:unknown[]=[]; let i=1;
  if(active!==undefined){ fields.push(`active = $${++i}`); vals.push(!!active); }
  if(cadence!==undefined){ if(!["weekly","monthly","quarterly","yearly"].includes(cadence)) return NextResponse.json({ error:"Invalid cadence"},{status:400}); fields.push(`cadence = $${++i}`); vals.push(cadence); }
  if(nextRunAt!==undefined){ fields.push(`"nextRunAt" = $${++i}`); vals.push(new Date(nextRunAt).toISOString()); }
  if(fields.length===0) return NextResponse.json({ error:"No fields"},{status:400});
  fields.push(`"updatedAt" = $${++i}`); vals.push(new Date().toISOString());
  const row = await queryOne(`UPDATE "RecurringInvoice" SET ${fields.join(", ")} WHERE id=$1 AND "firmId"=$${++i} RETURNING *`, [id, ...vals, auth.session.firmId]);
  if(!row) return NextResponse.json({ error:"Not found"},{status:404});
  await recordAuditEvent({ firmId: auth.session.firmId, userId: auth.session.userId, action:"recurring_invoice_updated", detail:`Recurring ${id}` });
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const row = await queryOne(`DELETE FROM "RecurringInvoice" WHERE id=$1 AND "firmId"=$2 RETURNING id`, [id, auth.session.firmId]);
  if(!row) return NextResponse.json({ error:"Not found"},{status:404});
  await recordAuditEvent({ firmId: auth.session.firmId, userId: auth.session.userId, action:"recurring_invoice_deleted", detail:`Recurring ${id}` });
  return NextResponse.json({ ok:true });
}
