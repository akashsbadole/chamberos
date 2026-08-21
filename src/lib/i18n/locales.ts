export const LOCALES = ["en", "hi", "mr", "te", "ta", "bn"] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  hi: "हिंदी",
  mr: "मराठी",
  te: "తెలుగు",
  ta: "தமிழ்",
  bn: "বাংলা",
};

export const DEFAULT_LOCALE: Locale = "en";
