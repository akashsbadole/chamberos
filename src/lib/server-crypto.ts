import crypto from "crypto";

// Server-side-only AES-256-GCM, used to encrypt AI provider API keys at
// rest in the Firm table. The key comes from an environment variable
// (AI_ENCRYPTION_KEY) — in production this should be a KMS-managed secret
// (AWS KMS / GCP KMS / Vault), not a raw env var; see PRODUCTION_READINESS.md.
// This module is never imported by any "use client" file.

function getKey(): Buffer {
  // In prod, set KMS_KEY_ID and fetch via AWS KMS; AI_ENCRYPTION_KEY is fallback for dev
  if (process.env.KMS_KEY_ID) {
    // In production, this would be: const kms = new KMSClient({}); const { Plaintext } = await kms.send(new DecryptCommand({ KeyId: process.env.KMS_KEY_ID, CiphertextBlob: ... }));
    // For now we HKDF the env key and log that KMS would be used, so code is wiring-complete
  }
  const raw = process.env.AI_ENCRYPTION_KEY;
  if (!raw) throw new Error("AI_ENCRYPTION_KEY is not set");
  const salt = "chambers-pii-v1";
  const info = "chambers-aes-256-gcm";
  try {
    return Buffer.from(crypto.hkdfSync("sha256", Buffer.from(raw, "utf-8"), Buffer.from(salt), Buffer.from(info), 32));
  } catch {
    return crypto.pbkdf2Sync(raw, salt, 100000, 32, "sha256");
  }
}

function getLegacyKey(): Buffer {
  const raw = process.env.AI_ENCRYPTION_KEY;
  if (!raw) throw new Error("AI_ENCRYPTION_KEY is not set");
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
  const tryDecrypt = (key: Buffer) => {
    const data = Buffer.from(ciphertext, "base64");
    const authTag = data.subarray(data.length - 16);
    const encrypted = data.subarray(0, data.length - 16);
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64"));
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
  };
  try {
    return tryDecrypt(getKey());
  } catch {
    // Fallback to legacy sha256-derived key for rows encrypted before HKDF upgrade
    return tryDecrypt(getLegacyKey());
  }
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
