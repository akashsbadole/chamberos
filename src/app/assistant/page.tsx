"use client";

import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { PageHeader, Card } from "@/components/ui";
import { loadAISettings, callAIProvider, isRealProviderConfigured, PROVIDER_LABELS, FirmAISettings } from "@/lib/ai-provider";
import { searchGlossary, searchLegalResearch } from "@/lib/ai";
import { Send, Sparkles, Settings as SettingsIcon } from "lucide-react";
import Link from "next/link";

interface Msg {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT =
  "You are a legal research and practice assistant for an Indian law firm. Answer clearly and cite general legal principles where relevant, but always note you are not a substitute for the lawyer's own judgement and that case-specific facts should be verified. Keep answers concise and practical.";

function localFallback(question: string): string {
  const q = question.toLowerCase();
  const glossaryHits = searchGlossary(question);
  if (glossaryHits.length) {
    return `${glossaryHits[0].term}: ${glossaryHits[0].definition}`;
  }
  const researchHits = searchLegalResearch(question);
  if (researchHits.length) {
    const r = researchHits[0];
    return `${r.title} (${r.citation}, ${r.court}, ${r.year}): ${r.snippet}`;
  }
  if (/hello|hi|hey/.test(q)) return "Hello — ask me about a legal term, a filing procedure, or search case law by topic.";
  return "No real AI provider is connected, so I can only match against the built-in glossary and case-law corpus — try a term like \"force majeure\" or \"partition suit\", or connect Claude/OpenAI/Google AI in Settings for open-ended answers.";
}

export default function AssistantPage() {
  const { dict } = useLocale();
  const [settings, setSettings] = useState<FirmAISettings | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadAISettings().then(setSettings);
  }, []);

  const configured = settings ? isRealProviderConfigured(settings) : false;

  const send = async () => {
    const question = input.trim();
    if (!question) return;
    const userMsg: Msg = { id: `u_${Date.now()}`, role: "user", content: question };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setBusy(true);

    try {
      let reply: string;
      if (configured) {
        reply = await callAIProvider(
          SYSTEM_PROMPT,
          [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }))
        );
      } else {
        reply = localFallback(question);
      }
      setMessages((m) => [...m, { id: `a_${Date.now()}`, role: "assistant", content: reply || "(No response)" }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { id: `a_${Date.now()}`, role: "assistant", content: `Provider request failed (${e instanceof Error ? e.message : "unknown error"}). Falling back: ${localFallback(question)}` },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell>
      <PageHeader
        eyebrow={dict.pages.assistant.eyebrow}
        title={dict.pages.assistant.title}
        description={dict.pages.assistant.description}
        action={
          <Link href="/settings" className="focus-ring text-sm border border-ink-200 rounded-md px-3 py-2 hover:border-brass-300 transition-colors flex items-center gap-1.5">
            <SettingsIcon className="w-3.5 h-3.5" /> {configured ? `Using ${PROVIDER_LABELS[settings!.provider]}` : "Connect a provider"}
          </Link>
        }
      />

      <div className="px-4 sm:px-8 pb-16">
        <Card className="max-w-2xl mx-auto p-0 overflow-hidden flex flex-col h-[65vh] min-h-[420px]">
          <div className="px-5 py-3 border-b border-ink-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brass-500" />
            <span className="text-sm font-medium text-ink-800">
              {configured ? `Connected — ${PROVIDER_LABELS[settings!.provider]}` : "Not connected — using local glossary & research search"}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4" aria-live="polite">
            {messages.length === 0 && (
              <p className="text-sm text-ink-400">
                Try: &ldquo;What is a rejoinder?&rdquo;, &ldquo;Summarize the case law on liquidated damages&rdquo;, or any legal question.
              </p>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${m.role === "user" ? "bg-ink-900 text-white" : "bg-ink-50 text-ink-800"}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {busy && <div className="text-xs text-ink-400">Thinking…</div>}
          </div>
          <div className="px-4 py-3 border-t border-ink-100 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask a legal question…"
              aria-label="Ask the AI assistant"
              className="focus-ring flex-1 text-sm border border-ink-200 rounded-md px-3 py-2"
            />
            <button onClick={send} disabled={busy || !input.trim()} aria-label="Send" className="focus-ring bg-brass-500 hover:bg-brass-600 disabled:opacity-40 text-white rounded-md px-3.5 flex items-center justify-center transition-colors">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </Card>
      </div>
    </Shell>
  );
}
