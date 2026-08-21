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
    const { id, clientId, title, practiceArea, status, courtName, caseNumber, nextHearing, filingDeadline, compliance, documents } = body;

  const row = await queryOne(
    `INSERT INTO "LegalCase" (id, "firmId", "clientId", title, "practiceArea", status, "courtName", "caseNumber", "nextHearing", "filingDeadline", "updatedAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, now()) RETURNING *`,
    [
      id,
      firmId,
      clientId || null,
      title,
      practiceArea,
      status,
      courtName || null,
      caseNumber || null,
      nextHearing || null,
      filingDeadline || null,
    ]
  );

  const complianceRows = [];
  for (const item of compliance ?? []) {
    complianceRows.push(
      await queryOne(
        `INSERT INTO "ComplianceItem" (id, "caseId", label, "dueDate", done) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [item.id, id, item.label, item.dueDate, item.done ?? false]
      )
    );
  }
  const documentRows = [];
  for (const doc of documents ?? []) {
    documentRows.push(
      await queryOne(
        `INSERT INTO "CaseDocument" (id, "caseId", name, content, "uploadedAt") VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [doc.id, id, doc.name, doc.content, doc.uploadedAt ?? new Date().toISOString()]
      )
    );
  }

    await recordAuditEvent({ firmId, userId, action: "case_created", caseId: id, clientId: clientId || null, detail: `Matter opened: ${title}` });

    return NextResponse.json({ ...(row as object), compliance: complianceRows, documents: documentRows });
  } catch (err) {
    console.error("POST /api/cases error:", err);
    return NextResponse.json({ error: (err as Error).message ?? "Internal error" }, { status: 500 });
  }
}
