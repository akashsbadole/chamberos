// Generates real wa.me deep links — clicking one genuinely opens WhatsApp
// with the message pre-filled. No WhatsApp Business API integration (that
// needs a paid, approved business account) — this is the zero-setup path
// that still actually works.

export function buildWhatsAppLink(phone: string, message: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
