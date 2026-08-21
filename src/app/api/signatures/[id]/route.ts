import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { queryOne } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const row = await queryOne(`DELETE FROM "SignatureRequest" WHERE id=$1 AND "firmId"=$2 RETURNING id`, [id, auth.session.firmId]);
  if (!row) return NextResponse.json({ error: "Not found" }, { status:404 });
  await recordAuditEvent({ firmId: auth.session.firmId, userId: auth.session.userId, action: "signature_cancelled", detail: `Signature ${id}` });
  return NextResponse.json({ ok:true });
}
