import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { queryOne } from "@/lib/db";

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId } = auth.session;
  const { id } = await params;

  const existing = await queryOne(
    `SELECT te.id FROM "TimeEntry" te JOIN "LegalCase" lc ON lc.id = te."caseId" WHERE te.id = $1 AND lc."firmId" = $2`,
    [id, firmId]
  );
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const row = await queryOne(`UPDATE "TimeEntry" SET billed = NOT billed WHERE id = $1 RETURNING *`, [id]);
  return NextResponse.json(row);
}
