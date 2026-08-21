import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { query, queryOne } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId, role, userId: actorId } = auth.session;
  if (role !== "ADMIN") return NextResponse.json({ error: "Admin only" }, { status: 403 });
  const { id } = await params;
  const existing = await queryOne<{ id: string }>(`SELECT id FROM "User" WHERE id = $1 AND "firmId" = $2`, [id, firmId]);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { name, role: newRole, password } = await req.json().catch(() => ({}));
  const fields: string[] = []; const vals: unknown[] = []; let i = 1;
  if (name !== undefined) { fields.push(`name = $${++i}`); vals.push(String(name).trim()); }
  if (newRole !== undefined) {
    if (!["ADMIN","LAWYER","PARALEGAL","CLIENT"].includes(newRole)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    fields.push(`role = $${++i}`); vals.push(newRole);
  }
  if (password) { fields.push(`"passwordHash" = $${++i}`); vals.push(await hashPassword(password)); }
  if (!fields.length) return NextResponse.json({ error: "No fields" }, { status: 400 });
  const row = await queryOne(`UPDATE "User" SET ${fields.join(", ")} WHERE id = $1 RETURNING id, "firmId", name, email, role, "createdAt"`, [id, ...vals]);
  await recordAuditEvent({ firmId, userId: actorId, action: "user_updated", detail: `User ${id} updated` });
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId, role, userId: actorId } = auth.session;
  if (role !== "ADMIN") return NextResponse.json({ error: "Admin only" }, { status: 403 });
  const { id } = await params;
  if (id === actorId) return NextResponse.json({ error: "Cannot delete self" }, { status: 400 });
  const existing = await queryOne(`SELECT id FROM "User" WHERE id = $1 AND "firmId" = $2`, [id, firmId]);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await query(`DELETE FROM "User" WHERE id = $1`, [id]);
  await recordAuditEvent({ firmId, userId: actorId, action: "user_deleted", detail: `User ${id} deleted` });
  return NextResponse.json({ ok: true });
}
