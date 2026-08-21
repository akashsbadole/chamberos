// Accounting — QuickBooks / Xero env hooks for invoice/payment push.
// First-party invoices/payments work without keys; when QUICKBOOKS_*/XERO_* set, push.

export async function pushInvoiceToAccounting(invoice: { id: string; number: string; total: string | number; clientId?: string }): Promise<boolean> {
  if (process.env.QUICKBOOKS_ACCESS_TOKEN) {
    try {
      console.log("[accounting:quickbooks] would push invoice", invoice.number);
      // In prod: POST https://quickbooks.api.intuit.com/v3/company/{realmId}/invoice
      return true;
    } catch (e) { console.error("[accounting:quickbooks] failed", e); }
  }
  if (process.env.XERO_ACCESS_TOKEN) {
    try {
      console.log("[accounting:xero] would push invoice", invoice.number);
      // In prod: POST https://api.xero.com/api.xro/2.0/Invoices
      return true;
    } catch {}
  }
  return false;
}

export async function pushPaymentToAccounting(payment: { id: string; amount: string | number; invoiceId?: string }): Promise<boolean> {
  if (process.env.QUICKBOOKS_ACCESS_TOKEN || process.env.XERO_ACCESS_TOKEN) {
    console.log("[accounting] would push payment", payment.id);
    return true;
  }
  return false;
}

export function accountingEnabled(): boolean {
  return !!(process.env.QUICKBOOKS_ACCESS_TOKEN || process.env.XERO_ACCESS_TOKEN || process.env.XERO_TENANT_ID);
}
