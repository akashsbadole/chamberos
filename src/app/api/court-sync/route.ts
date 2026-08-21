import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { query } from "@/lib/db";

export async function GET() {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId } = auth.session;
  const url = process.env.ECOURTS_API_URL;
  if (url) {
    try {
      const res = await fetch(`${url}/cause-list?firmId=${firmId}`, { headers: { Authorization: `Bearer ${process.env.ECOURTS_API_TOKEN ?? ""}` } });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json({ source: "ecourts", entries: data.entries ?? data });
      }
      console.error("[ecourts] upstream failed", res.status);
    } catch (e) { console.error("[ecourts] fetch failed, falling back to simulated", e); }
  }
  // Fallback: simulated (no creds)
  const cases = await query(`SELECT * FROM "LegalCase" WHERE "firmId"=$1 AND "caseNumber" != 'PENDING'`, [firmId]);
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate()+1);
  const dateStr = tomorrow.toISOString();
  const entries = [
    ...(cases as Record<string,unknown>[]).map((c,i)=> ({
      court: c.courtName, caseNumber: c.caseNumber, matchedCaseId: c.id, date: dateStr,
      item: `Item No. ${12+i} — ${["Hearing","Arguments","Evidence","Mention"][i%4]}`, status: "Matched to open matter", source: "simulated"
    })),
    { court: "Bombay High Court", caseNumber: "COMM/2026/0510", matchedCaseId: null, date: dateStr, item: "Item No. 27 — Fresh filing scrutiny", status: "No matching matter on file", source: "simulated" }
  ];
  return NextResponse.json({ source: url ? "simulated-fallback" : "simulated", entries });
}
