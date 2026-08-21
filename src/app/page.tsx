"use client";

import Link from "next/link";
import Shell from "@/components/Shell";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { PageHeader, Card } from "@/components/ui";
import { useStore } from "@/lib/store";
import { AlertTriangle, ArrowUpRight, CalendarClock, FileWarning, Sparkles, ShieldCheck, BarChart3 } from "lucide-react";
import { BarChart } from "@/components/Charts";
import { formatDate, formatDateTime } from "@/lib/format";

export default function DashboardPage() {
  const { cases, clients, events, auditLog, ready } = useStore();
  const { dict, locale } = useLocale();
  const loc = locale === "en" ? "en-IN" : locale;

  if (!ready) return <Shell><div className="p-8 text-ink-400 text-sm">Loading…</div></Shell>;

  // eslint-disable-next-line react-hooks/purity -- demo dashboard reads wall-clock time to bucket "upcoming" events
  const now = Date.now();
  const upcomingEvents = [...events]
    .filter((e) => new Date(e.start).getTime() > now)
    .sort((a, b) => a.start.localeCompare(b.start))
    .slice(0, 5);

  const openCompliance = cases.flatMap((c) =>
    c.compliance.filter((i) => !i.done).map((i) => ({ ...i, caseTitle: c.title, caseId: c.id }))
  ).sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const onboardingClients = clients.filter((c) => c.status !== "active");
  const activeCases = cases.filter((c) => c.status !== "closed");

  const stats = [
    { label: "Active Matters", value: activeCases.length, href: "/cases" },
    { label: "Clients Onboarding", value: onboardingClients.length, href: "/onboarding" },
    { label: "Open Compliance Items", value: openCompliance.length, href: "/calendar" },
    { label: "Upcoming Hearings", value: events.filter((e) => e.type === "hearing" && new Date(e.start).getTime() > now).length, href: "/court-sync" },
  ];

  const mattersByStatus = [
    { name: "Open", value: cases.filter(c=>c.status==="open").length },
    { name: "Pending", value: cases.filter(c=>c.status==="pending_filing").length },
    { name: "In Court", value: cases.filter(c=>c.status==="in_court").length },
    { name: "Closed", value: cases.filter(c=>c.status==="closed").length },
  ];

  return (
    <Shell>
      <PageHeader
        eyebrow={dict.pages.dashboard.eyebrow}
        title={dict.pages.dashboard.title}
        description={dict.pages.dashboard.description}
      />

      <div className="px-8 grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="p-5 hover:border-brass-300 transition-colors group">
              <div className="flex items-start justify-between">
                <div className="text-3xl font-display text-ink-900">{s.value}</div>
                <ArrowUpRight className="w-4 h-4 text-ink-300 group-hover:text-brass-500 transition-colors" />
              </div>
              <div className="text-xs text-ink-500 mt-1">{s.label}</div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="px-8 grid grid-cols-1 lg:grid-cols-5 gap-6 pb-10">
        <Card className="lg:col-span-3 p-6">
          <div className="flex items-center gap-2 mb-4">
            <CalendarClock className="w-4 h-4 text-brass-500" />
            <h2 className="font-display text-lg text-ink-900">Upcoming on the calendar</h2>
          </div>
          {upcomingEvents.length === 0 ? (
            <p className="text-sm text-ink-400">Nothing scheduled. Try the AI scheduler.</p>
          ) : (
            <ul className="divide-y divide-ink-100">
              {upcomingEvents.map((e) => (
                <li key={e.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-ink-800 font-medium">{e.title}</div>
                    <div className="text-xs text-ink-400 mt-0.5">{e.location}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-ink-700 font-mono">
                      {formatDate(e.start, loc)}
                    </div>
                    <div className="text-xs text-ink-400 font-mono">
                      {formatDateTime(e.start, loc)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link href="/calendar" className="focus-ring inline-block mt-4 text-sm text-brass-600 hover:text-brass-700 font-medium">
            Open calendar →
          </Link>
        </Card>

        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileWarning className="w-4 h-4 text-rust-500" />
            <h2 className="font-display text-lg text-ink-900">Filing &amp; compliance</h2>
          </div>
          {openCompliance.length === 0 ? (
            <p className="text-sm text-ink-400">All caught up.</p>
          ) : (
            <ul className="space-y-3">
              {openCompliance.slice(0, 5).map((item) => {
                const overdue = new Date(item.dueDate).getTime() < now;
                return (
                  <li key={item.id} className="flex items-start gap-2">
                    {overdue && <AlertTriangle className="w-3.5 h-3.5 text-rust-500 mt-0.5 shrink-0" />}
                    <div className="min-w-0">
                      <div className="text-sm text-ink-800 truncate">{item.label}</div>
                      <div className="text-xs text-ink-400">
                        {item.caseTitle} · due {new Date(item.dueDate).toLocaleDateString()}
                        {overdue && <span className="text-rust-500 font-medium"> · overdue</span>}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-brass-500" />
            <h2 className="font-display text-lg text-ink-900">Matters by status</h2>
          </div>
          <BarChart data={mattersByStatus} label="Matters by status" />
        </Card>

        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-4 h-4 text-brass-500" />
            <h2 className="font-display text-lg text-ink-900">Recent activity</h2>
          </div>
          {auditLog.length === 0 ? (
            <p className="text-sm text-ink-400">Nothing logged yet.</p>
          ) : (
            <ul className="space-y-3">
              {auditLog.slice(0, 5).map((e) => (
                <li key={e.id} className="text-sm">
                  <div className="text-ink-700 truncate">{e.detail}</div>
                  <div className="text-xs text-ink-400 font-mono">
                    {new Date(e.timestamp).toLocaleDateString()} · {new Date(e.timestamp).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link href="/activity" className="focus-ring inline-block mt-4 text-sm text-brass-600 hover:text-brass-700 font-medium">
            View full log →
          </Link>
        </Card>

        <Card className="lg:col-span-3 p-6 bg-ink-900 text-ink-100 border-ink-900">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-brass-300" />
            <h2 className="font-display text-lg">Where AI is doing the work</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 text-sm">
            <Link href="/cases" className="focus-ring block p-4 rounded-md bg-ink-800 hover:bg-ink-700 transition-colors">
              <div className="font-medium text-brass-200 mb-1">Clause finder + drafting</div>
              <div className="text-ink-400 text-xs">Scan uploaded documents for risk clauses and generate first-draft language.</div>
            </Link>
            <Link href="/voice-intake" className="focus-ring block p-4 rounded-md bg-ink-800 hover:bg-ink-700 transition-colors">
              <div className="font-medium text-brass-200 mb-1">Voice case creation</div>
              <div className="text-ink-400 text-xs">Dictate a new matter and let the transcript populate the intake form.</div>
            </Link>
            <Link href="/calendar" className="focus-ring block p-4 rounded-md bg-ink-800 hover:bg-ink-700 transition-colors">
              <div className="font-medium text-brass-200 mb-1">Scheduling + conflicts</div>
              <div className="text-ink-400 text-xs">Suggests open slots and flags double-bookings before you confirm.</div>
            </Link>
            <Link href="/court-sync" className="focus-ring block p-4 rounded-md bg-ink-800 hover:bg-ink-700 transition-colors">
              <div className="font-medium text-brass-200 mb-1">eCourts cause-list sync</div>
              <div className="text-ink-400 text-xs">Pulls tomorrow&apos;s cause list and matches entries to your open matters.</div>
            </Link>
          </div>
        </Card>
      </div>
    </Shell>
  );
}
