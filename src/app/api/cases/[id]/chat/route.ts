import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { queryOne } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId } = auth.session;
  const { id: caseId } = await params;

  const owned = await queryOne(`SELECT id FROM "LegalCase" WHERE id = $1 AND "firmId" = $2`, [caseId, firmId]);
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { id, role, content, timestamp } = await req.json();
  const row = await queryOne(
    `INSERT INTO "ChatMessage" (id, "caseId", role, content, "timestamp") VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [id, caseId, role, content, timestamp ?? new Date().toISOString()]
  );
  return NextResponse.json(row);
}
