"use client";

import Link from "next/link";
import { useState } from "react";
import Shell from "@/components/Shell";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { PageHeader, Card, StatusBadge } from "@/components/ui";
import { useStore } from "@/lib/store";
import { FileText, Trash2 } from "lucide-react";

export default function CasesPage() {
  const { cases, clients, ready, removeCase } = useStore();
  const { dict } = useLocale();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 10;
  const clientName = (id: string) => clients.find((c) => c.id === id)?.name ?? "Unknown client";
  const filtered = cases.filter(c => !q || [c.title, c.caseNumber, c.practiceArea, clientName(c.clientId)].join(" ").toLowerCase().includes(q.toLowerCase()));
  const paged = filtered.slice(page*pageSize, (page+1)*pageSize);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  if (!ready) return <Shell><div className="p-8 text-ink-400 text-sm">Loading…</div></Shell>;

  return (
    <Shell>
      <PageHeader
        eyebrow={dict.pages.cases.eyebrow}
        title={dict.pages.cases.title}
        description={dict.pages.cases.description}
      />
      <div className="px-8 pb-2">
        <input value={q} onChange={e=>{setQ(e.target.value); setPage(0);}} placeholder="Search matters…" className="focus-ring w-full max-w-md text-sm border border-ink-200 rounded-md px-3 py-2" />
        <div className="text-xs text-ink-400 mt-1">{filtered.length} result(s) {filtered.length>pageSize && `· page ${page+1}/${pages}`}</div>
      </div>
      <div className="px-8 pb-10 space-y-3">
        {paged.map((c) => {
          const openItems = c.compliance.filter((i) => !i.done).length;
          return (
            <Card key={c.id} className="p-5 hover:border-brass-300 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <Link href={`/cases/${c.id}`} className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display text-lg text-ink-900">{c.title}</h3>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="text-sm text-ink-500 mt-1">
                    {clientName(c.clientId)} · {c.practiceArea} · {c.courtName}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-ink-400">
                    <span className="font-mono">{c.caseNumber}</span>
                    {c.nextHearing && (
                      <span>Next hearing {new Date(c.nextHearing).toLocaleDateString()}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" /> {c.documents.length} doc{c.documents.length !== 1 ? "s" : ""}
                    </span>
                    {openItems > 0 && (
                      <span className="text-rust-500 font-medium">{openItems} open compliance item{openItems !== 1 ? "s" : ""}</span>
                    )}
                  </div>
                </Link>
                <button
                  onClick={async (e) => {
                    e.preventDefault();
                    if (!confirm(`Delete matter "${c.title}"? This will also delete its compliance items, documents, evidence and research. This cannot be undone.`)) return;
                    try { await removeCase(c.id); } catch (err: unknown) { alert(err instanceof Error ? err.message : "Delete failed"); }
                  }}
                  aria-label={`Delete ${c.title}`}
                  className="focus-ring text-ink-300 hover:text-rust-500 transition-colors shrink-0 self-center p-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          );
        })}
        {pages>1 && <div className="flex justify-between pt-2 text-sm"><button disabled={page===0} onClick={()=>setPage(p=>p-1)} className="focus-ring border border-ink-200 rounded px-3 py-1 disabled:opacity-40">Prev</button><span className="text-ink-400">{page+1}/{pages}</span><button disabled={page+1>=pages} onClick={()=>setPage(p=>p+1)} className="focus-ring border border-ink-200 rounded px-3 py-1 disabled:opacity-40">Next</button></div>}
      </div>
    </Shell>
  );
}
