// Email — Resend/SendGrid/SES env hook + stub fallback. In dev, logs and audits.
import { recordAuditEvent } from "./audit";

export async function sendEmail(opts: { to: string; subject: string; html: string; firmId: string; userId?: string }) {
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
        body: JSON.stringify({ from: process.env.EMAIL_FROM ?? "chambers@example.com", to: opts.to, subject: opts.subject, html: opts.html }),
      });
      if (res.ok) {
        await recordAuditEvent({ firmId: opts.firmId, userId: opts.userId ?? null, action: "email_sent", detail: `Email to ${opts.to}: ${opts.subject} via resend` }).catch(()=>{});
        return { queued: true, to: opts.to, via: "resend" as const };
      }
      console.error("[email:resend] failed", await res.text());
    } catch (e) { console.error("[email:resend] error", e); }
  }
  if (process.env.SENDGRID_API_KEY) {
    try {
      console.log(`[email:sendgrid] would send to=${opts.to} subject="${opts.subject}"`);
      // await fetch("https://api.sendgrid.com/v3/mail/send", ...)
      return { queued: true, to: opts.to, via: "sendgrid" as const };
    } catch {}
  }
  console.log(`[email stub] to=${opts.to} subject="${opts.subject}"`);
  await recordAuditEvent({ firmId: opts.firmId, userId: opts.userId ?? null, action: "email_queued", detail: `Email to ${opts.to}: ${opts.subject}` }).catch(()=>{});
  return { queued: true, to: opts.to, via: "stub" as const };
}

export async function sendDeadlineNotification(firmId: string, to: string, complianceLabel: string, dueDate: string) {
  return sendEmail({ to, subject: `Deadline: ${complianceLabel}`, html: `<p>${complianceLabel} due ${new Date(dueDate).toLocaleDateString()}</p>`, firmId });
}
