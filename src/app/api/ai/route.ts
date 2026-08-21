import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { queryOne } from "@/lib/db";
import { decryptSecret } from "@/lib/server-crypto";
import { recordAuditEvent } from "@/lib/audit";

// Server-side relay to a real LLM provider. The API key now lives
// server-side only — encrypted in the Firm row, decrypted here for the
// duration of a single request, and never sent to or accepted from the
// browser. Compare this to the prototype version of this route, which
// accepted a client-supplied key in the request body (fine for a personal
// single-user demo, wrong for a multi-tenant product).

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { firmId } = auth.session;

  let body: { system?: string; messages: ChatMessage[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { system, messages } = body;
  if (!messages?.length) return NextResponse.json({ error: "Missing messages" }, { status: 400 });

  const firm = await queryOne<{
    aiProvider: string | null;
    aiModel: string | null;
    aiApiKeyCiphertext: string | null;
    aiApiKeyIv: string | null;
  }>(`SELECT "aiProvider", "aiModel", "aiApiKeyCiphertext", "aiApiKeyIv" FROM "Firm" WHERE id = $1`, [firmId]);

  if (!firm?.aiProvider || firm.aiProvider === "local" || !firm.aiApiKeyCiphertext || !firm.aiApiKeyIv) {
    return NextResponse.json({ error: "No AI provider configured for this firm" }, { status: 400 });
  }

  const apiKey = decryptSecret(firm.aiApiKeyCiphertext, firm.aiApiKeyIv);
  const provider = firm.aiProvider;
  const model = firm.aiModel || undefined;
  // Daily quota per firm (prod: move to Redis/DB)
  const quota = (globalThis as unknown as { __aiQuota?: Map<string, { count: number; reset: number }> }).__aiQuota ?? ((globalThis as unknown as { __aiQuota: Map<string, { count: number; reset: number }> }).__aiQuota = new Map());
  const now = Date.now();
  const entry = quota.get(firmId);
  if (!entry || now > entry.reset) quota.set(firmId, { count: 1, reset: now + 24*60*60*1000 });
  else {
    if (entry.count >= 100) return NextResponse.json({ error: "AI daily quota exceeded (100/day). Contact admin." }, { status: 429 });
    entry.count++;
  }
  // Audit AI usage (counted for quota visibility even when provider call fails)
  await recordAuditEvent({ firmId, userId: auth.session.userId, action: "ai_inference", detail: `AI ${provider} call (${messages.length} msgs)` });

  try {
    if (provider === "anthropic") {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: model || "claude-sonnet-4-5",
          max_tokens: 1024,
          system: system || undefined,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (!res.ok) return NextResponse.json({ error: data?.error?.message || "Anthropic request failed" }, { status: res.status });
      const text = (data.content ?? []).filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("\n");
      return NextResponse.json({ text });
    }

    if (provider === "openai") {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: model || "gpt-4o-mini",
          messages: [...(system ? [{ role: "system", content: system }] : []), ...messages.map((m) => ({ role: m.role, content: m.content }))],
        }),
      });
      const data = await res.json();
      if (!res.ok) return NextResponse.json({ error: data?.error?.message || "OpenAI request failed" }, { status: res.status });
      return NextResponse.json({ text: data.choices?.[0]?.message?.content ?? "" });
    }

    if (provider === "google") {
      const mdl = model || "gemini-2.0-flash";
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${mdl}:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          systemInstruction: system ? { parts: [{ text: system }] } : undefined,
          contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
        }),
      });
      const data = await res.json();
      if (!res.ok) return NextResponse.json({ error: data?.error?.message || "Google AI request failed" }, { status: res.status });
      const text = (data.candidates?.[0]?.content?.parts ?? []).map((p: { text: string }) => p.text).join("\n");
      return NextResponse.json({ text });
    }

    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Request to the AI provider failed" }, { status: 502 });
  }
}
