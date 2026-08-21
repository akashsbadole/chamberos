import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { queryOne } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId } = auth.session;
  const { id } = await params;
  const patch = await req.json();

  const existing = await queryOne<{ id: string }>(`SELECT id FROM "Client" WHERE id = $1 AND "firmId" = $2`, [id, firmId]);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const fields = Object.keys(patch);
  if (fields.length === 0) return NextResponse.json({ error: "No fields to update" }, { status: 400 });

  const setClause = fields.map((f, i) => `"${f}" = $${i + 2}`).join(", ");
  const row = await queryOne(
    `UPDATE "Client" SET ${setClause}, "updatedAt" = now() WHERE id = $1 RETURNING *`,
    [id, ...fields.map((f) => patch[f])]
  );
  return NextResponse.json(row);
}
