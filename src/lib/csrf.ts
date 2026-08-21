import crypto from "crypto";

const TOKEN_LENGTH = 32;

export function generateCsrfToken(): string {
  return crypto.randomBytes(TOKEN_LENGTH).toString("hex");
}

export function validateCsrfToken(token: string | null, expected: string | null): boolean {
  if (!token || !expected) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch { return false; }
}
