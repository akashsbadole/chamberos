import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { query } from "@/lib/db";
import { buildSimplePdf } from "@/lib/doc-export";

export async function GET(req: NextRequest) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId } = auth.session;
  const url = new URL(req.url);
  const caseId = url.searchParams.get("caseId");
  if (!caseId) return NextResponse.json({ error: "caseId required" }, { status: 400 });
  const c = await query(`SELECT * FROM "LegalCase" WHERE id=$1 AND "firmId"=$2`, [caseId, firmId]);
  if (!c.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const docs = await query(`SELECT * FROM "CaseDocument" WHERE "caseId"=$1`, [caseId]);
  const body = (docs as Record<string,unknown>[]).map(d=>`--- ${d.name} ---\n${d.content}`).join("\n\n");
  const pdf = buildSimplePdf(`Matter ${caseId}`, body || "No documents");
  return new NextResponse(pdf as unknown as BodyInit, { headers: { "content-type": "application/pdf", "content-disposition": `attachment; filename="matter-${caseId}.pdf"` } });
}
