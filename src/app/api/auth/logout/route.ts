import { NextResponse } from "next/server";
import { clearSessionCookie, getSession } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit";

export async function POST() {
  const session = await getSession();
  if (session) {
    await recordAuditEvent({ firmId: session.firmId, userId: session.userId, action: "logout", detail: `${session.name} signed out` });
  }
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
