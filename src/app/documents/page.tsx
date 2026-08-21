"use client";
import { useEffect, useMemo, useState } from "react";
import Shell from "@/components/Shell";
import { PageHeader, Card } from "@/components/ui";
import { useStore } from "@/lib/store";
import { FileText, PenTool, Search, Trash2, Download, Link as LinkIcon } from "lucide-react";

type Sig = { id:string; documentId:string; documentName?:string; signerName:string; signerEmail:string; status:string; token:string; createdAt:string; signedAt?:string };

export default function DocumentsPage(){
  const { cases, ready, removeDocument } = useStore();
  const [q,setQ]=useState("");
  const [page,setPage]=useState(0);
  const [sigs,setSigs]=useState<Sig[]>([]);
  const [sigForm,setSigForm]=useState({ documentId:"", signerName:"", signerEmail:"" });
  const [sigErr,setSigErr]=useState<string|null>(null);
  const pageSize=12;

  const allDocs = useMemo(()=> cases.flatMap(c=> (c.documents as {id:string;caseId:string;name:string;content:string;uploadedAt:string}[]).map(d=> ({...d, caseTitle:c.title, caseId:c.id}))), [cases]);
  const filtered = allDocs.filter(d=> !q || [d.name, d.caseTitle, d.content].join(" ").toLowerCase().includes(q.toLowerCase()));
  const paged = filtered.slice(page*pageSize, (page+1)*pageSize);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const loadSigs = async ()=>{ try{ const r=await fetch("/api/signatures"); if(r.ok) setSigs(await r.json()); }catch{} };
  useEffect(()=>{ loadSigs(); },[]);

  const requestSig = async ()=>{
    if(!sigForm.documentId || !sigForm.signerName.trim() || !sigForm.signerEmail.trim()){ setSigErr("All fields required"); return; }
    setSigErr(null);
    const doc = allDocs.find(d=>d.id===sigForm.documentId);
    const r=await fetch("/api/signatures",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({ documentId:sigForm.documentId, documentName:doc?.name, signerName:sigForm.signerName, signerEmail:sigForm.signerEmail })});
    const d=await r.json().catch(()=>({}));
    if(!r.ok){ setSigErr(d.error||"Failed"); return; }
    setSigForm({ documentId:"", signerName:"", signerEmail:"" }); await loadSigs();
  };
  const download = (doc:{name:string;content:string})=>{
    const blob=new Blob([doc.content],{type:"text/plain"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=doc.name; a.click(); URL.revokeObjectURL(url);
  };

  if(!ready) return <Shell><div className="p-8 text-sm text-ink-400">Loading…</div></Shell>;
  return <Shell>
    <PageHeader eyebrow="Document & Workflow" title="Documents" description={`All ${allDocs.length} matter documents — searchable, with e-signature.`} />
    <div className="px-4 sm:px-8 pb-16 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-300"/><input value={q} onChange={e=>{setQ(e.target.value); setPage(0);}} placeholder="Search documents, matter, content…" className="focus-ring w-full text-sm border border-ink-200 rounded-md pl-9 pr-3 py-2" /></div>
          <span className="text-xs text-ink-400 self-center">{filtered.length} result(s)</span>
        </div>
        {paged.length===0 ? <Card className="p-10 text-center text-sm text-ink-400">No documents match. Upload one from a matter → Documents tab.</Card> :
          <div className="space-y-2">
            {paged.map(d=>(
              <Card key={d.id} className="p-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-brass-500"/><span className="text-sm font-medium text-ink-800 truncate">{d.name}</span></div>
                  <div className="text-xs text-ink-400 mt-1">{d.caseTitle} · {new Date(d.uploadedAt).toLocaleDateString()}</div>
                  <div className="text-xs text-ink-500 mt-1 line-clamp-2 max-w-xl">{d.content.slice(0,180)}</div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={()=>download(d)} className="focus-ring text-ink-400 hover:text-ink-700 p-1.5 border border-ink-200 rounded-md"><Download className="w-3.5 h-3.5"/></button>
                  <button onClick={async()=>{ if(!confirm(`Delete "${d.name}"?`)) return; try{ await removeDocument(d.caseId,d.id);}catch(e){alert(e instanceof Error?e.message:"Delete failed");}}} className="focus-ring text-ink-300 hover:text-rust-500 p-1.5"><Trash2 className="w-3.5 h-3.5"/></button>
                </div>
              </Card>
            ))}
            {pages>1 && <div className="flex justify-between text-sm"><button disabled={page===0} onClick={()=>setPage(p=>p-1)} className="focus-ring border border-ink-200 rounded px-3 py-1 disabled:opacity-40">Prev</button><span className="text-ink-400">{page+1}/{pages}</span><button disabled={page+1>=pages} onClick={()=>setPage(p=>p+1)} className="focus-ring border border-ink-200 rounded px-3 py-1 disabled:opacity-40">Next</button></div>}
          </div>
        }
      </div>
      <div className="space-y-4">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3"><PenTool className="w-4 h-4 text-brass-500"/><h2 className="font-display text-lg">Request e-signature</h2></div>
          <p className="text-xs text-ink-400 mb-3">Native (draw/type). If <code className="font-mono">DOCUSIGN_*</code> env set, also pushes to DocuSign. Share the token link.</p>
          <div className="space-y-2.5">
            <select value={sigForm.documentId} onChange={e=>setSigForm(s=>({...s,documentId:e.target.value}))} className="focus-ring w-full text-sm border border-ink-200 rounded-md px-3 py-2"><option value="">Choose document…</option>{allDocs.map(d=> <option key={d.id} value={d.id}>{d.name} — {d.caseTitle}</option>)}</select>
            <input value={sigForm.signerName} onChange={e=>setSigForm(s=>({...s,signerName:e.target.value}))} placeholder="Signer name" className="focus-ring w-full text-sm border border-ink-200 rounded-md px-3 py-2" />
            <input value={sigForm.signerEmail} onChange={e=>setSigForm(s=>({...s,signerEmail:e.target.value}))} placeholder="Signer email" className="focus-ring w-full text-sm border border-ink-200 rounded-md px-3 py-2" />
            {sigErr && <p className="text-xs text-rust-600">{sigErr}</p>}
            <button onClick={requestSig} disabled={!sigForm.documentId} className="focus-ring w-full bg-ink-900 text-white text-sm rounded-md py-2 disabled:opacity-40">Create link</button>
          </div>
        </Card>
        <Card className="p-5">
          <div className="text-xs uppercase tracking-wide text-ink-400 mb-3">Signature requests</div>
          {sigs.length===0 ? <p className="text-sm text-ink-400">None yet.</p> :
            <ul className="space-y-3">
              {sigs.map(s=>(
                <li key={s.id} className="border border-ink-100 rounded-md p-3">
                  <div className="text-sm text-ink-800">{s.documentName || s.documentId}</div>
                  <div className="text-xs text-ink-400">{s.signerName} · {s.signerEmail} · <span className={s.status==="signed"?"text-moss-600":s.status==="pending"?"text-brass-600":"text-rust-600"}>{s.status}</span></div>
                  {s.status==="pending" && <div className="mt-2 flex items-center gap-1.5 text-xs font-mono bg-ink-50 rounded px-2 py-1.5 overflow-hidden"><LinkIcon className="w-3 h-3 shrink-0"/><a href={`/sign/${s.token}`} target="_blank" className="truncate text-brass-600 hover:underline">/sign/{s.token}</a><button onClick={()=>navigator.clipboard.writeText(`${location.origin}/sign/${s.token}`)} className="ml-auto text-ink-400 hover:text-ink-600">Copy</button></div>}
                  {s.signedAt && <div className="text-xs text-moss-600 mt-1">Signed {new Date(s.signedAt).toLocaleString()}</div>}
                </li>
              ))}
            </ul>
          }
        </Card>
      </div>
    </div>
  </Shell>;
}
