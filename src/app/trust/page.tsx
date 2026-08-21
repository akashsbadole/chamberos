"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import { PageHeader, Card } from "@/components/ui";
import { useStore } from "@/lib/store";
import { Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";

type Acc = { id:string; firmId:string; clientId:string; balance:string; clientName?:string; createdAt:string; updatedAt:string };
type Txn = { id:string; type:string; amount:string; balanceAfter:string; description?:string; reference?:string; createdAt:string };

export default function TrustPage(){
  const { clients, ready } = useStore();
  const [accounts,setAccounts]=useState<Acc[]>([]);
  const [selected,setSelected]=useState<string | null>(null);
  const [txns,setTxns]=useState<Txn[]>([]);
  const [loading,setLoading]=useState(true);
  const [err,setErr]=useState<string|null>(null);
  const [form,setForm]=useState({ clientId:"", type:"deposit" as "deposit"|"withdrawal", amount:"", description:"" });

  const loadAccounts=async()=>{
    setLoading(true);
    try{ const r=await fetch("/api/trust-accounts"); const d=await r.json(); if(!r.ok) throw new Error(d.error||`Failed ${r.status}`); setAccounts(d); if(d.length && !selected) setSelected(d[0].id);
    } catch(e){ setErr(e instanceof Error?e.message:"Failed"); } finally{ setLoading(false); }
  };
  const loadTxns=async(id:string)=>{
    try{ const r=await fetch(`/api/trust-accounts/${id}/transactions`); const d=await r.json(); if(r.ok) setTxns(d.transactions||[]); }catch{}
  };
  useEffect(()=>{ loadAccounts(); },[]);
  useEffect(()=>{ if(selected) loadTxns(selected); },[selected]);

  const createAccount=async()=>{
    if(!form.clientId) { setErr("Choose client"); return; }
    setErr(null);
    const r=await fetch("/api/trust-accounts",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({ clientId: form.clientId })});
    const d=await r.json().catch(()=>({}));
    if(!r.ok){ setErr(d.error||"Failed"); return; }
    await loadAccounts(); setSelected(d.id);
  };
  const submitTxn=async()=>{
    if(!selected || !form.amount) return;
    const r=await fetch(`/api/trust-accounts/${selected}/transactions`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({ type: form.type, amount: Number(form.amount), description: form.description || undefined })});
    const d=await r.json().catch(()=>({}));
    if(!r.ok){ setErr(d.error||"Failed"); return; }
    setForm(s=>({...s, amount:"", description:""})); setErr(null);
    await loadAccounts(); await loadTxns(selected);
  };

  if(!ready) return <Shell><div className="p-8 text-sm text-ink-400">Loading…</div></Shell>;
  return <Shell>
    <PageHeader eyebrow="Compliance" title="Trust Accounting (IOLTA)" description="Separate client funds — deposits, withdrawals, reconciliation. All transactions are audited." />
    <div className="px-4 sm:px-8 pb-16 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="space-y-4">
        <Card className="p-5">
          <div className="text-xs uppercase tracking-wide text-ink-400 mb-3">Create / select account</div>
          <div className="flex gap-2">
            <select value={form.clientId} onChange={e=>setForm(s=>({...s,clientId:e.target.value}))} className="focus-ring flex-1 text-sm border border-ink-200 rounded-md px-3 py-2">
              <option value="">Choose client…</option>
              {clients.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button onClick={createAccount} className="focus-ring bg-ink-900 text-white text-sm rounded-md px-4 py-2">Create</button>
          </div>
          {err && <p className="text-xs text-rust-600 mt-2">{err}</p>}
        </Card>
        <Card className="p-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-ink-100 text-xs uppercase tracking-wide text-ink-400">Trust accounts ({accounts.length})</div>
          {loading ? <p className="text-sm text-ink-400 p-5">Loading…</p> : accounts.length===0 ? <p className="text-sm text-ink-400 p-5">No trust accounts yet.</p> :
            <ul className="divide-y divide-ink-100">
              {accounts.map(a=>(
                <li key={a.id} onClick={()=>setSelected(a.id)} className={`px-5 py-3 flex items-center justify-between cursor-pointer ${selected===a.id ? "bg-ink-50":"hover:bg-ink-50/60"}`}>
                  <div><div className="text-sm text-ink-800">{a.clientName || clients.find(c=>c.id===a.clientId)?.name || a.clientId}</div><div className="text-xs text-ink-400">Balance</div></div>
                  <div className="text-right"><div className="text-sm font-mono text-ink-900">₹{Number(a.balance).toLocaleString("en-IN")}</div><div className="text-xs text-ink-400">{new Date(a.updatedAt).toLocaleDateString()}</div></div>
                </li>
              ))}
            </ul>
          }
        </Card>
      </div>
      <div className="lg:col-span-2 space-y-4">
        {!selected ? <Card className="p-10 text-center text-sm text-ink-400">Select an account to view ledger.</Card> :
          <>
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3"><Wallet className="w-4 h-4 text-brass-500"/><h2 className="font-display text-lg">Ledger</h2></div>
              <div className="flex flex-wrap gap-2.5 items-end">
                <label className="block"><span className="block text-xs text-ink-500 mb-1">Type</span><select value={form.type} onChange={e=>setForm(s=>({...s,type:e.target.value as "deposit"|"withdrawal"}))} className="focus-ring text-sm border border-ink-200 rounded-md px-3 py-2"><option value="deposit">Deposit (client → trust)</option><option value="withdrawal">Withdrawal (trust → operating)</option></select></label>
                <label className="block"><span className="block text-xs text-ink-500 mb-1">Amount (₹)</span><input type="number" min={1} value={form.amount} onChange={e=>setForm(s=>({...s,amount:e.target.value}))} className="focus-ring w-28 text-sm border border-ink-200 rounded-md px-3 py-2" /></label>
                <input value={form.description} onChange={e=>setForm(s=>({...s,description:e.target.value}))} placeholder="Description / reference" className="focus-ring flex-1 text-sm border border-ink-200 rounded-md px-3 py-2" />
                <button onClick={submitTxn} disabled={!form.amount} className="focus-ring bg-ink-900 text-white text-sm rounded-md px-4 py-2 disabled:opacity-40">Post</button>
              </div>
            </Card>
            <Card className="p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-ink-50 text-ink-500 text-xs uppercase tracking-wide"><tr><th className="text-left px-5 py-2">Date</th><th className="text-left px-3 py-2">Type</th><th className="text-right px-3 py-2">Amount</th><th className="text-right px-5 py-2">Balance</th></tr></thead>
                <tbody className="divide-y divide-ink-100">
                  {txns.length===0 ? <tr><td colSpan={4} className="px-5 py-6 text-center text-sm text-ink-400">No transactions yet.</td></tr> :
                    txns.map(t=>(
                      <tr key={t.id}>
                        <td className="px-5 py-2.5 text-xs text-ink-500">{new Date(t.createdAt).toLocaleDateString()} {new Date(t.createdAt).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</td>
                        <td className="px-3 py-2.5"><span className={`inline-flex items-center gap-1 text-xs ${t.type==="deposit"?"text-moss-600":"text-rust-600"}`}>{t.type==="deposit"?<ArrowDownRight className="w-3 h-3"/>:<ArrowUpRight className="w-3 h-3"/>}{t.type}</span><div className="text-xs text-ink-400">{t.description}</div></td>
                        <td className="px-3 py-2.5 text-right font-mono text-ink-700">₹{Number(t.amount).toLocaleString("en-IN")}</td>
                        <td className="px-5 py-2.5 text-right font-mono text-ink-900">₹{Number(t.balanceAfter).toLocaleString("en-IN")}</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </Card>
          </>
        }
      </div>
    </div>
  </Shell>;
}
