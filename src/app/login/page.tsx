"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Scale, LogIn } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Sign-in failed.");
        setBusy(false);
        return;
      }
      router.push(params.get("next") || "/");
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-900 px-4">
      <div className="w-full max-w-sm bg-white rounded-lg p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-6">
          <Scale className="w-5 h-5 text-brass-500" strokeWidth={1.75} />
          <span className="font-display text-lg text-ink-900">Chambers</span>
        </div>
        <h1 className="font-display text-lg text-ink-900 mb-1">Sign in</h1>
        <p className="text-sm text-ink-500 mb-5">Sign in to your firm&apos;s workspace.</p>
        <div className="space-y-2.5">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            className="focus-ring w-full text-sm border border-ink-200 rounded-md px-3 py-2.5"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            className="focus-ring w-full text-sm border border-ink-200 rounded-md px-3 py-2.5"
          />
          {error && <p role="alert" className="text-xs text-rust-600">{error}</p>}
          <button
            onClick={submit}
            disabled={busy || !email || !password}
            className="focus-ring w-full bg-ink-900 text-white text-sm rounded-md py-2.5 disabled:opacity-40 hover:bg-ink-800 transition-colors flex items-center justify-center gap-1.5"
          >
            <LogIn className="w-4 h-4" /> {busy ? "Signing in…" : "Sign in"}
          </button>
        </div>
        <p className="text-xs text-ink-400 mt-5 text-center">
          New firm? <Link href="/register" className="text-brass-600 hover:text-brass-700 font-medium">Register your firm</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-ink-400 text-sm">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
