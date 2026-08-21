import { NextResponse } from "next/server";
import { getSession, SessionPayload } from "./auth";

// Every data API route calls this first and returns its NextResponse
// immediately if session is null — this is the actual multi-tenant
// boundary: every query below must filter by session.firmId, never trust
// a firmId supplied by the client in a request body.
export async function requireSession(): Promise<{ session: SessionPayload } | { error: NextResponse }> {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  }
  return { session };
}

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}
