import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { queryOne } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId } = auth.session;
  const { id } = await params;

  const existing = await queryOne(
    `SELECT g.id FROM "Grievance" g JOIN "Client" c ON c.id = g."clientId" WHERE g.id = $1 AND c."firmId" = $2`,
    [id, firmId]
  );
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { status } = await req.json();
  const row = await queryOne(`UPDATE "Grievance" SET status = $2 WHERE id = $1 RETURNING *`, [id, status]);
  return NextResponse.json(row);
}
