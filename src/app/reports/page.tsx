"use client";
import { useMemo, useState } from "react";
import Shell from "@/components/Shell";
import { PageHeader, Card } from "@/components/ui";
import { useStore } from "@/lib/store";
import { BarChart } from "@/components/Charts";
import { minutesToBillable } from "@/lib/ai";
import { Download, Filter } from "lucide-react";

export default function ReportsPage(){
  const { cases, clients, timeEntries, events, ready } = useStore();
  const [clientId,setClientId]=useState("");
  const [status,setStatus]=useState("");
  const [from,setFrom]=useState("");
  const [to,setTo]=useState("");

  const filteredCases = useMemo(()=>{
    return cases.filter(c=>{
      if(clientId && c.clientId!==clientId) return false;
      if(status && c.status!==status) return false;
      if(from && new Date(c.createdAt) < new Date(from)) return false;
      if(to && new Date(c.createdAt) > new Date(to)) return false;
      return true;
    });
  },[cases,clientId,status,from,to]);

  const filteredEntries = useMemo(()=>{
    const caseIds = new Set(filteredCases.map(c=>c.id));
    return timeEntries.filter(t=> caseIds.has(t.caseId) && (!from|| new Date(t.createdAt)>=new Date(from)) && (!to|| new Date(t.createdAt)<=new Date(to)));
  },[timeEntries,filteredCases,from,to]);

  const billingByMatter = useMemo(()=>{
    const map=new Map<string, number>();
    for(const t of filteredEntries){ map.set(t.caseId, (map.get(t.caseId)||0)+ minutesToBillable(t.minutes, Number(t.rate))); }
    return Array.from(map.entries()).map(([id,amount])=> ({ name: cases.find(c=>c.id===id)?.title?.slice(0,18) ?? id.slice(0,8), value: Math.round(amount/1000) }));
  },[filteredEntries,cases]);

  const profitability = useMemo(()=>{
    let revenue=0, cost=0;
    for(const t of filteredEntries){
      revenue += minutesToBillable(t.minutes, Number(t.rate));
      const cr = (t as unknown as { costRate?: string|number }).costRate;
      if(cr) cost += (Number(cr) * t.minutes)/60;
    }
    return { revenue, cost, profit: revenue-cost, margin: revenue? ((revenue-cost)/revenue*100).toFixed(1): "0" };
  },[filteredEntries]);

  const statusBreakdown = [
    { name:"Open", value: filteredCases.filter(c=>c.status==="open").length },
    { name:"Pending", value: filteredCases.filter(c=>c.status==="pending_filing").length },
    { name:"In Court", value: filteredCases.filter(c=>c.status==="in_court").length },
    { name:"Closed", value: filteredCases.filter(c=>c.status==="closed").length },
  ];

  const exportCSV = ()=>{
    const rows = [["Matter","Client","Status","Created"], ...filteredCases.map(c=> [c.title, clients.find(cl=>cl.id===c.clientId)?.name||"", c.status, c.createdAt])];
    const csv = rows.map(r=> r.map(v=> `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob=new Blob([csv],{type:"text/csv"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download="report.csv"; a.click(); URL.revokeObjectURL(url);
  };

  if(!ready) return <Shell><div className="p-8 text-sm text-ink-400">Loading…</div></Shell>;
  return <Shell>
    <PageHeader eyebrow="Reporting & Analytics" title="Reports" description="Case progress, billing by matter, profitability — filter by client, status, date and export." action={<button onClick={exportCSV} className="focus-ring bg-ink-900 text-white text-sm rounded-md px-4 py-2 flex items-center gap-1.5"><Download className="w-4 h-4"/>Export CSV</button>} />
    <div className="px-4 sm:px-8 pb-8">
      <Card className="p-4 mb-6">
        <div className="flex items-center gap-2 mb-3"><Filter className="w-4 h-4 text-ink-400"/><span className="text-xs uppercase tracking-wide text-ink-400">Filters</span></div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <select value={clientId} onChange={e=>setClientId(e.target.value)} className="focus-ring text-sm border border-ink-200 rounded-md px-3 py-2"><option value="">All clients</option>{clients.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <select value={status} onChange={e=>setStatus(e.target.value)} className="focus-ring text-sm border border-ink-200 rounded-md px-3 py-2"><option value="">All statuses</option><option value="open">Open</option><option value="pending_filing">Pending</option><option value="in_court">In Court</option><option value="closed">Closed</option></select>
          <input type="date" value={from} onChange={e=>setFrom(e.target.value)} className="focus-ring text-sm border border-ink-200 rounded-md px-3 py-2" />
          <input type="date" value={to} onChange={e=>setTo(e.target.value)} className="focus-ring text-sm border border-ink-200 rounded-md px-3 py-2" />
        </div>
        <div className="text-xs text-ink-400 mt-2">{filteredCases.length} matter(s) · {filteredEntries.length} time entries · {events.length} events</div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="font-display text-lg mb-4">Matters by status</h3>
          <BarChart data={statusBreakdown} label="Matters" />
        </Card>
        <Card className="p-6">
          <h3 className="font-display text-lg mb-4">Billing by matter (₹k)</h3>
          {billingByMatter.length===0 ? <p className="text-sm text-ink-400">No billable time in range.</p> : <BarChart data={billingByMatter.slice(0,8)} label="Billing" />}
        </Card>
        <Card className="p-6">
          <h3 className="font-display text-lg mb-2">Profitability</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-ink-500">Revenue</span><span className="font-mono">₹{profitability.revenue.toLocaleString("en-IN")}</span></div>
            <div className="flex justify-between"><span className="text-ink-500">Cost ({filteredEntries.length} entries)</span><span className="font-mono">₹{Math.round(profitability.cost).toLocaleString("en-IN")}</span></div>
            <div className="flex justify-between border-t border-ink-100 pt-2 font-medium"><span>Profit</span><span className="font-mono text-moss-600">₹{Math.round(profitability.profit).toLocaleString("en-IN")} ({profitability.margin}%)</span></div>
            <p className="text-xs text-ink-400">Cost derived from time-entry costRate (set per entry for associate cost). Revenue = billable rate × hours.</p>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="bg-ink-50 rounded p-3"><div className="text-lg font-display">{filteredCases.length}</div><div className="text-xs text-ink-400">Matters</div></div>
            <div className="bg-ink-50 rounded p-3"><div className="text-lg font-display">{(filteredEntries.reduce((s,t)=>s+t.minutes,0)/60).toFixed(1)}h</div><div className="text-xs text-ink-400">Hours</div></div>
            <div className="bg-ink-50 rounded p-3"><div className="text-lg font-display">₹{Math.round(profitability.revenue/1000)}k</div><div className="text-xs text-ink-400">Billed</div></div>
          </div>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden mt-6">
        <div className="px-5 py-3 border-b border-ink-100 text-xs uppercase tracking-wide text-ink-400">Matter detail (filtered)</div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-50 text-ink-500 text-xs"><tr><th className="text-left px-5 py-2">Matter</th><th className="text-left px-3 py-2">Client</th><th className="text-left px-3 py-2">Status</th><th className="text-right px-3 py-2">Hours</th><th className="text-right px-5 py-2">Billed</th></tr></thead>
            <tbody className="divide-y divide-ink-100">
              {filteredCases.slice(0,20).map(c=>{
                const hrs = filteredEntries.filter(t=>t.caseId===c.id).reduce((s,t)=>s+t.minutes,0)/60;
                const billed = filteredEntries.filter(t=>t.caseId===c.id).reduce((s,t)=>s+minutesToBillable(t.minutes, Number(t.rate)),0);
                return <tr key={c.id}><td className="px-5 py-2.5 text-ink-800">{c.title}</td><td className="px-3 py-2.5 text-ink-500">{clients.find(cl=>cl.id===c.clientId)?.name||"—"}</td><td className="px-3 py-2.5 text-ink-500 capitalize">{c.status.replace("_"," ")}</td><td className="px-3 py-2.5 text-right font-mono">{hrs.toFixed(1)}</td><td className="px-5 py-2.5 text-right font-mono">₹{billed.toLocaleString("en-IN")}</td></tr>;
              })}
              {filteredCases.length===0 && <tr><td colSpan={5} className="px-5 py-6 text-center text-sm text-ink-400">No matters match filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-5 mt-6 bg-ink-900 text-ink-100 border-ink-900">
        <h3 className="font-display">Integrations status (env hooks)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 text-xs">
          <div className="bg-ink-800 rounded p-3"><div className="text-brass-200 font-medium">Court: eCourts / PACER / CM/ECF</div><div className="text-ink-400 mt-1">Set <code className="font-mono">ECOURTS_API_URL</code>, <code>PACER_*</code>, <code>CMECF_*</code> — current: {typeof window!=="undefined" && (process.env.NEXT_PUBLIC_ECOURTS?"configured":"simulated")}</div></div>
          <div className="bg-ink-800 rounded p-3"><div className="text-brass-200 font-medium">Research: Westlaw / LexisNexis</div><div className="text-ink-400 mt-1">Set <code>WESTLAW_*</code>, <code>LEXISNEXIS_*</code> — AI research works without them.</div></div>
          <div className="bg-ink-800 rounded p-3"><div className="text-brass-200 font-medium">Accounting: QuickBooks / Xero</div><div className="text-ink-400 mt-1">Set <code>QUICKBOOKS_*</code>, <code>XERO_*</code> — invoices push when configured.</div></div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <button onClick={async()=>{ const r=await fetch("/api/cron/recurring-invoices"); const d=await r.json().catch(()=>({})); alert(r.ok ? `Recurring cron: ${d.created} created of ${d.evaluated} evaluated` : d.error||"Failed"); }} className="focus-ring text-xs bg-brass-500 hover:bg-brass-600 text-white rounded-md px-3 py-1.5">Run recurring cron now</button>
          <a href="/api/events/ics" className="focus-ring text-xs bg-ink-700 hover:bg-ink-600 text-white rounded-md px-3 py-1.5">Download calendar .ics</a>
        </div>
        <p className="text-[11px] text-ink-400 mt-2">Cron: <code className="font-mono">GET /api/cron/recurring-invoices</code> (add <code>CRON_SECRET</code> header for Vercel Cron) — generates invoices where <code>nextRunAt ≤ now</code> and pushes to accounting/email.</p>
      </Card>
    </div>
  </Shell>;
}
