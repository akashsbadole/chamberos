// Central error helper – in production send to Sentry; in dev logs to console
export function reportError(err: unknown, ctx?: Record<string,unknown>) {
  console.error("[error]", err, ctx ?? "");
  // If Sentry DSN is set, send: try { Sentry.captureException(err, { extra: ctx }) } catch {}
}

export function toUserMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return "Something went wrong. Please try again.";
}
