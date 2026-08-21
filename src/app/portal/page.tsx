"use client";

import { useMemo, useState } from "react";
import Shell from "@/components/Shell";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { PageHeader, Card } from "@/components/ui";
import { useStore } from "@/lib/store";
import { Grievance } from "@/lib/types";
import { CalendarClock, MessageSquareWarning, CheckCircle2, Clock3, Trash2 } from "lucide-react";

const GRIEVANCE_STATUS_STYLES: Record<Grievance["status"], string> = {
  open: "bg-rust-500/10 text-rust-600",
  acknowledged: "bg-brass-100 text-brass-700",
  resolved: "bg-moss-500/10 text-moss-600",
};

export default function ClientPortalPage() {
  const { clients, cases, events, grievances, addGrievance, updateGrievanceStatus, removeGrievance, ready } = useStore();
  const { dict } = useLocale();
  const [viewClientId, setViewClientId] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [grievanceCaseId, setGrievanceCaseId] = useState("");

  const clientCases = useMemo(() => cases.filter((c) => c.clientId === viewClientId), [cases, viewClientId]);
  const clientCaseIds = new Set(clientCases.map((c) => c.id));
  const upcoming = useMemo(() => {
    // eslint-disable-next-line react-hooks/purity -- filtering to future events against wall-clock time is inherent to a "upcoming schedule" view
    const now = Date.now();
    return events
      .filter((e) => e.caseId && clientCaseIds.has(e.caseId) && new Date(e.start).getTime() > now)
      .sort((a, b) => a.start.localeCompare(b.start));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, viewClientId]);

  const submitGrievance = () => {
    if (!viewClientId || !subject.trim() || !message.trim()) return;
    addGrievance({
      id: `griev_${Date.now()}`,
      clientId: viewClientId,
      caseId: grievanceCaseId || null,
      subject,
      message,
      status: "open",
      submittedAt: new Date().toISOString(),
    });
    setSubject("");
    setMessage("");
  };

  if (!ready) return <Shell><div className="p-8 text-ink-400 text-sm">Loading…</div></Shell>;

  return (
    <Shell>
      <PageHeader
        eyebrow={dict.pages.portal.eyebrow}
        title={dict.pages.portal.title}
        description={dict.pages.portal.description}
      />

      <div className="px-4 sm:px-8 pb-16 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <Card className="p-5">
            <label className="block text-xs text-ink-500 mb-1.5">Viewing as client</label>
            <select value={viewClientId} onChange={(e) => setViewClientId(e.target.value)} className="focus-ring w-full text-sm border border-ink-200 rounded-md px-3 py-2">
              <option value="">Choose a client…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Card>

          {viewClientId && (
            <>
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CalendarClock className="w-4 h-4 text-brass-500" />
                  <h2 className="font-display text-lg text-ink-900">Upcoming schedule</h2>
                </div>
                {upcoming.length === 0 ? (
                  <p className="text-sm text-ink-400">Nothing scheduled right now.</p>
                ) : (
                  <ul className="divide-y divide-ink-100">
                    {upcoming.map((e) => (
                      <li key={e.id} className="py-2.5 flex items-center justify-between text-sm">
                        <div>
                          <div className="text-ink-800">{e.title}</div>
                          <div className="text-xs text-ink-400">{e.location}</div>
                        </div>
                        <div className="text-right text-xs text-ink-500 font-mono">
                          {new Date(e.start).toLocaleDateString()}<br />
                          {new Date(e.start).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              <Card className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquareWarning className="w-4 h-4 text-rust-500" />
                  <h2 className="font-display text-lg text-ink-900">Raise a grievance</h2>
                </div>
                <div className="space-y-2.5">
                  <select value={grievanceCaseId} onChange={(e) => setGrievanceCaseId(e.target.value)} className="focus-ring w-full text-sm border border-ink-200 rounded-md px-3 py-2">
                    <option value="">General (not matter-specific)</option>
                    {clientCases.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                  <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="focus-ring w-full text-sm border border-ink-200 rounded-md px-3 py-2" />
                  <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Describe your concern…" className="focus-ring w-full text-sm border border-ink-200 rounded-md px-3 py-2" />
                  <button onClick={submitGrievance} disabled={!subject.trim() || !message.trim()} className="focus-ring w-full bg-ink-900 text-white text-sm rounded-md py-2 disabled:opacity-40 hover:bg-ink-800 transition-colors">
                    Submit
                  </button>
                </div>
              </Card>
            </>
          )}
        </div>

        <Card className="p-5">
          <div className="text-xs uppercase tracking-wide text-ink-400 mb-3">All grievances (firm view)</div>
          {grievances.length === 0 ? (
            <p className="text-sm text-ink-400">None raised yet.</p>
          ) : (
            <ul className="space-y-4">
              {grievances.map((g) => {
                const client = clients.find((c) => c.id === g.clientId);
                return (
                  <li key={g.id} className="border border-ink-100 rounded-md p-3">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-sm font-medium text-ink-800">{g.subject}</span>
                      <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0 ${GRIEVANCE_STATUS_STYLES[g.status]}`}>{g.status}</span>
                    </div>
                    <p className="text-xs text-ink-500 mb-2">{client?.name} · {new Date(g.submittedAt).toLocaleDateString()}</p>
                    <p className="text-sm text-ink-600 mb-2.5">{g.message}</p>
                    <div className="flex gap-1.5">
                      {g.status !== "acknowledged" && (
                        <button onClick={() => updateGrievanceStatus(g.id, "acknowledged")} className="focus-ring text-xs border border-ink-200 rounded-md px-2.5 py-1 hover:border-brass-300 transition-colors flex items-center gap-1">
                          <Clock3 className="w-3 h-3" /> Acknowledge
                        </button>
                      )}
                      {g.status !== "resolved" && (
                        <button onClick={() => updateGrievanceStatus(g.id, "resolved")} className="focus-ring text-xs border border-ink-200 rounded-md px-2.5 py-1 hover:border-brass-300 transition-colors flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Resolve
                        </button>
                      )}
                      <button onClick={async () => { if (!confirm(`Delete grievance "${g.subject}"?`)) return; try { await removeGrievance(g.id); } catch (e: unknown) { alert(e instanceof Error ? e.message : "Delete failed"); } }} className="focus-ring text-xs text-ink-300 hover:text-rust-500 border border-transparent hover:border-rust-200 rounded-md px-2.5 py-1 ml-auto flex items-center gap-1"><Trash2 className="w-3 h-3" /> Delete</button>
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
