"use client";

import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { PageHeader, Card } from "@/components/ui";
import { AIProviderId } from "@/lib/types";
import { loadAISettings, saveAISettings, callAIProvider, PROVIDER_LABELS, DEFAULT_MODELS, FirmAISettings } from "@/lib/ai-provider";
import { ShieldCheck, Sparkles, Eye, EyeOff, CheckCircle2, XCircle, LogOut, User, Building2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface SessionInfo {
  name: string;
  email: string;
  role: string;
  firmId: string;
}

export default function SettingsPage() {
  const { dict } = useLocale();
  return (
    <Shell>
      <PageHeader
        eyebrow={dict.pages.settings.eyebrow}
        title={dict.pages.settings.title}
        description={dict.pages.settings.description}
      />
      <div className="px-4 sm:px-8 pb-16 max-w-2xl space-y-6">
        <AccountCard />
        <TeamCard />
        <AIProviderSettings />
        <AuditIntegrityCard />
      </div>
    </Shell>
  );
}

function AccountCard() {
  const router = useRouter();
  const [session, setSession] = useState<SessionInfo | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then(setSession);
  }, []);

  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <User className="w-4 h-4 text-brass-500" />
        <h2 className="font-display text-lg text-ink-900">Account</h2>
      </div>
      {session && (
        <div className="space-y-2 text-sm mb-4">
          <div className="flex items-center gap-2 text-ink-700"><User className="w-3.5 h-3.5 text-ink-400" /> {session.name} · {session.email}</div>
          <div className="flex items-center gap-2 text-ink-700"><Building2 className="w-3.5 h-3.5 text-ink-400" /> Role: {session.role}</div>
        </div>
      )}
      <button onClick={signOut} className="focus-ring text-sm border border-ink-200 rounded-md px-4 py-2 hover:border-rust-300 hover:text-rust-600 transition-colors flex items-center gap-1.5">
        <LogOut className="w-3.5 h-3.5" /> Sign out
      </button>
      <p className="text-[11px] text-ink-400 leading-relaxed mt-4 pt-4 border-t border-ink-100">
        Authentication is real: session is a signed, HTTP-only JWT cookie verified on every request by
        middleware — every query in every API route is scoped to your firm&apos;s ID from this session, which
        is the actual multi-tenant security boundary (see PRODUCTION_READINESS.md for what still needs
        hardening before real client data touches this).
      </p>
    </Card>
  );
}

function AIProviderSettings() {
  const [settings, setSettings] = useState<FirmAISettings>({ provider: "local", model: "", keySet: false });
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState("");
  const [testResult, setTestResult] = useState<"idle" | "testing" | "ok" | "error">("idle");
  const [testMessage, setTestMessage] = useState("");

  useEffect(() => {
    loadAISettings().then((s) => {
      setSettings(s);
    });
  }, []);

  const save = async () => {
    setSaveStatus("saving");
    const result = await saveAISettings(settings.provider, settings.model, apiKeyInput);
    if (!result.ok) {
      setSaveStatus("error");
      setSaveError(result.error || "Failed to save.");
      return;
    }
    setSaveStatus("saved");
    setApiKeyInput("");
    const fresh = await loadAISettings();
    setSettings(fresh);
  };

  const testConnection = async () => {
    setTestResult("testing");
    try {
      const reply = await callAIProvider("You are a connectivity test. Reply with exactly: OK.", [{ role: "user", content: "Say OK." }]);
      setTestMessage(reply.slice(0, 120));
      setTestResult("ok");
    } catch (e) {
      setTestMessage(e instanceof Error ? e.message : "Request failed");
      setTestResult("error");
    }
  };

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-4 h-4 text-brass-500" />
        <h2 className="font-display text-lg text-ink-900">AI provider (firm-wide, admin only)</h2>
      </div>
      <p className="text-sm text-ink-500 mb-4">
        Set once for the whole firm. The key is encrypted (AES-256-GCM) and stored server-side on the Firm
        record — it is never sent to or stored in any browser, and this form never displays a previously saved key.
      </p>

      <div className="grid grid-cols-1 gap-3">
        <label className="block">
          <span className="block text-xs text-ink-500 mb-1">Provider</span>
          <select
            value={settings.provider}
            onChange={(e) => {
              const provider = e.target.value as AIProviderId;
              setSettings((s) => ({ ...s, provider, model: DEFAULT_MODELS[provider] }));
              setSaveStatus("idle");
            }}
            className="focus-ring w-full text-sm border border-ink-200 rounded-md px-3 py-2"
          >
            {(Object.keys(PROVIDER_LABELS) as AIProviderId[]).map((id) => (
              <option key={id} value={id}>{PROVIDER_LABELS[id]}</option>
            ))}
          </select>
        </label>

        {settings.provider !== "local" && (
          <>
            <label className="block">
              <span className="block text-xs text-ink-500 mb-1">
                API key {settings.keySet && <span className="text-moss-600">(a key is already saved — leave blank to keep it)</span>}
              </span>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder={settings.keySet ? "•••••••• (unchanged)" : "sk-… / API key"}
                  className="focus-ring w-full text-sm border border-ink-200 rounded-md px-3 py-2 pr-9"
                />
                <button type="button" onClick={() => setShowKey((v) => !v)} aria-label={showKey ? "Hide API key" : "Show API key"} className="focus-ring absolute right-2 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600">
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </label>
            <label className="block">
              <span className="block text-xs text-ink-500 mb-1">Model</span>
              <input
                value={settings.model}
                onChange={(e) => setSettings((s) => ({ ...s, model: e.target.value }))}
                placeholder={DEFAULT_MODELS[settings.provider]}
                className="focus-ring w-full text-sm border border-ink-200 rounded-md px-3 py-2"
              />
            </label>
          </>
        )}

        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={saveStatus === "saving" || (settings.provider !== "local" && !apiKeyInput && !settings.keySet)}
            className="focus-ring text-sm bg-ink-900 text-white rounded-md px-4 py-2 hover:bg-ink-800 disabled:opacity-40 transition-colors"
          >
            {saveStatus === "saving" ? "Saving…" : "Save"}
          </button>
          {settings.provider !== "local" && (
            <button onClick={testConnection} disabled={testResult === "testing"} className="focus-ring text-sm border border-ink-200 rounded-md px-4 py-2 hover:border-brass-300 disabled:opacity-40 transition-colors">
              {testResult === "testing" ? "Testing…" : "Test connection"}
            </button>
          )}
        </div>

        {saveStatus === "saved" && <p className="text-xs text-moss-600 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Saved.</p>}
        {saveStatus === "error" && <p className="text-xs text-rust-600 flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5" /> {saveError}</p>}
        {testResult === "ok" && <p className="text-xs text-moss-600 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Connected. Response: &ldquo;{testMessage}&rdquo;</p>}
        {testResult === "error" && <p className="text-xs text-rust-600 flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5" /> {testMessage}</p>}
      </div>
    </Card>
  );
}

function TeamCard() {
  const [role, setRole] = useState<string | null>(null);
  useEffect(()=>{ fetch("/api/auth/me").then(r=>r.ok?r.json():null).then(d=> setRole(d?.role ?? null)).catch(()=>{}); }, []);
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-brass-500"/><h2 className="font-display text-lg">Team</h2></div>
      <p className="text-sm text-ink-500 mb-3">Create Lawyer and Paralegal accounts for this firm. Only Admin can manage users.</p>
      {role === "ADMIN" ? <Link href="/settings/users" className="focus-ring inline-flex bg-ink-900 text-white text-sm rounded-md px-4 py-2">Manage users</Link> : <p className="text-xs text-ink-400">Current role: {role ?? "unknown"} — ask an Admin to create your account.</p>}
    </Card>
  );
}

function AuditIntegrityCard() {
  const [result, setResult] = useState<{ valid: boolean; brokenAt: string | null } | null>(null);
  const [checking, setChecking] = useState(false);

  const verify = async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/audit/verify");
      setResult(await res.json());
    } finally {
      setChecking(false);
    }
  };

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-1">
        <ShieldCheck className="w-4 h-4 text-brass-500" />
        <h2 className="font-display text-lg text-ink-900">Audit trail integrity</h2>
      </div>
      <p className="text-sm text-ink-500 mb-4">
        The activity log is hash-chained in Postgres — each row&apos;s hash covers the previous row&apos;s hash,
        so any row altered outside the application (bypassing the database&apos;s own UPDATE/DELETE-rejecting
        trigger) breaks the chain. Verify it here.
      </p>
      <button onClick={verify} disabled={checking} className="focus-ring text-sm border border-ink-200 rounded-md px-4 py-2 hover:border-brass-300 disabled:opacity-40 transition-colors">
        {checking ? "Verifying…" : "Verify chain now"}
      </button>
      {result && (
        <p className={`text-xs mt-3 flex items-center gap-1.5 ${result.valid ? "text-moss-600" : "text-rust-600"}`}>
          {result.valid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
          {result.valid ? "Chain verified — no tampering detected." : `Chain broken at record ${result.brokenAt}.`}
        </p>
      )}
    </Card>
  );
}
