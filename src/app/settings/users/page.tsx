"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import { PageHeader, Card } from "@/components/ui";
import { Trash2, UserPlus, ShieldAlert } from "lucide-react";

type UserRow = { id: string; firmId: string; name: string; email: string; role: string; createdAt: string };

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [me, setMe] = useState<{ role: string; userId: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "LAWYER" });
  const [saving, setSaving] = useState(false);
  const [err2, setErr2] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const meRes = await fetch("/api/auth/me").then(r=>r.json()).catch(()=>null);
      if (meRes?.role) setMe({ role: meRes.role, userId: meRes.userId });
      const res = await fetch("/api/users");
      const data = await res.json();
      if (!res.ok) { setError(data.error || `Failed (${res.status})`); setUsers([]); }
      else setUsers(data);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setLoading(false); }
  };
  useEffect(()=>{ load(); }, []);

  const create = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password) { setErr2("name, email, password required"); return; }
    setSaving(true); setErr2(null);
    try {
      const res = await fetch("/api/users", { method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setErr2(data.error || `Failed (${res.status})`); return; }
      setForm({ name:"", email:"", password:"", role:"LAWYER" }); await load();
    } catch (e) { setErr2(e instanceof Error?e.message:"Failed"); } finally { setSaving(false); }
  };

  const remove = async (id: string, name: string) => {
    if (!confirm(`Delete user "${name}"?`)) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method:"DELETE" });
      const data = await res.json().catch(()=>({}));
      if (!res.ok) { alert(data.error || `Delete failed (${res.status})`); return; }
      await load();
    } catch (e) { alert(e instanceof Error?e.message:"Delete failed"); }
  };

  const changeRole = async (id: string, role: string) => {
    try {
      const res = await fetch(`/api/users/${id}`, { method:"PATCH", headers:{ "content-type":"application/json" }, body: JSON.stringify({ role }) });
      const data = await res.json().catch(()=>({}));
      if (!res.ok) { alert(data.error || "Update failed"); return; }
      await load();
    } catch (e) { alert(e instanceof Error?e.message:"Update failed"); }
  };

  return (
    <Shell>
      <PageHeader eyebrow="Administration" title="Team" description="Manage users for this firm. Only Admin can create role accounts (Lawyer, Paralegal)." />
      <div className="px-4 sm:px-8 pb-16 max-w-3xl space-y-6">
        {loading ? <Card className="p-6 text-sm text-ink-400">Loading…</Card> :
          error ? <Card className="p-6"><div className="text-sm text-rust-600 flex gap-2"><ShieldAlert className="w-4 h-4"/>{error}</div>{me?.role!=="ADMIN" && <p className="text-xs text-ink-400 mt-2">Only ADMIN can manage users. Current role: {me?.role ?? "unknown"}. Ask an Admin to create your Lawyer account.</p>}</Card> :
          <>
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3"><UserPlus className="w-4 h-4 text-brass-500"/><h2 className="font-display text-lg">Add user</h2></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input value={form.name} onChange={e=>setForm(s=>({...s,name:e.target.value}))} placeholder="Name" className="focus-ring text-sm border border-ink-200 rounded-md px-3 py-2" />
                <input value={form.email} onChange={e=>setForm(s=>({...s,email:e.target.value}))} placeholder="Email" className="focus-ring text-sm border border-ink-200 rounded-md px-3 py-2" />
                <input type="password" value={form.password} onChange={e=>setForm(s=>({...s,password:e.target.value}))} placeholder="Password" className="focus-ring text-sm border border-ink-200 rounded-md px-3 py-2" />
                <select value={form.role} onChange={e=>setForm(s=>({...s,role:e.target.value}))} className="focus-ring text-sm border border-ink-200 rounded-md px-3 py-2">
                  <option value="LAWYER">Lawyer</option>
                  <option value="PARALEGAL">Paralegal</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              {err2 && <p className="text-xs text-rust-600 mt-2">{err2}</p>}
              <button onClick={create} disabled={saving} className="focus-ring mt-3 bg-ink-900 text-white text-sm rounded-md px-4 py-2 disabled:opacity-40">{saving?"Creating…":"Create user"}</button>
            </Card>
            <Card className="overflow-hidden">
              <div className="px-5 py-3 border-b border-ink-100 text-xs uppercase tracking-wide text-ink-400">{users.length} user(s)</div>
              <div className="divide-y divide-ink-100">
                {users.map(u=>(
                  <div key={u.id} className="px-5 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm text-ink-800">{u.name} <span className="text-ink-400">· {u.email}</span></div>
                      <div className="text-xs text-ink-400">{new Date(u.createdAt).toLocaleDateString()} · <span className="font-medium text-ink-600">{u.role}</span></div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <select value={u.role} onChange={e=>changeRole(u.id, e.target.value)} className="focus-ring text-xs border border-ink-200 rounded-md px-2 py-1">
                        <option value="ADMIN">ADMIN</option><option value="LAWYER">LAWYER</option><option value="PARALEGAL">PARALEGAL</option>
                      </select>
                      <button onClick={()=>remove(u.id,u.name)} className="focus-ring text-ink-300 hover:text-rust-500 p-1"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        }
      </div>
    </Shell>
  );
}
