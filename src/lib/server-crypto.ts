import crypto from "crypto";

// Server-side-only AES-256-GCM, used to encrypt AI provider API keys at
// rest in the Firm table. The key comes from an environment variable
// (AI_ENCRYPTION_KEY) — in production this should be a KMS-managed secret
// (AWS KMS / GCP KMS / Vault), not a raw env var; see PRODUCTION_READINESS.md.
// This module is never imported by any "use client" file.

function getKey(): Buffer {
  const raw = process.env.AI_ENCRYPTION_KEY;
  if (!raw) throw new Error("AI_ENCRYPTION_KEY is not set");
  // Accept any length input, derive a stable 32-byte key from it.
  return crypto.createHash("sha256").update(raw).digest();
}

export function encryptSecret(plaintext: string): { ciphertext: string; iv: string } {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Store ciphertext + authTag together; iv stored separately.
  return {
    ciphertext: Buffer.concat([encrypted, authTag]).toString("base64"),
    iv: iv.toString("base64"),
  };
}

export function decryptSecret(ciphertext: string, iv: string): string {
  const key = getKey();
  const data = Buffer.from(ciphertext, "base64");
  const authTag = data.subarray(data.length - 16);
  const encrypted = data.subarray(0, data.length - 16);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64"));
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}

// --- PII field-level encryption (reuses same key; stores as v1:<iv>:<ciphertext>) ---
const PII_PREFIX = "v1:";
export function encryptPII(plaintext: string | null | undefined): string | null {
  if (!plaintext) return plaintext as string | null;
  // Don't double-encrypt
  if (plaintext.startsWith(PII_PREFIX)) return plaintext;
  const { ciphertext, iv } = encryptSecret(plaintext);
  return `${PII_PREFIX}${iv}:${ciphertext}`;
}
export function decryptPII(value: string | null | undefined): string | null {
  if (!value || !value.startsWith(PII_PREFIX)) return value as string | null;
  try {
    const rest = value.slice(PII_PREFIX.length);
    const sep = rest.indexOf(":");
    if (sep === -1) return value;
    const iv = rest.slice(0, sep);
    const ciphertext = rest.slice(sep + 1);
    return decryptSecret(ciphertext, iv);
  } catch {
    return value; // fallback to raw on decrypt failure (key rotation case)
  }
}
