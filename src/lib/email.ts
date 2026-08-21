// Email stub – swap with real provider (SendGrid/SES) in production.
// In dev, emails are logged to console and audit trail; no actual send.
import { recordAuditEvent } from "./audit";

export async function sendEmail(opts: { to: string; subject: string; html: string; firmId: string; userId?: string }) {
  console.log(`[email stub] to=${opts.to} subject="${opts.subject}"`);
  await recordAuditEvent({ firmId: opts.firmId, userId: opts.userId ?? null, action: "email_queued", detail: `Email to ${opts.to}: ${opts.subject}` }).catch(()=>{});
  // In prod: await fetch("https://api.sendgrid.com/v3/mail/send", ...)
  return { queued: true, to: opts.to };
}

export async function sendDeadlineNotification(firmId: string, to: string, complianceLabel: string, dueDate: string) {
  return sendEmail({ to, subject: `Deadline: ${complianceLabel}`, html: `<p>${complianceLabel} due ${new Date(dueDate).toLocaleDateString()}</p>`, firmId });
}
