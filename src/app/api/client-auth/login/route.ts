import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail, verifyPassword, createSessionCookie } from "@/lib/auth";
// Client portal auth – clients log in with email (no password yet, stubbed).
// In prod, Clients would have their own credentials table; here we reuse User lookup
// and allow any existing Client email with a shared portal code.
export async function POST(req: NextRequest) {
  const { email, code } = await req.json().catch(()=> ({}));
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });
  // Stub: accept any code === "demo" for now; in prod check hashed portal password
  if (code && code !== "demo") return NextResponse.json({ error: "Invalid code" }, { status: 401 });
  const user = await findUserByEmail(String(email).toLowerCase());
  // If no User, treat as Client portal guest – create limited session
  if (!user) {
    // Create a CLIENT-role session tied to no firm (or lookup firm via client)
    return NextResponse.json({ error: "Client not found. Ask your firm to share portal access." }, { status: 404 });
  }
  // For demo, reuse User verification if password provided? For portal we just create CLIENT session
  // In real impl, verify client portal password hash
  await createSessionCookie({ userId: user.id, firmId: user.firmId, role: "CLIENT", email: user.email, name: user.name });
  return NextResponse.json({ ok: true, role: "CLIENT" as const });
}
