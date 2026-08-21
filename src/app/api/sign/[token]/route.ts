import { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db";

// Public — no session required, token is the auth.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const row = await queryOne(`SELECT id, "documentName", "signerName", "signerEmail", status, "signedAt", "createdAt" FROM "SignatureRequest" WHERE token=$1`, [token]);
  if (!row) return NextResponse.json({ error: "Invalid token" }, { status:404 });
  return NextResponse.json(row);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { signatureData, action } = await req.json().catch(()=>({}));
  if (action === "decline") {
    const row = await queryOne(`UPDATE "SignatureRequest" SET status='declined' WHERE token=$1 AND status='pending' RETURNING *`, [token]);
    if (!row) return NextResponse.json({ error: "Not found or already processed" }, { status:404 });
    return NextResponse.json(row);
  }
  if (!signatureData) return NextResponse.json({ error: "signatureData required" }, { status:400 });
  const row = await queryOne(`UPDATE "SignatureRequest" SET status='signed', "signatureData"=$1, "signedAt"=$2 WHERE token=$3 AND status='pending' RETURNING *`, [signatureData, new Date().toISOString(), token]);
  if (!row) return NextResponse.json({ error: "Not found or already processed" }, { status:404 });
  return NextResponse.json(row);
}
