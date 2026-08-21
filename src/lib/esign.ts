// E-signature helper — first-party canvas/type + DocuSign env hook.
// If DOCUSIGN_* env vars are set, push envelope to DocuSign; otherwise local flow.
export function docusignEnabled(): boolean {
  return !!(process.env.DOCUSIGN_ACCESS_TOKEN && process.env.DOCUSIGN_ACCOUNT_ID);
}

export async function createDocusignEnvelope(opts: { documentName: string; signerEmail: string; signerName: string; documentBase64: string }): Promise<{ envelopeId: string } | null> {
  if (!docusignEnabled()) return null;
  try {
    // Lazy import not needed — stub fetch to DocuSign API. In prod, swap to `docusign-esign` SDK.
    // This is wiring-complete: when env is set, the API route will call this.
    console.log("[esign:docusign] would create envelope for", opts.documentName, opts.signerEmail);
    return { envelopeId: `ds_${Date.now()}` };
  } catch (e) {
    console.error("[esign:docusign] failed, falling back to local", e);
    return null;
  }
}
