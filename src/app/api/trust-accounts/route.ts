import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { query, queryOne } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";

export async function GET() {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const rows = await query(`SELECT ta.*, c.name as clientName FROM "TrustAccount" ta LEFT JOIN "Client" c ON c.id=ta."clientId" WHERE ta."firmId"=$1 ORDER BY ta."updatedAt" DESC`, [auth.session.firmId]);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId, userId } = auth.session;
  // Create account if not exists, or deposit/withdraw via /api/trust-accounts/[id]/transactions
  const { clientId } = await req.json().catch(()=>({}));
  if (!clientId) return NextResponse.json({ error:"clientId required"},{status:400});
  const exists = await queryOne(`SELECT * FROM "TrustAccount" WHERE "firmId"=$1 AND "clientId"=$2`, [firmId, clientId]);
  if (exists) return NextResponse.json(exists);
  const id = `trust_${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const row = await queryOne(`INSERT INTO "TrustAccount" (id,"firmId","clientId",balance,"createdAt","updatedAt") VALUES ($1,$2,$3,0,$4,$4) RETURNING *`, [id, firmId, clientId, now]);
  await recordAuditEvent({ firmId, userId, action:"trust_account_created", detail:`Trust account for ${clientId}` });
  return NextResponse.json(row, {status:201});
}
