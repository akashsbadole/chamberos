import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { queryOne } from "@/lib/db";
import { encryptSecret } from "@/lib/server-crypto";
import { recordAuditEvent } from "@/lib/audit";

// GET returns the provider/model only — never the decrypted key, and not
// even whether a key is set beyond a boolean, to keep the key itself
// strictly server-side (decrypted only inside /api/ai for an actual call).
export async function GET() {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId } = auth.session;

  const firm = await queryOne<{ aiProvider: string | null; aiModel: string | null; aiApiKeyCiphertext: string | null }>(
    `SELECT "aiProvider", "aiModel", "aiApiKeyCiphertext" FROM "Firm" WHERE id = $1`,
    [firmId]
  );
  return NextResponse.json({
    provider: firm?.aiProvider ?? "local",
    model: firm?.aiModel ?? "",
    keySet: !!firm?.aiApiKeyCiphertext,
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId, userId, role } = auth.session;

  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Only a firm admin can change the AI provider." }, { status: 403 });
  }

  const { provider, model, apiKey } = await req.json();

  if (provider === "local") {
    await queryOne(
      `UPDATE "Firm" SET "aiProvider" = 'local', "aiModel" = NULL, "aiApiKeyCiphertext" = NULL, "aiApiKeyIv" = NULL WHERE id = $1 RETURNING id`,
      [firmId]
    );
    await recordAuditEvent({ firmId, userId, action: "ai_settings_updated", detail: "AI provider set to local (no external calls)" });
    return NextResponse.json({ ok: true });
  }

  if (!apiKey) {
    return NextResponse.json({ error: "API key is required for a non-local provider." }, { status: 400 });
  }

  const { ciphertext, iv } = encryptSecret(apiKey);
  await queryOne(
    `UPDATE "Firm" SET "aiProvider" = $2, "aiModel" = $3, "aiApiKeyCiphertext" = $4, "aiApiKeyIv" = $5 WHERE id = $1 RETURNING id`,
    [firmId, provider, model || null, ciphertext, iv]
  );
  await recordAuditEvent({ firmId, userId, action: "ai_settings_updated", detail: `AI provider set to ${provider}` });

  return NextResponse.json({ ok: true });
}
