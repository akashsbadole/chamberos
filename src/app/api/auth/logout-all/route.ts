import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { revokeCurrentSession, clearSessionCookie } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit";

export async function POST() {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId, userId } = auth.session;
  await revokeCurrentSession();
  await clearSessionCookie();
  await recordAuditEvent({ firmId, userId, action: "logout_all", detail: "User revoked session(s)" });
  return NextResponse.json({ ok: true });
}
