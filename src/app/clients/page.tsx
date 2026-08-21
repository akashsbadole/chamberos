"use client";

import Shell from "@/components/Shell";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { PageHeader, Card, StatusBadge } from "@/components/ui";
import { useStore } from "@/lib/store";
import { ShieldAlert, ShieldCheck, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function ClientsPage() {
  const { clients, ready, removeClient } = useStore();
  const { dict } = useLocale();
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 10;
  const filtered = clients.filter(c => !q || [c.name,c.email,c.phone,c.matterType].join(" ").toLowerCase().includes(q.toLowerCase()));
  const paged = filtered.slice(page*pageSize, (page+1)*pageSize);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  if (!ready) return <Shell><div className="p-8 text-ink-400 text-sm">Loading…</div></Shell>;

  return (
    <Shell>
      <PageHeader
        eyebrow={dict.pages.clients.eyebrow}
        title={dict.pages.clients.title}
        description={dict.pages.clients.description}
        action={
          <Link href="/onboarding" className="focus-ring bg-ink-900 text-white text-sm rounded-md px-4 py-2 hover:bg-ink-800 transition-colors">
            New client
          </Link>
        }
      />
      {err && <div className="mx-8 mb-3 bg-rust-500/10 text-rust-700 text-sm rounded-md px-4 py-2 flex justify-between"><span>{err}</span><button onClick={() => setErr(null)} className="text-rust-500 ml-3">×</button></div>}
      <div className="px-8 pb-2">
        <input value={q} onChange={e=>{setQ(e.target.value); setPage(0);}} placeholder="Search clients…" className="focus-ring w-full max-w-md text-sm border border-ink-200 rounded-md px-3 py-2" />
        <div className="text-xs text-ink-400 mt-1">{filtered.length} result(s) {filtered.length>pageSize && `· page ${page+1}/${pages}`}</div>
      </div>
      <div className="px-8 pb-10 space-y-3">
        {paged.map((c) => (
          <Card key={c.id} className="p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-display text-lg text-ink-900">{c.name}</h3>
                  <StatusBadge status={c.status} />
                </div>
                <p className="text-sm text-ink-500 mt-1">
                  {c.matterType} · {c.email} · {c.phone}
                </p>
                {c.notes && <p className="text-xs text-ink-400 mt-2 max-w-xl">{c.notes}</p>}
              </div>
              <div className="flex flex-col items-end gap-1.5 text-xs shrink-0">
                <span className={`flex items-center gap-1.5 ${c.conflictFlags.length ? "text-rust-500" : "text-moss-600"}`}>
                  {c.conflictFlags.length ? <ShieldAlert className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                  {c.conflictFlags.length ? `${c.conflictFlags.length} conflict flag(s)` : "Conflict clear"}
                </span>
                <span className={c.kycVerified ? "text-moss-600" : "text-ink-400"}>
                  {c.kycVerified ? "KYC verified" : "KYC pending"}
                </span>
                <span className={c.engagementSigned ? "text-moss-600" : "text-ink-400"}>
                  {c.engagementSigned ? "Engagement signed" : "Engagement pending"}
                </span>
                <button
                  onClick={async () => {
                    if (!confirm(`Delete client "${c.name}"? This cannot be undone.`)) return;
                    setErr(null);
                    try { await removeClient(c.id); } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Delete failed"); }
                  }}
                  aria-label={`Delete ${c.name}`}
                  className="focus-ring mt-1 flex items-center gap-1 text-ink-300 hover:text-rust-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
            {c.conflictFlags.length > 0 && (
              <ul className="mt-3 border-t border-ink-100 pt-3 space-y-1">
                {c.conflictFlags.map((f, i) => (
                  <li key={i} className="text-xs text-rust-600 flex items-start gap-1.5">
                    <ShieldAlert className="w-3 h-3 mt-0.5 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ))}
        {pages>1 && <div className="flex justify-between pt-2 text-sm"><button disabled={page===0} onClick={()=>setPage(p=>p-1)} className="focus-ring border border-ink-200 rounded px-3 py-1 disabled:opacity-40">Prev</button><span className="text-ink-400">{page+1}/{pages}</span><button disabled={page+1>=pages} onClick={()=>setPage(p=>p+1)} className="focus-ring border border-ink-200 rounded px-3 py-1 disabled:opacity-40">Next</button></div>}
      </div>
    </Shell>
  );
}
