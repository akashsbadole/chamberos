import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { verifyChain } from "@/lib/audit";

export async function GET() {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const result = await verifyChain(auth.session.firmId);
  return NextResponse.json(result);
}
