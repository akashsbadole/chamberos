import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { query, queryOne } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit";

export async function GET() {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId, role } = auth.session;
  if (role !== "ADMIN") return NextResponse.json({ error: "Admin only" }, { status: 403 });
  const users = await query(`SELECT id, "firmId", name, email, role, "createdAt" FROM "User" WHERE "firmId" = $1 ORDER BY "createdAt"`, [firmId]);
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId, role, userId: actorId } = auth.session;
  if (role !== "ADMIN") return NextResponse.json({ error: "Admin only" }, { status: 403 });
  const { name, email, password, role: newRole } = await req.json().catch(() => ({}));
  if (!name?.trim() || !email?.trim() || !password) return NextResponse.json({ error: "name, email, password required" }, { status: 400 });
  if (!["ADMIN", "LAWYER", "PARALEGAL"].includes(newRole ?? "LAWYER")) return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  const exists = await queryOne(`SELECT id FROM "User" WHERE email = $1`, [email.trim().toLowerCase()]);
  if (exists) return NextResponse.json({ error: "Email exists" }, { status: 409 });
  const id = `user_${crypto.randomUUID()}`;
  const passwordHash = await hashPassword(password);
  const row = await queryOne(`INSERT INTO "User" (id, "firmId", name, email, "passwordHash", role) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, "firmId", name, email, role, "createdAt"`, [id, firmId, name.trim(), email.trim().toLowerCase(), passwordHash, newRole ?? "LAWYER"]);
  await recordAuditEvent({ firmId, userId: actorId, action: "user_created", detail: `User ${email} created as ${newRole ?? "LAWYER"}` });
  return NextResponse.json(row, { status: 201 });
}
