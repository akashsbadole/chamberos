"use client";

import { useLocale } from "@/lib/i18n/LocaleContext";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 sm:px-8 pt-6 sm:pt-8 pb-5 sm:pb-6 flex-wrap">
      <div>
        {eyebrow && (
          <div className="text-xs uppercase tracking-wide text-brass-600 font-medium mb-1">{eyebrow}</div>
        )}
        <h1 className="font-display text-2xl md:text-3xl text-ink-900 tracking-tight">{title}</h1>
        {description && <p className="text-ink-500 text-sm mt-1.5 max-w-xl">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`bg-white border border-ink-100 rounded-lg ${className}`}>{children}</div>
  );
}

const RISK_STYLES: Record<string, string> = {
  low: "bg-moss-500/10 text-moss-600 border-moss-500/20",
  medium: "bg-brass-400/10 text-brass-600 border-brass-400/30",
  high: "bg-rust-500/10 text-rust-600 border-rust-500/20",
};

export function RiskBadge({ risk }: { risk: "low" | "medium" | "high" }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-medium uppercase tracking-wide ${RISK_STYLES[risk]}`}>
      {risk}
    </span>
  );
}

const STATUS_STYLES: Record<string, string> = {
  open: "bg-ink-100 text-ink-600",
  pending_filing: "bg-brass-100 text-brass-700",
  in_court: "bg-ink-800 text-white",
  closed: "bg-moss-500/10 text-moss-600",
  intake: "bg-ink-100 text-ink-600",
  conflict_check: "bg-rust-500/10 text-rust-600",
  kyc: "bg-brass-100 text-brass-700",
  engagement: "bg-ink-100 text-ink-600",
  active: "bg-moss-500/10 text-moss-600",
};

const STATUS_KEYS: Record<string, keyof import("@/lib/i18n/dictionary").Dictionary["status"]> = {
  open: "open",
  pending_filing: "pending_filing",
  in_court: "in_court",
  closed: "closed",
  intake: "intake",
  conflict_check: "conflict_check",
  kyc: "kyc",
  engagement: "engagement",
  active: "active",
};

export function StatusBadge({ status }: { status: string }) {
  const { dict } = useLocale();
  const key = STATUS_KEYS[status];
  const label = key ? dict.status[key] : status;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[status] ?? "bg-ink-100 text-ink-600"}`}>
      {label}
    </span>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="text-center py-16 px-6 border border-dashed border-ink-200 rounded-lg">
      <p className="font-display text-lg text-ink-700">{title}</p>
      <p className="text-sm text-ink-400 mt-1 max-w-sm mx-auto">{description}</p>
    </div>
  );
}
