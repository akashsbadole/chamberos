-- Practice tools expansion: templates, e-signature, invoices, payments, messaging, trust accounting
-- First-party + env hooks for all 8 categories

-- CalendarEvent additions
ALTER TABLE "CalendarEvent" ADD COLUMN IF NOT EXISTS "meetingLink" TEXT;
ALTER TABLE "CalendarEvent" ADD COLUMN IF NOT EXISTS "description" TEXT;

-- TimeEntry costRate for profitability
ALTER TABLE "TimeEntry" ADD COLUMN IF NOT EXISTS "costRate" DECIMAL(10,2);

-- DocumentTemplate
CREATE TABLE IF NOT EXISTS "DocumentTemplate" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "firmId" TEXT NOT NULL REFERENCES "Firm"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX IF NOT EXISTS "DocumentTemplate_firmId_idx" ON "DocumentTemplate"("firmId");

-- SignatureRequest
CREATE TABLE IF NOT EXISTS "SignatureRequest" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "firmId" TEXT NOT NULL REFERENCES "Firm"("id") ON DELETE CASCADE,
  "documentId" TEXT NOT NULL,
  "documentName" TEXT,
  "signerName" TEXT NOT NULL,
  "signerEmail" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "token" TEXT NOT NULL UNIQUE,
  "signatureData" TEXT,
  "signedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "SignatureRequest_firmId_idx" ON "SignatureRequest"("firmId");
CREATE INDEX IF NOT EXISTS "SignatureRequest_documentId_idx" ON "SignatureRequest"("documentId");
CREATE INDEX IF NOT EXISTS "SignatureRequest_token_idx" ON "SignatureRequest"("token");

-- Invoice
CREATE TABLE IF NOT EXISTS "Invoice" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "firmId" TEXT NOT NULL REFERENCES "Firm"("id") ON DELETE CASCADE,
  "caseId" TEXT,
  "clientId" TEXT,
  "number" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "lineItems" JSONB NOT NULL,
  "subtotal" DECIMAL(12,2) NOT NULL,
  "taxRate" DECIMAL(5,2),
  "total" DECIMAL(12,2) NOT NULL,
  "dueDate" TIMESTAMP(3),
  "pdfKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX IF NOT EXISTS "Invoice_firmId_idx" ON "Invoice"("firmId");
CREATE INDEX IF NOT EXISTS "Invoice_caseId_idx" ON "Invoice"("caseId");
CREATE INDEX IF NOT EXISTS "Invoice_clientId_idx" ON "Invoice"("clientId");
CREATE INDEX IF NOT EXISTS "Invoice_status_idx" ON "Invoice"("status");

-- Payment
CREATE TABLE IF NOT EXISTS "Payment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "firmId" TEXT NOT NULL REFERENCES "Firm"("id") ON DELETE CASCADE,
  "invoiceId" TEXT REFERENCES "Invoice"("id") ON DELETE SET NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "method" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "gatewayRef" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "Payment_firmId_idx" ON "Payment"("firmId");
CREATE INDEX IF NOT EXISTS "Payment_invoiceId_idx" ON "Payment"("invoiceId");

-- MessageThread
CREATE TABLE IF NOT EXISTS "MessageThread" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "firmId" TEXT NOT NULL REFERENCES "Firm"("id") ON DELETE CASCADE,
  "clientId" TEXT NOT NULL,
  "caseId" TEXT,
  "subject" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX IF NOT EXISTS "MessageThread_firmId_idx" ON "MessageThread"("firmId");
CREATE INDEX IF NOT EXISTS "MessageThread_clientId_idx" ON "MessageThread"("clientId");
CREATE INDEX IF NOT EXISTS "MessageThread_caseId_idx" ON "MessageThread"("caseId");

-- Message
CREATE TABLE IF NOT EXISTS "Message" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "threadId" TEXT NOT NULL REFERENCES "MessageThread"("id") ON DELETE CASCADE,
  "sender" TEXT NOT NULL,
  "senderId" TEXT,
  "body" TEXT NOT NULL,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "Message_threadId_idx" ON "Message"("threadId");

-- TrustAccount
CREATE TABLE IF NOT EXISTS "TrustAccount" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "firmId" TEXT NOT NULL REFERENCES "Firm"("id") ON DELETE CASCADE,
  "clientId" TEXT NOT NULL,
  "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  UNIQUE("firmId","clientId")
);
CREATE INDEX IF NOT EXISTS "TrustAccount_firmId_idx" ON "TrustAccount"("firmId");

-- TrustTransaction
CREATE TABLE IF NOT EXISTS "TrustTransaction" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "accountId" TEXT NOT NULL REFERENCES "TrustAccount"("id") ON DELETE CASCADE,
  "firmId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "balanceAfter" DECIMAL(12,2) NOT NULL,
  "description" TEXT,
  "reference" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "TrustTransaction_accountId_idx" ON "TrustTransaction"("accountId");
CREATE INDEX IF NOT EXISTS "TrustTransaction_firmId_idx" ON "TrustTransaction"("firmId");
