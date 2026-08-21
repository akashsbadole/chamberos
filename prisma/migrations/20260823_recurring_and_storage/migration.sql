-- Recurring invoices + document storage linkage (S3)
ALTER TABLE "CaseDocument" ADD COLUMN IF NOT EXISTS "storageKey" TEXT;
ALTER TABLE "CaseDocument" ADD COLUMN IF NOT EXISTS "mimeType" TEXT;
ALTER TABLE "CaseDocument" ADD COLUMN IF NOT EXISTS "size" INTEGER;
ALTER TABLE "CaseDocument" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS "RecurringInvoice" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "firmId" TEXT NOT NULL REFERENCES "Firm"("id") ON DELETE CASCADE,
  "caseId" TEXT,
  "clientId" TEXT,
  "templateId" TEXT,
  "cadence" TEXT NOT NULL,
  "lineItems" JSONB NOT NULL,
  "taxRate" DECIMAL(5,2),
  "nextRunAt" TIMESTAMP(3) NOT NULL,
  "lastRunAt" TIMESTAMP(3),
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX IF NOT EXISTS "RecurringInvoice_firmId_idx" ON "RecurringInvoice"("firmId");
CREATE INDEX IF NOT EXISTS "RecurringInvoice_nextRunAt_idx" ON "RecurringInvoice"("nextRunAt");
