"use client";

import { useState } from "react";
import Shell from "@/components/Shell";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { PageHeader, Card } from "@/components/ui";
import { useStore } from "@/lib/store";
import { searchLegalResearch, searchGlossary } from "@/lib/ai";
import { ResearchResult, CaseDocument, GlossaryTerm } from "@/lib/types";
import { Search, Scale, Plus, Check, BookOpen } from "lucide-react";

const SUGGESTIONS = ["force majeure", "liquidated damages", "wrongful termination", "arbitration clause", "property partition"];
const GLOSSARY_SUGGESTIONS = ["vakalatnama", "cause list", "injunction", "affidavit", "limitation period"];

export default function ResearchPage() {
  const { cases, addDocument } = useStore();
  const { dict } = useLocale();
  const [mode, setMode] = useState<"caselaw" | "glossary">("caselaw");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ResearchResult[] | null>(null);
  const [glossaryQuery, setGlossaryQuery] = useState("");
  const [glossaryResults, setGlossaryResults] = useState<GlossaryTerm[] | null>(null);
  const [caseId, setCaseId] = useState("");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const run = (q: string) => {
    setQuery(q);
    setResults(searchLegalResearch(q));
  };

  const runGlossary = (q: string) => {
    setGlossaryQuery(q);
    setGlossaryResults(searchGlossary(q));
  };

  const saveToCase = (r: ResearchResult) => {
    if (!caseId) return;
    const doc: CaseDocument = {
      // eslint-disable-next-line react-hooks/purity -- id generated inside a click handler, not during render
      id: `doc_research_${Date.now()}`,
      name: `Research note — ${r.citation}`,
      uploadedAt: new Date().toISOString(),
      content: `${r.title}\n${r.citation} — ${r.court} (${r.year})\n\n${r.snippet}`,
    };
    addDocument(caseId, doc);
    setSavedIds((prev) => new Set(prev).add(r.id));
  };

  return (
    <Shell>
      <PageHeader
        eyebrow={dict.pages.research.eyebrow}
        title={dict.pages.research.title}
        description={dict.pages.research.description}
      />

      <div className="px-4 sm:px-8 pb-16 space-y-5">
        <Card className="p-3 bg-ink-50 text-xs text-ink-500">Provider: AI (local) with <code className="font-mono">WESTLAW_API_KEY</code>/<code className="font-mono">LEXISNEXIS_API_KEY</code>/<code className="font-mono">FASTCASE_API_KEY</code> hooks → <code className="font-mono">src/lib/legal-research.ts:1</code> (first-party fallback when keys not set).</Card>
        <div className="flex gap-1 border-b border-ink-100">
          <button
            onClick={() => setMode("caselaw")}
            className={`focus-ring px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${mode === "caselaw" ? "border-brass-500 text-ink-900" : "border-transparent text-ink-400 hover:text-ink-600"}`}
          >
            <Scale className="w-3.5 h-3.5" /> Case law
          </button>
          <button
            onClick={() => setMode("glossary")}
            className={`focus-ring px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${mode === "glossary" ? "border-brass-500 text-ink-900" : "border-transparent text-ink-400 hover:text-ink-600"}`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Legal term glossary
          </button>
        </div>

        {mode === "glossary" && (
          <Card className="p-5">
            <div className="relative">
              <Search className="w-4 h-4 text-ink-300 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={glossaryQuery}
                onChange={(e) => setGlossaryQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runGlossary(glossaryQuery)}
                placeholder="Search a legal term, e.g. &ldquo;injunction&rdquo;"
                className="focus-ring w-full text-sm border border-ink-200 rounded-md pl-9 pr-3 py-2.5"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {GLOSSARY_SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => runGlossary(s)} className="focus-ring text-xs px-2.5 py-1 rounded-full border border-ink-200 text-ink-500 hover:border-brass-300 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </Card>
        )}

        {mode === "glossary" && glossaryResults !== null && (
          glossaryResults.length === 0 ? (
            <Card className="p-8 text-center text-sm text-ink-400">No terms match &ldquo;{glossaryQuery}&rdquo;.</Card>
          ) : (
            <div className="space-y-3">
              {glossaryResults.map((t) => (
                <Card key={t.id} className="p-5">
                  <h3 className="font-display text-base text-ink-900">{t.term}</h3>
                  <p className="text-sm text-ink-600 mt-1.5 leading-relaxed">{t.definition}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {t.tags.map((tag) => (
                      <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full bg-ink-50 text-ink-500">{tag}</span>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )
        )}

        {mode === "caselaw" && (
        <>
        <Card className="p-5">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-ink-300 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && run(query)}
                placeholder="Search by issue, e.g. &ldquo;force majeure&rdquo; or &ldquo;wrongful termination&rdquo;"
                className="focus-ring w-full text-sm border border-ink-200 rounded-md pl-9 pr-3 py-2.5"
              />
            </div>
            <button onClick={() => run(query)} className="focus-ring bg-ink-900 text-white text-sm rounded-md px-4 py-2 hover:bg-ink-800 transition-colors">
              Search
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => run(s)} className="focus-ring text-xs px-2.5 py-1 rounded-full border border-ink-200 text-ink-500 hover:border-brass-300 transition-colors">
                {s}
              </button>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-ink-100">
            <label className="block text-xs text-ink-400 mb-1.5">Save results to matter</label>
            <select value={caseId} onChange={(e) => setCaseId(e.target.value)} className="focus-ring text-sm border border-ink-200 rounded-md px-3 py-1.5">
              <option value="">Choose a matter…</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
        </Card>

        {results === null ? (
          <Card className="p-10 text-center">
            <Scale className="w-8 h-8 text-ink-300 mx-auto mb-3" />
            <p className="font-display text-lg text-ink-700">Search a legal issue</p>
            <p className="text-sm text-ink-400 mt-1">Results are matched against a small demo corpus of Indian case law.</p>
          </Card>
        ) : results.length === 0 ? (
          <Card className="p-8 text-center text-sm text-ink-400">No matching authorities for &ldquo;{query}&rdquo;. Try a broader term.</Card>
        ) : (
          <div className="space-y-3">
            {results.map((r) => (
              <Card key={r.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-display text-base text-ink-900">{r.title}</h3>
                    <p className="text-xs text-ink-500 font-mono mt-0.5">{r.citation} · {r.court} · {r.year}</p>
                    <p className="text-sm text-ink-600 mt-2 leading-relaxed">{r.snippet}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {r.tags.map((t) => (
                        <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-ink-50 text-ink-500">{t}</span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => saveToCase(r)}
                    disabled={!caseId || savedIds.has(r.id)}
                    className="focus-ring shrink-0 text-xs flex items-center gap-1 rounded-md border border-ink-200 px-3 py-1.5 hover:border-brass-300 disabled:opacity-40 transition-colors"
                  >
                    {savedIds.has(r.id) ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-moss-500" /> Saved
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" /> Save to matter
                      </>
                    )}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
        </>
        )}
      </div>
    </Shell>
  );
}
