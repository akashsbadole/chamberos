"use client";

import { useMemo, useState } from "react";
import Shell from "@/components/Shell";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { PageHeader, Card } from "@/components/ui";
import { useStore } from "@/lib/store";
import { detectConflicts, suggestSlots } from "@/lib/ai";
import { CalendarEvent } from "@/lib/types";
import { AlertTriangle, CheckCircle2, Sparkles, Trash2, MessageCircle } from "lucide-react";
import { buildWhatsAppLink } from "@/lib/whatsapp";

const TYPE_COLORS: Record<string, string> = {
  hearing: "bg-ink-900 text-white",
  meeting: "bg-brass-400 text-white",
  deadline: "bg-rust-500 text-white",
  internal: "bg-ink-200 text-ink-700",
};

export default function CalendarPage() {
  const { events, cases, clients, addEvent, removeEvent, ready } = useStore();
  const { dict } = useLocale();
  const [title, setTitle] = useState("");
  const [caseId, setCaseId] = useState("");
  const [type, setType] = useState<CalendarEvent["type"]>("meeting");
  const [duration, setDuration] = useState(30);
  const [start, setStart] = useState("");
  const [conflictCheck, setConflictCheck] = useState<ReturnType<typeof detectConflicts> | null>(null);
  const [suggestions, setSuggestions] = useState<{ start: string; end: string }[] | null>(null);

  const sortedEvents = useMemo(() => [...events].sort((a, b) => a.start.localeCompare(b.start)), [events]);

  const checkForm = () => {
    if (!start) return;
    const startDate = new Date(start);
    const endDate = new Date(startDate.getTime() + duration * 60000);
    setConflictCheck(detectConflicts(events, { start: startDate.toISOString(), end: endDate.toISOString() }));
  };

  const getSuggestions = () => {
    setSuggestions(suggestSlots(events, duration, 4));
  };

  const createEvent = (overrideStart?: string) => {
    const s = overrideStart ?? start;
    if (!title || !s) return;
    const startDate = new Date(s);
    const endDate = new Date(startDate.getTime() + duration * 60000);
    addEvent({
      id: `ev_${Date.now()}`,
      title,
      caseId: caseId || null,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      type,
      location: type === "hearing" ? "Court" : "TBD",
    });
    setTitle("");
    setStart("");
    setConflictCheck(null);
    setSuggestions(null);
  };

  if (!ready) return <Shell><div className="p-8 text-ink-400 text-sm">Loading…</div></Shell>;

  return (
    <Shell>
      <PageHeader
        eyebrow={dict.pages.calendar.eyebrow}
        title={dict.pages.calendar.title}
        description={dict.pages.calendar.description}
      />
      <div className="px-8 pb-16 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-5">
          <div className="text-xs uppercase tracking-wide text-ink-400 mb-3">Upcoming &amp; recent</div>
          <ul className="divide-y divide-ink-100">
            {sortedEvents.map((e) => {
              const linkedCase = cases.find((c) => c.id === e.caseId);
              const linkedClient = clients.find((c) => c.id === linkedCase?.clientId);
              const waMessage = `Reminder: "${e.title}" is scheduled for ${new Date(e.start).toLocaleString()}${e.location ? ` at ${e.location}` : ""}.`;
              return (
                <li key={e.id} className="py-3 flex items-center gap-3">
                  <span className={`text-[10px] uppercase tracking-wide px-2 py-1 rounded font-medium shrink-0 ${TYPE_COLORS[e.type]}`}>
                    {e.type}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-ink-800 truncate">{e.title}</div>
                    <div className="text-xs text-ink-400 truncate">{linkedCase?.title ?? e.location}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-ink-600 font-mono">{new Date(e.start).toLocaleDateString()}</div>
                    <div className="text-xs text-ink-400 font-mono">
                      {new Date(e.start).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  {linkedClient?.phone && (
                    <a
                      href={buildWhatsAppLink(linkedClient.phone, waMessage)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Send WhatsApp reminder to ${linkedClient.name}`}
                      className="focus-ring text-ink-300 hover:text-moss-600 transition-colors shrink-0"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button onClick={() => removeEvent(e.id)} aria-label={`Delete ${e.title}`} className="focus-ring text-ink-300 hover:text-rust-500 transition-colors shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="text-xs uppercase tracking-wide text-ink-400 mb-3">New event</div>
            <div className="space-y-2.5">
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="focus-ring w-full text-sm border border-ink-200 rounded-md px-3 py-2" />
              <select value={caseId} onChange={(e) => setCaseId(e.target.value)} className="focus-ring w-full text-sm border border-ink-200 rounded-md px-3 py-2">
                <option value="">No linked case</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <select value={type} onChange={(e) => setType(e.target.value as CalendarEvent["type"])} className="focus-ring text-sm border border-ink-200 rounded-md px-3 py-2">
                  <option value="meeting">Meeting</option>
                  <option value="hearing">Hearing</option>
                  <option value="deadline">Deadline</option>
                  <option value="internal">Internal</option>
                </select>
                <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="focus-ring text-sm border border-ink-200 rounded-md px-3 py-2">
                  {[15, 30, 45, 60, 90].map((d) => (
                    <option key={d} value={d}>{d} min</option>
                  ))}
                </select>
              </div>
              <input type="datetime-local" value={start} onChange={(e) => { setStart(e.target.value); setConflictCheck(null); }} className="focus-ring w-full text-sm border border-ink-200 rounded-md px-3 py-2" />

              <button onClick={checkForm} disabled={!start} className="focus-ring w-full text-sm border border-ink-200 rounded-md py-2 hover:border-brass-300 disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brass-500" /> Check for conflicts
              </button>

              {conflictCheck && (
                <div className={`text-xs rounded-md p-3 flex items-start gap-2 ${conflictCheck.hasConflict ? "bg-rust-500/10 text-rust-700" : "bg-moss-500/10 text-moss-700"}`}>
                  {conflictCheck.hasConflict ? <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> : <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />}
                  <div>
                    {conflictCheck.hasConflict
                      ? `Overlaps with: ${conflictCheck.conflictsWith.map((c) => c.title).join(", ")}`
                      : "No conflicts — this slot is clear."}
                  </div>
                </div>
              )}

              <button onClick={() => createEvent()} disabled={!title || !start} className="focus-ring w-full bg-ink-900 text-white text-sm rounded-md py-2 disabled:opacity-40 hover:bg-ink-800 transition-colors">
                Add to calendar
              </button>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-brass-500" />
              <div className="text-xs uppercase tracking-wide text-ink-400">AI slot finder</div>
            </div>
            <p className="text-xs text-ink-500 mb-3">Find the next open {duration}-minute working-hour slots.</p>
            <button onClick={getSuggestions} className="focus-ring w-full text-sm border border-ink-200 rounded-md py-2 hover:border-brass-300 transition-colors mb-3">
              Suggest slots
            </button>
            {suggestions && (
              <ul className="space-y-1.5">
                {suggestions.map((s, i) => (
                  <li key={i}>
                    <button
                      onClick={() => { setStart(toLocalInputValue(s.start)); createEvent(s.start); }}
                      disabled={!title}
                      className="focus-ring w-full text-left text-xs bg-ink-50 hover:bg-brass-50 disabled:opacity-40 rounded-md px-3 py-2 flex items-center justify-between transition-colors"
                    >
                      <span>{new Date(s.start).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span>
                      <span className="font-mono">{new Date(s.start).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</span>
                    </button>
                  </li>
                ))}
                {suggestions.length === 0 && <p className="text-xs text-ink-400">No open slots found in the next 3 weeks.</p>}
              </ul>
            )}
            {!title && suggestions && <p className="text-[11px] text-ink-400 mt-2">Add a title above to book a suggested slot.</p>}
          </Card>
        </div>
      </div>
    </Shell>
  );
}

function toLocalInputValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
