"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import { PageHeader, Card } from "@/components/ui";
import { useStore } from "@/lib/store";
import { MessageSquare, Send, Trash2 } from "lucide-react";

type Thread = { id:string; firmId:string; clientId:string; caseId?:string; subject?:string; updatedAt:string; clientName?:string; lastBody?:string };
type Msg = { id:string; threadId:string; sender:string; body:string; createdAt:string };

export default function MessagesPage(){
  const { clients, cases, ready } = useStore();
  const [threads,setThreads]=useState<Thread[]>([]);
  const [selected,setSelected]=useState<string|null>(null);
  const [msgs,setMsgs]=useState<Msg[]>([]);
  const [loading,setLoading]=useState(true);
  const [err,setErr]=useState<string|null>(null);
  const [newThread,setNewThread]=useState({ clientId:"", caseId:"", subject:"", body:"" });
  const [reply,setReply]=useState("");

  const loadThreads=async()=>{
    setLoading(true);
    try{ const r=await fetch("/api/message-threads"); const d=await r.json(); if(!r.ok) throw new Error(d.error||`Failed ${r.status}`); setThreads(d); if(d.length && !selected) setSelected(d[0].id); } catch(e){ setErr(e instanceof Error?e.message:"Failed"); } finally{ setLoading(false); }
  };
  const loadMsgs=async(id:string)=>{
    try{ const r=await fetch(`/api/message-threads/${id}`); const d=await r.json(); if(r.ok){ setMsgs(d.messages||[]); } }catch{}
  };
  useEffect(()=>{ loadThreads(); },[]);
  useEffect(()=>{ if(selected) loadMsgs(selected); },[selected]);

  const createThread=async()=>{
    if(!newThread.clientId || !newThread.body.trim()){ setErr("Client and message required"); return; }
    setErr(null);
    const r=await fetch("/api/message-threads",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(newThread)});
    const d=await r.json().catch(()=>({}));
    if(!r.ok){ setErr(d.error||"Failed"); return; }
    setNewThread({ clientId:"", caseId:"", subject:"", body:"" }); await loadThreads(); setSelected(d.id);
  };
  const sendReply=async()=>{
    if(!selected || !reply.trim()) return;
    const r=await fetch(`/api/message-threads/${selected}`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({ body: reply })});
    if(!r.ok){ const d=await r.json(); setErr(d.error||"Failed"); return; }
    setReply(""); await loadMsgs(selected); await loadThreads();
  };
  const deleteThread=async(id:string)=>{
    if(!confirm("Delete thread?")) return;
    const r=await fetch(`/api/message-threads/${id}`,{method:"DELETE"});
    if(!r.ok){ const d=await r.json(); alert(d.error||"Delete failed"); return; }
    await loadThreads(); setSelected(null); setMsgs([]);
  };

  if(!ready) return <Shell><div className="p-8 text-sm text-ink-400">Loading…</div></Shell>;
  return <Shell>
    <PageHeader eyebrow="Communication" title="Messages" description="Secure 2-way messaging with clients — per matter, encrypted at rest. Email via RESEND_* and video link via meetingLink." />
    <div className="px-4 sm:px-8 pb-16 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="space-y-4">
        <Card className="p-5">
          <div className="text-xs uppercase tracking-wide text-ink-400 mb-3">New thread</div>
          <div className="space-y-2.5">
            <select value={newThread.clientId} onChange={e=>setNewThread(s=>({...s,clientId:e.target.value}))} className="focus-ring w-full text-sm border border-ink-200 rounded-md px-3 py-2"><option value="">Choose client…</option>{clients.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            <select value={newThread.caseId} onChange={e=>setNewThread(s=>({...s,caseId:e.target.value}))} className="focus-ring w-full text-sm border border-ink-200 rounded-md px-3 py-2"><option value="">General (no matter)</option>{cases.filter(c=>c.clientId===newThread.clientId || !newThread.clientId).map(c=> <option key={c.id} value={c.id}>{c.title}</option>)}</select>
            <input value={newThread.subject} onChange={e=>setNewThread(s=>({...s,subject:e.target.value}))} placeholder="Subject (optional)" className="focus-ring w-full text-sm border border-ink-200 rounded-md px-3 py-2" />
            <textarea value={newThread.body} onChange={e=>setNewThread(s=>({...s,body:e.target.value}))} rows={3} placeholder="Message…" className="focus-ring w-full text-sm border border-ink-200 rounded-md px-3 py-2" />
            {err && <p className="text-xs text-rust-600">{err}</p>}
            <button onClick={createThread} className="focus-ring w-full bg-ink-900 text-white text-sm rounded-md py-2 flex items-center justify-center gap-1.5"><MessageSquare className="w-4 h-4"/>Start thread</button>
          </div>
        </Card>
        <Card className="p-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-ink-100 text-xs uppercase tracking-wide text-ink-400">Threads ({threads.length})</div>
          {loading ? <p className="text-sm text-ink-400 p-5">Loading…</p> : threads.length===0 ? <p className="text-sm text-ink-400 p-5">No threads yet.</p> :
            <ul className="divide-y divide-ink-100 max-h-[50vh] overflow-auto">
              {threads.map(t=>(
                <li key={t.id} onClick={()=>setSelected(t.id)} className={`px-5 py-3 cursor-pointer flex justify-between gap-2 ${selected===t.id?"bg-ink-50":"hover:bg-ink-50/60"}`}>
                  <div className="min-w-0"><div className="text-sm text-ink-800 truncate">{t.subject || t.clientName || "Thread"}</div><div className="text-xs text-ink-400 truncate">{t.lastBody || "No messages"}</div></div>
                  <button onClick={(e)=>{e.stopPropagation(); deleteThread(t.id);}} className="focus-ring text-ink-300 hover:text-rust-500 p-1 shrink-0"><Trash2 className="w-3.5 h-3.5"/></button>
                </li>
              ))}
            </ul>
          }
        </Card>
      </div>
      <div className="lg:col-span-2">
        {!selected ? <Card className="p-10 text-center text-sm text-ink-400">Select a thread to view messages.</Card> :
          <Card className="flex flex-col h-[70vh]">
            <div className="px-5 py-3 border-b border-ink-100 text-xs text-ink-400">{threads.find(t=>t.id===selected)?.clientName} · {msgs.length} message(s)</div>
            <div className="flex-1 overflow-auto p-5 space-y-3">
              {msgs.length===0 ? <p className="text-sm text-ink-400">No messages yet.</p> :
                msgs.map(m=>(
                  <div key={m.id} className={`flex ${m.sender==="firm" ? "justify-end":"justify-start"}`}>
                    <div className={`max-w-[80%] rounded-lg px-3.5 py-2.5 text-sm whitespace-pre-wrap ${m.sender==="firm"?"bg-ink-900 text-white":"bg-ink-100 text-ink-800"}`}>
                      <div>{m.body}</div>
                      <div className={`text-[11px] mt-1 ${m.sender==="firm"?"text-ink-300":"text-ink-400"}`}>{new Date(m.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                ))
              }
            </div>
            <div className="p-3 border-t border-ink-100 flex gap-2">
              <input value={reply} onChange={e=>setReply(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter" && !e.shiftKey){ e.preventDefault(); sendReply(); }}} placeholder="Type a reply…" className="focus-ring flex-1 text-sm border border-ink-200 rounded-md px-3 py-2" />
              <button onClick={sendReply} disabled={!reply.trim()} className="focus-ring bg-ink-900 text-white text-sm rounded-md px-4 py-2 disabled:opacity-40 flex items-center gap-1.5"><Send className="w-4 h-4"/>Send</button>
            </div>
          </Card>
        }
      </div>
    </div>
  </Shell>;
}
