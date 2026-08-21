import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { queryOne } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const { firmId, userId } = auth.session;

    const body = await req.json();
    let { id, name, email, phone, matterType, status, conflictChecked, conflictFlags, kycVerified, engagementSigned, notes } = body;

    // Defensive defaults + validation — return 400 instead of 500 for client errors
    if (!id) id = `cl_${crypto.randomUUID()}`;
    if (!name || !String(name).trim()) return NextResponse.json({ error: "name is required" }, { status: 400 });
    if (!email || !String(email).trim()) return NextResponse.json({ error: "email is required" }, { status: 400 });
    phone = phone ?? "";
    matterType = matterType ?? "Commercial Contract";
    status = status ?? "intake";
    const validStatuses = ["intake", "conflict_check", "kyc", "engagement", "active"] as const;
    if (!validStatuses.includes(status)) return NextResponse.json({ error: `invalid status: ${status}` }, { status: 400 });

    const row = await queryOne(
      `INSERT INTO "Client" (id, "firmId", name, email, phone, "matterType", status, "conflictChecked", "conflictFlags", "kycVerified", "engagementSigned", notes, "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12, now()) RETURNING *`,
      [id, firmId, String(name).trim(), String(email).trim(), String(phone), String(matterType), status, !!conflictChecked, Array.isArray(conflictFlags) ? conflictFlags : [], !!kycVerified, !!engagementSigned, notes ?? null]
    );

    await recordAuditEvent({ firmId, userId, action: "client_onboarded", clientId: id, detail: `Client onboarded: ${name}` });

    return NextResponse.json(row);
  } catch (err: unknown) {
    const e = err as { message?: string; code?: string; detail?: string; constraint?: string; column?: string; table?: string };
    console.error("POST /api/clients error:", e);
    // Surface PG details to the client so the browser Network > Preview shows the real cause
    return NextResponse.json({ error: e.message ?? "Internal error", code: e.code, detail: e.detail, constraint: e.constraint, column: e.column, table: e.table }, { status: 500 });
  }
}
