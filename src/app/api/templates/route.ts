import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { query, queryOne } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";

export async function GET() {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId } = auth.session;
  const rows = await query(`SELECT * FROM "DocumentTemplate" WHERE "firmId"=$1 ORDER BY "createdAt" DESC`, [firmId]);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId, userId } = auth.session;
  const { name, category, body } = await req.json().catch(()=>({}));
  if (!name?.trim() || !body?.trim()) return NextResponse.json({ error: "name and body required" }, { status: 400 });
  const cat = ["contract","pleading","letter","other"].includes(category) ? category : "other";
  const id = `tmpl_${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const row = await queryOne(`INSERT INTO "DocumentTemplate" (id,"firmId",name,category,body,"createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$6) RETURNING *`, [id, firmId, name.trim(), cat, body, now]);
  await recordAuditEvent({ firmId, userId, action: "template_created", detail: `Template ${name} (${cat})` });
  return NextResponse.json(row, { status: 201 });
}
