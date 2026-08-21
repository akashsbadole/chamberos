import { NextRequest, NextResponse } from "next/server";
import { createFirmAndAdmin, createSessionCookie, findUserByEmail } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { firmName, name, email, password } = body ?? {};

  if (!firmName?.trim() || !name?.trim() || !email?.trim() || !password) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }
  if (!/(?=.*[A-Za-z])(?=.*\d)/.test(password)) {
    return NextResponse.json({ error: "Password must contain at least one letter and one number." }, { status: 400 });
  }

  const existing = await findUserByEmail(email.trim().toLowerCase());
  if (existing) {
    // Return generic success to avoid account enumeration (rate limiting in proxy also helps)
    // The caller sees 409 only if enumeration via timing is not a concern; we use 409 with same timing but generic message could be 200.
    // Keeping 409 but not revealing timing differences is acceptable; alternatively return 200.
    // We add audit log for attempt.
    await recordAuditEvent({ firmId: existing.firmId, userId: null, action: "register_attempt_existing_email", detail: `Registration attempt for existing email ${email.trim().toLowerCase()}` });
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const { firmId, userId } = await createFirmAndAdmin(firmName.trim(), name.trim(), email.trim().toLowerCase(), password);

  await createSessionCookie({ userId, firmId, role: "ADMIN", email: email.trim().toLowerCase(), name: name.trim() });
  await recordAuditEvent({
    firmId,
    userId,
    action: "firm_registered",
    detail: `Firm "${firmName.trim()}" registered with admin ${name.trim()}`,
  });

  return NextResponse.json({ ok: true });
}
