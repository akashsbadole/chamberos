-- CreateTable
CREATE TABLE IF NOT EXISTS "RevokedToken" (
    "tokenHash" TEXT NOT NULL,
    "revokedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RevokedToken_pkey" PRIMARY KEY ("tokenHash")
);
CREATE INDEX IF NOT EXISTS "RevokedToken_expiresAt_idx" ON "RevokedToken"("expiresAt");
-- Cleanup expired tokens periodically (handled in app, but add partial index for efficiency)
