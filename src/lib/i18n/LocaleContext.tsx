"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Locale, DEFAULT_LOCALE, LOCALES } from "./locales";
import { DICTIONARIES, Dictionary } from "./dictionary";

const STORAGE_KEY = "chambers_locale_v1";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  dict: Dictionary;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (stored && LOCALES.includes(stored)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration of a UI preference from localStorage
        setLocaleState(stored);
      }
    } catch {
      // ignore
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // ignore
    }
  }, []);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, dict: DICTIONARIES[locale] }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
