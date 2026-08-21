// Generates real wa.me deep links — clicking one genuinely opens WhatsApp
// with the message pre-filled. No WhatsApp Business API integration (that
// needs a paid, approved business account) — this is the zero-setup path
// that still actually works.

export function isValidPhoneE164(phone: string): boolean {
  // E.164: optional +, then 7-15 digits, first digit 1-9
  const digits = phone.replace(/[\s\-()]/g, "");
  return /^\+?[1-9]\d{6,14}$/.test(digits);
}

export function buildWhatsAppLink(phone: string, message: string): string {
  if (!isValidPhoneE164(phone)) {
    // Return empty so caller can show validation error instead of broken link
    return "";
  }
  const digits = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
