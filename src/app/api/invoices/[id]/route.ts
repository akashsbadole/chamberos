import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { queryOne } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { status, dueDate } = await req.json().catch(()=>({}));
  const allowed = ["draft","sent","paid","void"];
  const fields:string[]=[]; const vals:unknown[]=[]; let i=1;
  if(status !== undefined){ if(!allowed.includes(status)) return NextResponse.json({ error:"Invalid status"},{status:400}); fields.push(`status = $${++i}`); vals.push(status); }
  if(dueDate !== undefined){ fields.push(`"dueDate" = $${++i}`); vals.push(dueDate? new Date(dueDate).toISOString(): null); }
  if(fields.length===0) return NextResponse.json({ error:"No fields"},{status:400});
  fields.push(`"updatedAt" = $${++i}`); vals.push(new Date().toISOString());
  const row = await queryOne(`UPDATE "Invoice" SET ${fields.join(", ")} WHERE id=$1 AND "firmId"=$${++i} RETURNING *`, [id, ...vals, auth.session.firmId]);
  if(!row) return NextResponse.json({ error:"Not found"},{status:404});
  await recordAuditEvent({ firmId: auth.session.firmId, userId: auth.session.userId, action: "invoice_updated", detail: `Invoice ${id} -> ${status}` });
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const row = await queryOne(`DELETE FROM "Invoice" WHERE id=$1 AND "firmId"=$2 RETURNING id`, [id, auth.session.firmId]);
  if(!row) return NextResponse.json({ error:"Not found"},{status:404});
  await recordAuditEvent({ firmId: auth.session.firmId, userId: auth.session.userId, action: "invoice_deleted", detail: `Invoice ${id}` });
  return NextResponse.json({ ok:true });
}
