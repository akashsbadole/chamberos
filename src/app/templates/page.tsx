"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import { PageHeader, Card } from "@/components/ui";
import { renderTemplate, TEMPLATE_CATEGORIES, DEFAULT_TEMPLATES } from "@/lib/doc-templates";
import { useStore } from "@/lib/store";
import { Trash2, FilePlus, Edit2 } from "lucide-react";

type Tmpl = { id: string; firmId: string; name: string; category: string; body: string; createdAt: string; updatedAt: string };

export default function TemplatesPage(){
  const { clients, cases, ready } = useStore();
  const [templates, setTemplates] = useState<Tmpl[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({ name:"", category:"other", body:"" });
  const [editing, setEditing] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const load = async ()=>{
    setLoading(true);
    try{ const r=await fetch("/api/templates"); const d=await r.json(); if(!r.ok) throw new Error(d.error||`Failed ${r.status}`); setTemplates(d); } catch(e){ setErr(e instanceof Error?e.message:"Failed"); } finally{ setLoading(false); }
  };
  useEffect(()=>{ load(); },[]);

  const create = async ()=>{
    if(!form.name.trim()||!form.body.trim()){ setErr("name and body required"); return; }
    if(editing){
      const r=await fetch(`/api/templates/${editing}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify(form)});
      if(!r.ok){ const d=await r.json(); setErr(d.error||"Update failed"); return; }
    } else {
      const r=await fetch("/api/templates",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(form)});
      if(!r.ok){ const d=await r.json(); setErr(d.error||"Create failed"); return; }
    }
    setForm({ name:"", category:"other", body:"" }); setEditing(null); setErr(null); await load();
  };
  const seedDefaults = async ()=>{
    for(const d of DEFAULT_TEMPLATES){ await fetch("/api/templates",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(d)}); }
    await load();
  };
  const remove = async (id:string)=>{
    if(!confirm("Delete template?")) return;
    const r=await fetch(`/api/templates/${id}`,{method:"DELETE"});
    if(!r.ok){ const d=await r.json(); alert(d.error||"Delete failed"); return; }
    await load();
  };
  const startEdit = (t:Tmpl)=>{ setForm({ name:t.name, category:t.category, body:t.body }); setEditing(t.id); };

  const filtered = templates.filter(t=>!q|| [t.name,t.category,t.body].join(" ").toLowerCase().includes(q.toLowerCase()));

  const preview = (body:string)=>{
    const sampleClient = clients[0];
    const sampleCase = cases[0];
    return renderTemplate(body, {
      "client.name": sampleClient?.name ?? "A. Client",
      "client.email": sampleClient?.email ?? "client@example.com",
      "client.phone": sampleClient?.phone ?? "9876543210",
      "case.title": sampleCase?.title ?? "Sample Matter",
      "case.caseNumber": sampleCase?.caseNumber ?? "CS/123/2026",
      "case.courtName": sampleCase?.courtName ?? "District Court",
      "firm.name": "Chambers",
      "date": new Date().toLocaleDateString("en-IN"),
      "matterType": sampleClient?.matterType ?? "Civil",
    });
  };

  if(!ready) return <Shell><div className="p-8 text-sm text-ink-400">Loading…</div></Shell>;

  return <Shell>
    <PageHeader eyebrow="Document Automation" title="Templates" description="Reusable templates for contracts, pleadings, and letters. Use {{client.name}}, {{case.title}}, {{date}} merge fields." action={<button onClick={seedDefaults} className="focus-ring text-xs border border-ink-200 rounded-md px-3 py-1.5">Seed defaults</button>} />
    <div className="px-4 sm:px-8 pb-16 grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Card className="p-5">
          <div className="text-xs uppercase tracking-wide text-ink-400 mb-3">{editing? "Edit template" : "New template"}</div>
          <div className="space-y-3">
            <input value={form.name} onChange={e=>setForm(s=>({...s,name:e.target.value}))} placeholder="Template name (e.g. Engagement Letter)" className="focus-ring w-full text-sm border border-ink-200 rounded-md px-3 py-2" />
            <select value={form.category} onChange={e=>setForm(s=>({...s,category:e.target.value}))} className="focus-ring w-full text-sm border border-ink-200 rounded-md px-3 py-2">
              {TEMPLATE_CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <textarea value={form.body} onChange={e=>setForm(s=>({...s,body:e.target.value}))} rows={10} placeholder="Body with {{client.name}} etc." className="focus-ring w-full text-sm border border-ink-200 rounded-md px-3 py-2 font-mono" />
            {err && <p className="text-xs text-rust-600">{err}</p>}
            <div className="flex gap-2">
              <button onClick={create} className="focus-ring bg-ink-900 text-white text-sm rounded-md px-4 py-2 flex items-center gap-1.5"><FilePlus className="w-4 h-4"/>{editing?"Update":"Create"}</button>
              {editing && <button onClick={()=>{setEditing(null); setForm({ name:"",category:"other",body:"" });}} className="focus-ring text-sm border border-ink-200 rounded-md px-3 py-2">Cancel</button>}
            </div>
          </div>
        </Card>
        {form.body && <Card className="p-5"><div className="text-xs uppercase tracking-wide text-ink-400 mb-2">Preview (sample data)</div><pre className="whitespace-pre-wrap text-xs text-ink-700 bg-ink-50 rounded p-3">{preview(form.body)}</pre></Card>}
      </div>
      <div className="lg:col-span-3 space-y-3">
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search templates…" className="focus-ring w-full text-sm border border-ink-200 rounded-md px-3 py-2" />
        {loading ? <Card className="p-6 text-sm text-ink-400">Loading…</Card> :
          filtered.length===0 ? <Card className="p-10 text-center text-sm text-ink-400">No templates yet. Create one or seed defaults.</Card> :
          <div className="space-y-3">
            {filtered.map(t=>(
              <Card key={t.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div><div className="font-medium text-ink-800 text-sm">{t.name}</div><div className="text-xs text-ink-400 capitalize">{t.category} · {new Date(t.createdAt).toLocaleDateString()}</div></div>
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={()=>startEdit(t)} className="focus-ring text-ink-400 hover:text-ink-700 p-1"><Edit2 className="w-4 h-4"/></button>
                    <button onClick={()=>remove(t.id)} className="focus-ring text-ink-300 hover:text-rust-500 p-1"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </div>
                <pre className="whitespace-pre-wrap text-xs text-ink-600 bg-ink-50 rounded p-3 mt-3 max-h-40 overflow-auto">{t.body.slice(0,400)}</pre>
                <details className="mt-3"><summary className="text-xs text-brass-600 cursor-pointer">Preview with sample data</summary><pre className="whitespace-pre-wrap text-xs text-ink-700 bg-ink-50 rounded p-3 mt-2">{preview(t.body)}</pre></details>
              </Card>
            ))}
          </div>
        }
      </div>
    </div>
  </Shell>;
}
