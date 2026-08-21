"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Scale,
  LayoutDashboard,
  Briefcase,
  Users,
  UserPlus,
  CalendarClock,
  Landmark,
  Mic,
  Bell,
  Search,
  Clock,
  ShieldCheck,
  Sparkles,
  Heart,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { Dictionary } from "@/lib/i18n/dictionary";
import LanguageSwitcher from "./LanguageSwitcher";
import { allowedNav, AppRole } from "@/lib/rbac";
import { FileText, Landmark as TemplateIcon, Wallet, MessageSquare, BarChart3 } from "lucide-react";

function buildNav(nav: Dictionary["nav"]) {
  return [
    { href: "/", label: nav.dashboard, icon: LayoutDashboard },
    { href: "/cases", label: nav.cases, icon: Briefcase },
    { href: "/clients", label: nav.clients, icon: Users },
    { href: "/onboarding", label: nav.onboarding, icon: UserPlus },
    { href: "/calendar", label: nav.calendar, icon: CalendarClock },
    { href: "/court-sync", label: nav.courtSync, icon: Landmark },
    { href: "/voice-intake", label: nav.voiceIntake, icon: Mic },
    { href: "/research", label: nav.research, icon: Search },
    { href: "/billing", label: nav.billing, icon: Clock },
    { href: "/assistant", label: nav.assistant, icon: Sparkles },
    { href: "/portal", label: nav.portal, icon: Heart },
    { href: "/activity", label: nav.activity, icon: ShieldCheck },
    { href: "/settings", label: nav.settings, icon: Settings },
    // New tools — visible per RBAC (Phase A-F)
    { href: "/documents", label: nav.documents, icon: FileText },
    { href: "/templates", label: nav.templates, icon: TemplateIcon },
    { href: "/trust", label: nav.trust, icon: Wallet },
    { href: "/messages", label: nav.messages, icon: MessageSquare },
    { href: "/reports", label: nav.reports, icon: BarChart3 },
  ];
}

function useRole(): AppRole | null {
  const [role, setRole] = useState<AppRole | null>(null);
  useEffect(() => {
    fetch("/api/auth/me").then(r=>r.ok?r.json():null).then(d=>{ if(d?.role) setRole(d.role as AppRole); }).catch(()=>{});
  }, []);
  return role;
}

function NavLinks({ pathname, role, onNavigate }: { pathname: string; role: AppRole | null; onNavigate?: () => void }) {
  const { dict } = useLocale();
  const NAV = buildNav(dict.nav).filter(item => role ? allowedNav(role, item.href) : true);
  return (
    <>
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`focus-ring flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
              active ? "bg-ink-800 text-brass-200 font-medium" : "text-ink-300 hover:bg-ink-800/60 hover:text-ink-100"
            }`}
          >
            <Icon className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </>
  );
}

function Breadcrumbs({ pathname }: { pathname: string }) {
  const parts = pathname.split("/").filter(Boolean);
  if (!parts.length) return null;
  return (
    <nav aria-label="Breadcrumb" className="px-4 sm:px-6 py-2 text-xs text-ink-400">
      <ol className="flex gap-1">
        <li><Link href="/" className="hover:text-ink-600">Home</Link> <span aria-hidden>›</span></li>
        {parts.map((p, i) => {
          const href = "/" + parts.slice(0, i+1).join("/");
          const isLast = i === parts.length - 1;
          return <li key={href} className="flex gap-1">{isLast ? <span aria-current="page" className="text-ink-600 capitalize">{p}</span> : <><Link href={href} className="hover:text-ink-600 capitalize">{p}</Link><span aria-hidden>›</span></>}</li>;
        })}
      </ol>
    </nav>
  );
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { dict } = useLocale();
  const role = useRole();
  const drawerRef = useRef<HTMLElement | null>(null);

  // Focus trap for mobile drawer + Esc to close
  useEffect(() => {
    if (!mobileOpen) return;
    const el = drawerRef.current;
    const focusable = el?.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    focusable?.[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
      if (e.key === "Tab" && focusable && focusable.length) {
        const first = focusable[0], last = focusable[focusable.length-1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  return (
    <div className="min-h-screen flex bg-paper text-ink-900">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-ink-900 text-white px-3 py-2 rounded text-sm z-50">Skip to content</a>
      <div id="a11y-live" aria-live="polite" aria-atomic="true" className="sr-only" />
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-ink-900 text-ink-100 flex-col" aria-label="Main navigation">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-ink-700">
          <Scale className="w-6 h-6 text-brass-300" strokeWidth={1.75} aria-hidden="true" />
          <div>
            <div className="font-display text-lg leading-none tracking-tight">Chambers</div>
            <div className="text-[11px] text-ink-400 mt-0.5 tracking-wide uppercase">Practice OS</div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <NavLinks pathname={pathname} role={role} />
        </nav>
        <div className="px-4 py-4 border-t border-ink-700 text-xs text-ink-400 space-y-2">
          {role && <div className="text-[11px] tracking-wide uppercase text-brass-300">Role: {role}</div>}
          <p className="leading-relaxed">{dict.common.demoNotice}</p>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-ink-950/60" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <aside
            ref={drawerRef as unknown as React.RefObject<HTMLElement>}
            className="relative w-72 max-w-[85vw] bg-ink-900 text-ink-100 flex flex-col z-50"
            aria-label="Main navigation"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-ink-700">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-brass-300" strokeWidth={1.75} aria-hidden="true" />
                <span className="font-display text-lg">Chambers</span>
              </div>
              <button onClick={() => setMobileOpen(false)} aria-label="Close navigation" className="focus-ring text-ink-300 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
              <NavLinks pathname={pathname} role={role} onNavigate={() => setMobileOpen(false)} />
            </nav>
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 sm:h-16 shrink-0 border-b border-ink-100 bg-white/70 backdrop-blur flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              className="focus-ring lg:hidden text-ink-500 hover:text-ink-800 -ml-1 p-1.5"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block text-sm text-ink-400 font-mono">chambers.local</div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <LanguageSwitcher />
            <button className="focus-ring text-ink-400 hover:text-ink-700 transition-colors" aria-label="Notifications">
              <Bell className="w-5 h-5" strokeWidth={1.75} />
            </button>
            <div className="w-8 h-8 rounded-full bg-brass-200 text-brass-700 flex items-center justify-center text-xs font-semibold font-display" aria-label="Signed in as AK">
              AK
            </div>
          </div>
        </header>
        <Breadcrumbs pathname={pathname} />
        <main id="main-content" tabIndex={-1} className="flex-1 min-w-0 overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}
