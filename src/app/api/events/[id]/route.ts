import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { query, queryOne } from "@/lib/db";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId } = auth.session;
  const { id } = await params;

  const existing = await queryOne(`SELECT id FROM "CalendarEvent" WHERE id = $1 AND "firmId" = $2`, [id, firmId]);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await query(`DELETE FROM "CalendarEvent" WHERE id = $1`, [id]);
  return NextResponse.json({ ok: true });
}
