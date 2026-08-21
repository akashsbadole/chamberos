export function formatDate(date: string | Date | null, locale = "en-IN"): string {
  if (!date) return "—";
  try { return new Intl.DateTimeFormat(locale, { year:"numeric", month:"short", day:"numeric" }).format(new Date(date)); } catch { return String(date); }
}
export function formatDateTime(date: string | Date | null, locale = "en-IN"): string {
  if (!date) return "—";
  try { return new Intl.DateTimeFormat(locale, { year:"numeric", month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" }).format(new Date(date)); } catch { return String(date); }
}
export function formatCurrency(amount: number, locale = "en-IN", currency = "INR"): string {
  try { return new Intl.NumberFormat(locale, { style:"currency", currency }).format(amount); } catch { return `₹${amount}`; }
}
