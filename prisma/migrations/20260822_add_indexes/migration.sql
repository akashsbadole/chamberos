-- Add missing indexes for frequently queried fields (audit §10)
CREATE INDEX IF NOT EXISTS "ComplianceItem_done_idx" ON "ComplianceItem"("done");
CREATE INDEX IF NOT EXISTS "ComplianceItem_dueDate_idx" ON "ComplianceItem"("dueDate");
CREATE INDEX IF NOT EXISTS "TimeEntry_billed_idx" ON "TimeEntry"("billed");
CREATE INDEX IF NOT EXISTS "TimeEntry_createdAt_idx" ON "TimeEntry"("createdAt");
CREATE INDEX IF NOT EXISTS "LegalCase_status_idx" ON "LegalCase"("status");
CREATE INDEX IF NOT EXISTS "CalendarEvent_type_idx" ON "CalendarEvent"("type");
-- Partial indexes for common filtered queries
CREATE INDEX IF NOT EXISTS "LegalCase_open_idx" ON "LegalCase"("firmId") WHERE status != 'closed';
CREATE INDEX IF NOT EXISTS "TimeEntry_unbilled_idx" ON "TimeEntry"("caseId") WHERE billed = false;
