"use client";

import { useLocale } from "@/lib/i18n/LocaleContext";
import { LOCALES, LOCALE_LABELS } from "@/lib/i18n/locales";
import { Languages } from "lucide-react";

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useLocale();

  return (
    <label className={`flex items-center gap-1.5 ${compact ? "" : ""}`}>
      <Languages className="w-4 h-4 text-ink-400 shrink-0" aria-hidden="true" />
      <span className="sr-only">Choose language</span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as typeof locale)}
        aria-label="Choose language"
        className="focus-ring bg-transparent text-sm text-ink-600 border border-ink-200 rounded-md px-2 py-1"
      >
        {LOCALES.map((l) => (
          <option key={l} value={l}>{LOCALE_LABELS[l]}</option>
        ))}
      </select>
    </label>
  );
}
