"use client";

import Link from "next/link";
import Shell from "@/components/Shell";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { PageHeader, Card, StatusBadge } from "@/components/ui";
import { useStore } from "@/lib/store";
import { FileText } from "lucide-react";

export default function CasesPage() {
  const { cases, clients, ready } = useStore();
  const { dict } = useLocale();
  if (!ready) return <Shell><div className="p-8 text-ink-400 text-sm">Loading…</div></Shell>;

  const clientName = (id: string) => clients.find((c) => c.id === id)?.name ?? "Unknown client";

  return (
    <Shell>
      <PageHeader
        eyebrow={dict.pages.cases.eyebrow}
        title={dict.pages.cases.title}
        description={dict.pages.cases.description}
      />
      <div className="px-8 pb-10 space-y-3">
        {cases.map((c) => {
          const openItems = c.compliance.filter((i) => !i.done).length;
          return (
            <Link key={c.id} href={`/cases/${c.id}`}>
              <Card className="p-5 hover:border-brass-300 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
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
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </Shell>
  );
}
