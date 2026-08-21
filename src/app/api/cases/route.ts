import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { queryOne, withTransaction } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const { firmId, userId } = auth.session;

    const body = await req.json();
    const { id, clientId, title, practiceArea, status, courtName, caseNumber, nextHearing, filingDeadline, compliance, documents } = body;
    if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });
    if (!practiceArea) return NextResponse.json({ error: "practiceArea required" }, { status: 400 });
    const caseId = id ?? `case_${crypto.randomUUID()}`;

    const { row, complianceRows, documentRows } = await withTransaction(async (tx) => {
      const r = await tx.queryOne(
        `INSERT INTO "LegalCase" (id, "firmId", "clientId", title, "practiceArea", status, "courtName", "caseNumber", "nextHearing", "filingDeadline", "updatedAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, now()) RETURNING *`,
        [caseId, firmId, clientId || null, title, practiceArea, status ?? "open", courtName || null, caseNumber || null, nextHearing || null, filingDeadline || null]
      );
      const cRows: unknown[] = [];
      for (const item of compliance ?? []) {
        const cr = await tx.queryOne(
          `INSERT INTO "ComplianceItem" (id, "caseId", label, "dueDate", done) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
          [item.id ?? `c_${crypto.randomUUID()}`, caseId, item.label, item.dueDate, item.done ?? false]
        );
        cRows.push(cr);
      }
      const dRows: unknown[] = [];
      for (const doc of documents ?? []) {
        const dr = await tx.queryOne(
          `INSERT INTO "CaseDocument" (id, "caseId", name, content, "uploadedAt") VALUES ($1,$2,$3,$4,$5) RETURNING *`,
          [doc.id ?? `doc_${crypto.randomUUID()}`, caseId, doc.name ?? "Untitled", doc.content ?? "", doc.uploadedAt ?? new Date().toISOString()]
        );
        dRows.push(dr);
      }
      return { row: r, complianceRows: cRows, documentRows: dRows };
    });

    await recordAuditEvent({ firmId, userId, action: "case_created", caseId: caseId, clientId: clientId || null, detail: `Matter opened: ${title}` });

    return NextResponse.json({ ...(row as object), compliance: complianceRows, documents: documentRows });
  } catch (err) {
    console.error("POST /api/cases error:", err);
    return NextResponse.json({ error: (err as Error).message ?? "Internal error" }, { status: 500 });
  }
}
