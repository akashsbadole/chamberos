"use client";

import Shell from "@/components/Shell";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { PageHeader, Card, StatusBadge } from "@/components/ui";
import { useStore } from "@/lib/store";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function ClientsPage() {
  const { clients, ready } = useStore();
  const { dict } = useLocale();
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
      <div className="px-8 pb-10 space-y-3">
        {clients.map((c) => (
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
      </div>
    </Shell>
  );
}
