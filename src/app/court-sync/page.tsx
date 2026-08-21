"use client";

import { useState } from "react";
import Shell from "@/components/Shell";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { PageHeader, Card } from "@/components/ui";
import { useStore } from "@/lib/store";
import { CauseListEntry } from "@/lib/types";
import { Landmark, RefreshCw, CheckCircle2, HelpCircle } from "lucide-react";

export default function CourtSyncPage() {
  const { cases, ready } = useStore();
  const { dict } = useLocale();
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [entries, setEntries] = useState<CauseListEntry[] | null>(null);

  const sync = () => {
    setSyncing(true);
    setTimeout(() => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString();

      const generated: CauseListEntry[] = [
        ...cases
          .filter((c) => c.caseNumber !== "PENDING")
          .map((c, i) => ({
            court: c.courtName,
            caseNumber: c.caseNumber,
            matchedCaseId: c.id,
            date: dateStr,
            item: `Item No. ${i + 12} — ${["Hearing", "Arguments", "Evidence", "Mention"][i % 4]}`,
            status: "Matched to open matter",
          })),
        {
          court: "Bombay High Court",
          caseNumber: "COMM/2026/0510",
          matchedCaseId: null,
          date: dateStr,
          item: "Item No. 27 — Fresh filing scrutiny",
          status: "No matching matter on file",
        },
      ];
      setEntries(generated);
      setLastSync(new Date().toISOString());
      setSyncing(false);
    }, 900);
  };

  if (!ready) return <Shell><div className="p-8 text-ink-400 text-sm">Loading…</div></Shell>;

  return (
    <Shell>
      <PageHeader
        eyebrow={dict.pages.courtSync.eyebrow}
        title={dict.pages.courtSync.title}
        description={dict.pages.courtSync.description}
        action={
          <button
            onClick={sync}
            disabled={syncing}
            className="focus-ring bg-ink-900 text-white text-sm rounded-md px-4 py-2 hover:bg-ink-800 transition-colors flex items-center gap-2 disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing…" : "Sync now"}
          </button>
        }
      />

      <div className="px-8 pb-16">
        {lastSync && (
          <p className="text-xs text-ink-400 mb-4">Last synced {new Date(lastSync).toLocaleString()}</p>
        )}

        {!entries ? (
          <Card className="p-10 text-center">
            <Landmark className="w-8 h-8 text-ink-300 mx-auto mb-3" />
            <p className="font-display text-lg text-ink-700">No cause list loaded yet</p>
            <p className="text-sm text-ink-400 mt-1">Run a sync to fetch tomorrow&apos;s cause list and auto-match it to your matters.</p>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 text-ink-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">Court</th>
                  <th className="text-left px-5 py-3 font-medium">Case No.</th>
                  <th className="text-left px-5 py-3 font-medium">Cause list item</th>
                  <th className="text-left px-5 py-3 font-medium">Match status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {entries.map((e, i) => (
                  <tr key={i}>
                    <td className="px-5 py-3 text-ink-700">{e.court}</td>
                    <td className="px-5 py-3 font-mono text-ink-600">{e.caseNumber}</td>
                    <td className="px-5 py-3 text-ink-600">{e.item}</td>
                    <td className="px-5 py-3">
                      {e.matchedCaseId ? (
                        <span className="inline-flex items-center gap-1.5 text-moss-600">
                          <CheckCircle2 className="w-3.5 h-3.5" /> {e.status}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-brass-600">
                          <HelpCircle className="w-3.5 h-3.5" /> {e.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </Shell>
  );
}
