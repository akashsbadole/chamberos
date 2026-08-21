"use client";

import { useMemo, useState } from "react";
import Shell from "@/components/Shell";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { PageHeader, Card } from "@/components/ui";
import { useStore } from "@/lib/store";
import { minutesToBillable } from "@/lib/ai";
import { CheckCircle2, Circle, Receipt, MessageCircle, Trash2 } from "lucide-react";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export default function BillingPage() {
  const { cases, clients, timeEntries, addTimeEntry, toggleTimeEntryBilled, removeTimeEntry, ready } = useStore();
  const { dict } = useLocale();
  const [caseId, setCaseId] = useState("");
  const [description, setDescription] = useState("");
  const [minutes, setMinutes] = useState(30);
  const [rate, setRate] = useState(6000);
  const [invoiceCaseId, setInvoiceCaseId] = useState("");

  const log = () => {
    if (!caseId || !description.trim()) return;
    addTimeEntry({
      id: `time_${Date.now()}`,
      caseId,
      description,
      minutes,
      rate,
      billed: false,
      createdAt: new Date().toISOString(),
    });
    setDescription("");
  };

  const totalsByCase = useMemo(() => {
    const map = new Map<string, { minutes: number; amount: number; unbilled: number }>();
    for (const t of timeEntries) {
      const prev = map.get(t.caseId) ?? { minutes: 0, amount: 0, unbilled: 0 };
      const amount = minutesToBillable(t.minutes, t.rate);
      map.set(t.caseId, {
        minutes: prev.minutes + t.minutes,
        amount: prev.amount + amount,
        unbilled: prev.unbilled + (t.billed ? 0 : amount),
      });
    }
    return map;
  }, [timeEntries]);

  const invoiceEntries = timeEntries.filter((t) => t.caseId === invoiceCaseId && !t.billed);
  const invoiceCase = cases.find((c) => c.id === invoiceCaseId);
  const invoiceClient = clients.find((c) => c.id === invoiceCase?.clientId);
  const invoiceTotal = invoiceEntries.reduce((sum, t) => sum + minutesToBillable(t.minutes, t.rate), 0);

  if (!ready) return <Shell><div className="p-8 text-ink-400 text-sm">Loading…</div></Shell>;

  return (
    <Shell>
      <PageHeader
        eyebrow={dict.pages.billing.eyebrow}
        title={dict.pages.billing.title}
        description={dict.pages.billing.description}
      />

      <div className="px-8 pb-16 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5">
            <div className="text-xs uppercase tracking-wide text-ink-400 mb-3">Log time</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-2.5">
              <select value={caseId} onChange={(e) => setCaseId(e.target.value)} className="focus-ring text-sm border border-ink-200 rounded-md px-3 py-2">
                <option value="">Choose a matter…</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description of work"
                className="focus-ring text-sm border border-ink-200 rounded-md px-3 py-2"
              />
            </div>
            <div className="flex flex-wrap gap-2.5">
              <label className="flex items-center gap-1.5 text-xs text-ink-500">
                Minutes
                <input type="number" min={5} step={5} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className="focus-ring w-20 text-sm border border-ink-200 rounded-md px-2 py-1.5" />
              </label>
              <label className="flex items-center gap-1.5 text-xs text-ink-500">
                Rate / hr (₹)
                <input type="number" min={0} step={500} value={rate} onChange={(e) => setRate(Number(e.target.value))} className="focus-ring w-24 text-sm border border-ink-200 rounded-md px-2 py-1.5" />
              </label>
              <button onClick={log} disabled={!caseId || !description.trim()} className="focus-ring ml-auto bg-ink-900 text-white text-sm rounded-md px-4 py-2 disabled:opacity-40 hover:bg-ink-800 transition-colors">
                Log entry
              </button>
            </div>
          </Card>

          <Card className="p-0 overflow-hidden">
            <div className="px-5 py-3 border-b border-ink-100 text-xs uppercase tracking-wide text-ink-400">All time entries</div>
            {timeEntries.length === 0 ? (
              <p className="text-sm text-ink-400 px-5 py-6">No time logged yet.</p>
            ) : (
              <table className="w-full text-sm">
                <tbody className="divide-y divide-ink-100">
                  {timeEntries.map((t) => {
                    const linkedCase = cases.find((c) => c.id === t.caseId);
                    return (
                      <tr key={t.id}>
                        <td className="px-5 py-2.5 w-8">
                          <button onClick={() => toggleTimeEntryBilled(t.id)} className="focus-ring" title="Toggle billed status">
                            {t.billed ? <CheckCircle2 className="w-4 h-4 text-moss-500" /> : <Circle className="w-4 h-4 text-ink-300" />}
                          </button>
                        </td>
                        <td className="px-2 py-2.5">
                          <div className="text-ink-800">{t.description}</div>
                          <div className="text-xs text-ink-400">{linkedCase?.title ?? "Unlinked matter"}</div>
                        </td>
                        <td className="px-2 py-2.5 text-right text-xs text-ink-500 font-mono">{t.minutes} min</td>
                        <td className="px-2 py-2.5 text-right font-mono text-ink-700">₹{minutesToBillable(t.minutes, t.rate).toLocaleString("en-IN")}</td>
                        <td className="px-5 py-2.5 w-8">
                          <button onClick={async () => { if (!confirm(`Delete time entry "${t.description}"?`)) return; try { await removeTimeEntry(t.id); } catch (err: unknown) { alert(err instanceof Error ? err.message : "Delete failed"); } }} aria-label={`Delete ${t.description}`} className="focus-ring text-ink-300 hover:text-rust-500"><Trash2 className="w-3.5 h-3.5" /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="text-xs uppercase tracking-wide text-ink-400 mb-3">Totals by matter</div>
            {totalsByCase.size === 0 ? (
              <p className="text-sm text-ink-400">Nothing logged yet.</p>
            ) : (
              <ul className="space-y-3">
                {Array.from(totalsByCase.entries()).map(([cid, totals]) => {
                  const c = cases.find((x) => x.id === cid);
                  return (
                    <li key={cid} className="text-sm">
                      <div className="text-ink-800 truncate">{c?.title ?? "Unlinked"}</div>
                      <div className="text-xs text-ink-400 flex justify-between mt-0.5">
                        <span>{(totals.minutes / 60).toFixed(1)} hrs total</span>
                        <span className={totals.unbilled > 0 ? "text-brass-600 font-medium" : "text-moss-600"}>
                          ₹{totals.unbilled.toLocaleString("en-IN")} unbilled
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-1.5 mb-3">
              <Receipt className="w-3.5 h-3.5 text-brass-500" />
              <div className="text-xs uppercase tracking-wide text-ink-400">Generate invoice</div>
            </div>
            <select value={invoiceCaseId} onChange={(e) => setInvoiceCaseId(e.target.value)} className="focus-ring w-full text-sm border border-ink-200 rounded-md px-3 py-2 mb-3">
              <option value="">Choose a matter…</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
            {invoiceCaseId && (
              <div className="bg-ink-50 rounded-md p-4 text-sm">
                <div className="font-display text-base text-ink-900 mb-1">{invoiceClient?.name ?? "Client"}</div>
                <div className="text-xs text-ink-400 mb-3">{invoiceCase?.title}</div>
                {invoiceEntries.length === 0 ? (
                  <p className="text-xs text-ink-400">No unbilled time on this matter.</p>
                ) : (
                  <>
                    <ul className="space-y-1.5 mb-3">
                      {invoiceEntries.map((t) => (
                        <li key={t.id} className="flex justify-between text-xs text-ink-600">
                          <span className="truncate pr-2">{t.description}</span>
                          <span className="font-mono shrink-0">₹{minutesToBillable(t.minutes, t.rate).toLocaleString("en-IN")}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex justify-between text-sm font-medium text-ink-900 border-t border-ink-200 pt-2 mb-3">
                      <span>Total due</span>
                      <span className="font-mono">₹{invoiceTotal.toLocaleString("en-IN")}</span>
                    </div>
                    {invoiceClient?.phone && (
                      <a
                        href={buildWhatsAppLink(
                          invoiceClient.phone,
                          `Invoice for ${invoiceCase?.title}: ₹${invoiceTotal.toLocaleString("en-IN")} due for ${invoiceEntries.length} logged item(s). Please reach out with any questions.`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="focus-ring w-full text-xs bg-moss-500 hover:bg-moss-600 text-white rounded-md py-2 flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> Send invoice via WhatsApp
                      </a>
                    )}
                  </>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </Shell>
  );
}
