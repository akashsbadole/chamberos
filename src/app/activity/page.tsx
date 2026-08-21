"use client";

import Shell from "@/components/Shell";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { PageHeader, Card } from "@/components/ui";
import { useStore } from "@/lib/store";
import { ShieldCheck, FilePlus, UserPlus, CalendarPlus, CheckSquare, Mic, Clock3, FileText } from "lucide-react";

const ACTION_ICON: Record<string, typeof FileText> = {
  client_onboarded: UserPlus,
  case_created: FilePlus,
  document_added: FileText,
  compliance_completed: CheckSquare,
  compliance_reopened: CheckSquare,
  compliance_added: CheckSquare,
  event_scheduled: CalendarPlus,
  meeting_transcribed: Mic,
  time_logged: Clock3,
};

export default function ActivityPage() {
  const { auditLog, cases, clients, ready } = useStore();
  const { dict } = useLocale();
  if (!ready) return <Shell><div className="p-8 text-ink-400 text-sm">Loading…</div></Shell>;

  const caseName = (id: string | null) => (id ? cases.find((c) => c.id === id)?.title : null);
  const clientName = (id: string | null) => (id ? clients.find((c) => c.id === id)?.name : null);

  return (
    <Shell>
      <PageHeader
        eyebrow={dict.pages.activity.eyebrow}
        title={dict.pages.activity.title}
        description={dict.pages.activity.description}
      />

      <div className="px-8 pb-16">
        <Card className="p-5 mb-5 bg-ink-50 border-ink-100 text-xs text-ink-500 leading-relaxed flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-brass-500 shrink-0 mt-0.5" />
          <p>
            This log records actions taken in this browser session and is stored alongside the rest of the demo data in{" "}
            <code className="font-mono bg-white px-1 py-0.5 rounded border border-ink-200">localStorage</code>. A production
            audit trail needs to be server-side, tamper-evident (append-only storage or hash-chaining), and retained per your
            jurisdiction&apos;s record-keeping rules — none of which a client-only demo can provide.
          </p>
        </Card>

        <Card className="p-0 overflow-hidden">
          {auditLog.length === 0 ? (
            <p className="text-sm text-ink-400 px-5 py-6">No activity recorded yet.</p>
          ) : (
            <ul className="divide-y divide-ink-100">
              {auditLog.map((e) => {
                const Icon = ACTION_ICON[e.action] ?? FileText;
                const linkedCase = caseName(e.caseId);
                const linkedClient = clientName(e.clientId);
                return (
                  <li key={e.id} className="px-5 py-3 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-ink-50 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-ink-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-ink-800">{e.detail}</div>
                      <div className="text-xs text-ink-400 mt-0.5">
                        {e.actor}
                        {linkedCase && <> · {linkedCase}</>}
                        {linkedClient && <> · {linkedClient}</>}
                      </div>
                    </div>
                    <div className="text-xs text-ink-400 font-mono shrink-0 text-right">
                      {new Date(e.timestamp).toLocaleDateString()}
                      <br />
                      {new Date(e.timestamp).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </Shell>
  );
}
