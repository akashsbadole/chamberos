import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { queryOne } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId } = auth.session;
  const { id: caseId } = await params;

  const owned = await queryOne(`SELECT id FROM "LegalCase" WHERE id = $1 AND "firmId" = $2`, [caseId, firmId]);
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { questions } = await req.json(); // ResearchQuestion[]
  const rows = [];
  for (const q of questions) {
    // Skip duplicates (same case + question text) already on record.
    const dup = await queryOne(`SELECT id FROM "ResearchQuestion" WHERE "caseId" = $1 AND question = $2`, [caseId, q.question]);
    if (dup) continue;
    rows.push(
      await queryOne(
        `INSERT INTO "ResearchQuestion" (id, "caseId", question, reason, answered, answer) VALUES ($1,$2,$3,$4,false,null) RETURNING *`,
        [q.id, caseId, q.question, q.reason]
      )
    );
  }
  return NextResponse.json(rows);
}
