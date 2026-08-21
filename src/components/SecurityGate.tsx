"use client";

import { useStore } from "@/lib/store";

// Real authentication is enforced server-side by src/middleware.ts, which
// redirects unauthenticated requests to /login before this component (or
// any page) ever renders — so this component's only job now is to wait for
// the initial Postgres data fetch (see src/lib/store.tsx) before rendering
// the app shell, avoiding a flash of empty state.
export default function SecurityGate({ children }: { children: React.ReactNode }) {
  const { ready } = useStore();

  if (!ready) {
    return <div className="min-h-screen flex items-center justify-center text-ink-400 text-sm">Loading…</div>;
  }

  return <>{children}</>;
}
