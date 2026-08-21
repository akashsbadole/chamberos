import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { query, queryOne } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId } = auth.session;
  const { id } = await params;
  const row = await queryOne(`SELECT * FROM "CalendarEvent" WHERE id = $1 AND "firmId" = $2`, [id, firmId]);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

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

const EVENT_TYPES = ["hearing", "meeting", "deadline", "internal"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId } = auth.session;
  const { id } = await params;
  const patch = await req.json();

  const existing = await queryOne(`SELECT id FROM "CalendarEvent" WHERE id = $1 AND "firmId" = $2`, [id, firmId]);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed = ["title", "start", "end", "type", "location"];
  const fields = Object.keys(patch).filter((f) => allowed.includes(f));
  if (fields.length === 0) return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  if (patch.type !== undefined && !EVENT_TYPES.includes(patch.type)) {
    return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
  }

  const setClause = fields.map((f, i) => `"${f}" = $${i + 2}`).join(", ");
  const row = await queryOne(
    `UPDATE "CalendarEvent" SET ${setClause} WHERE id = $1 RETURNING *`,
    [id, ...fields.map((f) => patch[f])]
  );
  return NextResponse.json(row);
}

