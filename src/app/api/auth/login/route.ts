import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail, verifyPassword, createSessionCookie } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { email, password } = body ?? {};
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const user = await findUserByEmail(email.trim().toLowerCase());
  if (!user) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  await createSessionCookie({ userId: user.id, firmId: user.firmId, role: user.role, email: user.email, name: user.name });
  await recordAuditEvent({ firmId: user.firmId, userId: user.id, action: "login", detail: `${user.name} signed in` });

  return NextResponse.json({ ok: true });
}
