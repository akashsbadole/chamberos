"use client";

import { AIProviderId } from "./types";

export const PROVIDER_LABELS: Record<AIProviderId, string> = {
  local: "Local (no API key — built-in heuristics)",
  anthropic: "Claude (Anthropic)",
  openai: "OpenAI (ChatGPT-compatible)",
  google: "Google AI (Gemini)",
};

export const DEFAULT_MODELS: Record<AIProviderId, string> = {
  local: "",
  anthropic: "claude-sonnet-4-5",
  openai: "gpt-4o-mini",
  google: "gemini-2.0-flash",
};

export interface FirmAISettings {
  provider: AIProviderId;
  model: string;
  keySet: boolean;
}

// Reads the firm's AI provider config — provider/model only, never the key
// itself (that stays server-side, decrypted only inside /api/ai per-request).
export async function loadAISettings(): Promise<FirmAISettings> {
  const res = await fetch("/api/settings/ai");
  if (!res.ok) return { provider: "local", model: "", keySet: false };
  return res.json();
}

// Only an ADMIN can call this successfully (enforced server-side too).
export async function saveAISettings(provider: AIProviderId, model: string, apiKey: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch("/api/settings/ai", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ provider, model, apiKey }),
  });
  const data = await res.json();
  if (!res.ok) return { ok: false, error: data.error };
  return { ok: true };
}

export function isRealProviderConfigured(settings: FirmAISettings): boolean {
  return settings.provider !== "local" && settings.keySet;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// Calls the firm's configured provider via the server relay. The server
// looks up which provider + key to use from the authenticated session's
// firm — nothing provider-specific is sent from the client. Throws on
// failure so callers can fall back to the local heuristic engine.
export async function callAIProvider(system: string, messages: ChatMessage[]): Promise<string> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ system, messages }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "AI request failed");
  return data.text ?? "";
}
