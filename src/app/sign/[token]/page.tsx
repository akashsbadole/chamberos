"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui";

export default function SignPage(){
  const { token } = useParams<{token:string}>();
  const [data,setData]=useState<{documentName?:string;signerName:string;signerEmail:string;status:string;signedAt?:string}|null>(null);
  const [err,setErr]=useState<string|null>(null);
  const [typed,setTyped]=useState("");
  const [saving,setSaving]=useState(false);
  const [done,setDone]=useState(false);
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const drawing=useRef(false);

  const load=async()=>{
    try{ const r=await fetch(`/api/sign/${token}`); const d=await r.json(); if(!r.ok) throw new Error(d.error||`Failed ${r.status}`); setData(d);}catch(e){ setErr(e instanceof Error?e.message:"Failed");}
  };
  useEffect(()=>{ load(); },[token]);

  useEffect(()=>{
    const c=canvasRef.current; if(!c) return;
    const ctx=c.getContext("2d"); if(!ctx) return;
    ctx.strokeStyle="#1a1a1a"; ctx.lineWidth=2; ctx.lineCap="round";
    const pos=(e:MouseEvent|TouchEvent)=>{
      const rect=c.getBoundingClientRect();
      const t = (e as TouchEvent).touches?.[0] as unknown as {clientX:number;clientY:number}|undefined;
      const src = t ?? e as MouseEvent;
      return { x: src.clientX - rect.left, y: src.clientY - rect.top };
    };
    const down=(e:MouseEvent|TouchEvent)=>{ drawing.current=true; const p=pos(e); ctx.beginPath(); ctx.moveTo(p.x,p.y); e.preventDefault(); };
    const move=(e:MouseEvent|TouchEvent)=>{ if(!drawing.current) return; const p=pos(e); ctx.lineTo(p.x,p.y); ctx.stroke(); e.preventDefault(); };
    const up=()=>{ drawing.current=false; };
    c.addEventListener("mousedown",down); c.addEventListener("mousemove",move); window.addEventListener("mouseup",up);
    c.addEventListener("touchstart",down,{passive:false}); c.addEventListener("touchmove",move,{passive:false}); window.addEventListener("touchend",up);
    return ()=>{ c.removeEventListener("mousedown",down); c.removeEventListener("mousemove",move); window.removeEventListener("mouseup",up); c.removeEventListener("touchstart",down); c.removeEventListener("touchmove",move); window.removeEventListener("touchend",up); };
  },[data]);

  const clearCanvas=()=>{ const c=canvasRef.current; const ctx=c?.getContext("2d"); if(ctx&&c){ ctx.clearRect(0,0,c.width,c.height);} };

  const submit=async(decline=false)=>{
    if(!decline){
      const c=canvasRef.current;
      let dataUrl = "";
      if(c){ try{ dataUrl=c.toDataURL(); }catch{} }
      // if canvas blank, use typed
      const isBlank = !dataUrl || dataUrl==="data:,";
      const payload = isBlank ? typed.trim() : dataUrl;
      if(!payload){ setErr("Draw or type your signature"); return; }
      setSaving(true); setErr(null);
      const r=await fetch(`/api/sign/${token}`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({ signatureData: payload })});
      const d=await r.json().catch(()=>({}));
      if(!r.ok){ setErr(d.error||"Failed"); setSaving(false); return; }
      setDone(true); setSaving(false); await load();
    } else {
      setSaving(true);
      const r=await fetch(`/api/sign/${token}`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({ action:"decline"})});
      const d=await r.json().catch(()=>({}));
      if(!r.ok){ setErr(d.error||"Failed"); setSaving(false); return; }
      setDone(true); setSaving(false); await load();
    }
  };

  if(err && !data) return <div className="min-h-screen flex items-center justify-center p-8"><Card className="p-6 text-sm text-rust-600">{err}</Card></div>;
  if(!data) return <div className="min-h-screen flex items-center justify-center p-8 text-sm text-ink-400">Loading…</div>;
  if(data.status!=="pending") return <div className="min-h-screen flex items-center justify-center p-8"><Card className="p-6 text-center"><div className="text-lg font-display">{data.status==="signed"?"Already signed":"Request "+data.status}</div><div className="text-sm text-ink-400 mt-1">{data.documentName}</div>{data.signedAt && <div className="text-xs text-moss-600 mt-2">Signed {new Date(data.signedAt).toLocaleString()}</div>}</Card></div>;

  return <div className="min-h-screen bg-paper flex flex-col items-center py-10 px-4">
    <Card className="w-full max-w-xl p-6 space-y-4">
      <div><div className="text-xs uppercase tracking-wide text-ink-400">Signature request</div><h1 className="font-display text-xl mt-1">{data.documentName || "Document"}</h1><p className="text-sm text-ink-500 mt-1">Signer: {data.signerName} · {data.signerEmail}</p></div>
      <div><label className="block text-xs text-ink-500 mb-1">Draw signature</label><canvas ref={canvasRef} width={560} height={160} className="w-full border border-ink-200 rounded-md bg-white touch-none" /><button onClick={clearCanvas} className="text-xs text-ink-400 hover:text-ink-600 mt-1">Clear</button></div>
      <div><label className="block text-xs text-ink-500 mb-1">Or type your full name</label><input value={typed} onChange={e=>setTyped(e.target.value)} placeholder={data.signerName} className="focus-ring w-full text-sm border border-ink-200 rounded-md px-3 py-2 font-mono" /></div>
      {err && <p className="text-xs text-rust-600">{err}</p>}
      {done ? <p className="text-sm text-moss-600">Submitted.</p> :
        <div className="flex gap-2">
          <button onClick={()=>submit(false)} disabled={saving} className="focus-ring flex-1 bg-ink-900 text-white text-sm rounded-md py-2 disabled:opacity-40">{saving?"Submitting…":"Sign"}</button>
          <button onClick={()=>submit(true)} disabled={saving} className="focus-ring text-sm border border-ink-200 rounded-md px-4 py-2">Decline</button>
        </div>
      }
      <p className="text-[11px] text-ink-400">By signing you confirm the document as presented. A DocuSign envelope is also created when <code className="font-mono">DOCUSIGN_*</code> env is set.</p>
    </Card>
  </div>;
}
