-- Hand-derived from prisma/schema.prisma, applied directly to a live local
-- Postgres 16 instance via psql because this environment's egress proxy
-- blocks binaries.prisma.sh (Prisma CLI's engine download host), so
-- `prisma migrate dev` cannot run here. This file matches the schema
-- exactly; treat it as the source of truth for what's actually running.
--
-- In a normal network environment, delete this file and run
-- `npx prisma migrate dev --name init` against a fresh database instead —
-- let Prisma generate its own migration so its internal tracking
-- (_prisma_migrations table) stays authoritative. This hand-written version
-- exists so the schema is real and verified *today*, not blocked on tooling.

CREATE TYPE "Role" AS ENUM ('ADMIN', 'LAWYER', 'PARALEGAL', 'CLIENT');
CREATE TYPE "ClientStatus" AS ENUM ('intake', 'conflict_check', 'kyc', 'engagement', 'active');
CREATE TYPE "CaseStatus" AS ENUM ('open', 'pending_filing', 'in_court', 'closed');
CREATE TYPE "CalendarEventType" AS ENUM ('hearing', 'meeting', 'deadline', 'internal');
CREATE TYPE "GrievanceStatus" AS ENUM ('open', 'acknowledged', 'resolved');

CREATE TABLE "Firm" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "aiProvider" TEXT,
  "aiModel" TEXT,
  "aiApiKeyCiphertext" TEXT,
  "aiApiKeyIv" TEXT
);

CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY,
  "firmId" TEXT NOT NULL REFERENCES "Firm"("id"),
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'LAWYER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "User_firmId_idx" ON "User"("firmId");

CREATE TABLE "Client" (
  "id" TEXT PRIMARY KEY,
  "firmId" TEXT NOT NULL REFERENCES "Firm"("id"),
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "matterType" TEXT NOT NULL,
  "status" "ClientStatus" NOT NULL DEFAULT 'intake',
  "conflictChecked" BOOLEAN NOT NULL DEFAULT false,
  "conflictFlags" TEXT[] NOT NULL DEFAULT '{}',
  "kycVerified" BOOLEAN NOT NULL DEFAULT false,
  "engagementSigned" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "Client_firmId_idx" ON "Client"("firmId");

CREATE TABLE "LegalCase" (
  "id" TEXT PRIMARY KEY,
  "firmId" TEXT NOT NULL REFERENCES "Firm"("id"),
  "clientId" TEXT REFERENCES "Client"("id"),
  "title" TEXT NOT NULL,
  "practiceArea" TEXT NOT NULL,
  "status" "CaseStatus" NOT NULL DEFAULT 'open',
  "courtName" TEXT,
  "caseNumber" TEXT,
  "nextHearing" TIMESTAMP(3),
  "filingDeadline" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "LegalCase_firmId_idx" ON "LegalCase"("firmId");
CREATE INDEX "LegalCase_clientId_idx" ON "LegalCase"("clientId");

CREATE TABLE "ComplianceItem" (
  "id" TEXT PRIMARY KEY,
  "caseId" TEXT NOT NULL REFERENCES "LegalCase"("id") ON DELETE CASCADE,
  "label" TEXT NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "done" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "ComplianceItem_caseId_idx" ON "ComplianceItem"("caseId");

CREATE TABLE "CaseDocument" (
  "id" TEXT PRIMARY KEY,
  "caseId" TEXT NOT NULL REFERENCES "LegalCase"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "CaseDocument_caseId_idx" ON "CaseDocument"("caseId");

CREATE TABLE "CalendarEvent" (
  "id" TEXT PRIMARY KEY,
  "firmId" TEXT NOT NULL REFERENCES "Firm"("id"),
  "caseId" TEXT REFERENCES "LegalCase"("id"),
  "title" TEXT NOT NULL,
  "start" TIMESTAMP(3) NOT NULL,
  "end" TIMESTAMP(3) NOT NULL,
  "type" "CalendarEventType" NOT NULL,
  "location" TEXT
);
CREATE INDEX "CalendarEvent_firmId_idx" ON "CalendarEvent"("firmId");
CREATE INDEX "CalendarEvent_caseId_idx" ON "CalendarEvent"("caseId");
CREATE INDEX "CalendarEvent_start_idx" ON "CalendarEvent"("start");

CREATE TABLE "ChatMessage" (
  "id" TEXT PRIMARY KEY,
  "caseId" TEXT NOT NULL REFERENCES "LegalCase"("id") ON DELETE CASCADE,
  "role" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "ChatMessage_caseId_idx" ON "ChatMessage"("caseId");

CREATE TABLE "MeetingNote" (
  "id" TEXT PRIMARY KEY,
  "caseId" TEXT NOT NULL REFERENCES "LegalCase"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "transcript" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "actionItems" TEXT[] NOT NULL DEFAULT '{}'
);
CREATE INDEX "MeetingNote_caseId_idx" ON "MeetingNote"("caseId");

CREATE TABLE "TimeEntry" (
  "id" TEXT PRIMARY KEY,
  "caseId" TEXT NOT NULL REFERENCES "LegalCase"("id") ON DELETE CASCADE,
  "userId" TEXT REFERENCES "User"("id"),
  "description" TEXT NOT NULL,
  "minutes" INTEGER NOT NULL,
  "rate" DECIMAL(10,2) NOT NULL,
  "billed" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "TimeEntry_caseId_idx" ON "TimeEntry"("caseId");

CREATE TABLE "Evidence" (
  "id" TEXT PRIMARY KEY,
  "caseId" TEXT NOT NULL REFERENCES "LegalCase"("id") ON DELETE CASCADE,
  "label" TEXT NOT NULL,
  "source" TEXT,
  "description" TEXT,
  "collectedDate" TIMESTAMP(3) NOT NULL,
  "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "kind" TEXT NOT NULL,
  "content" TEXT
);
CREATE INDEX "Evidence_caseId_idx" ON "Evidence"("caseId");

CREATE TABLE "Grievance" (
  "id" TEXT PRIMARY KEY,
  "clientId" TEXT NOT NULL REFERENCES "Client"("id"),
  "caseId" TEXT REFERENCES "LegalCase"("id"),
  "subject" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "status" "GrievanceStatus" NOT NULL DEFAULT 'open',
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "Grievance_clientId_idx" ON "Grievance"("clientId");
CREATE INDEX "Grievance_caseId_idx" ON "Grievance"("caseId");

CREATE TABLE "ResearchQuestion" (
  "id" TEXT PRIMARY KEY,
  "caseId" TEXT NOT NULL REFERENCES "LegalCase"("id") ON DELETE CASCADE,
  "question" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "answered" BOOLEAN NOT NULL DEFAULT false,
  "answer" TEXT
);
CREATE INDEX "ResearchQuestion_caseId_idx" ON "ResearchQuestion"("caseId");

CREATE TABLE "AuditEvent" (
  "id" TEXT PRIMARY KEY,
  "firmId" TEXT NOT NULL REFERENCES "Firm"("id"),
  "userId" TEXT REFERENCES "User"("id"),
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "action" TEXT NOT NULL,
  "caseId" TEXT,
  "clientId" TEXT,
  "detail" TEXT NOT NULL,
  "prevHash" TEXT,
  "hash" TEXT NOT NULL
);
CREATE INDEX "AuditEvent_firmId_idx" ON "AuditEvent"("firmId");
CREATE INDEX "AuditEvent_timestamp_idx" ON "AuditEvent"("timestamp");

-- Real DB-level tamper protection: reject any UPDATE or DELETE on the audit
-- log, not just "please don't" in application code.
CREATE OR REPLACE FUNCTION audit_event_immutable() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'AuditEvent rows are immutable — % is not permitted', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_event_no_update
  BEFORE UPDATE ON "AuditEvent"
  FOR EACH ROW EXECUTE FUNCTION audit_event_immutable();

CREATE TRIGGER audit_event_no_delete
  BEFORE DELETE ON "AuditEvent"
  FOR EACH ROW EXECUTE FUNCTION audit_event_immutable();
