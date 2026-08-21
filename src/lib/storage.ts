// Storage abstraction – local filesystem in dev (`./uploads`), S3 in prod.
// Swap `putObject` to use @aws-sdk/client-s3 when S3 creds are available.
import fs from "fs";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

function ensureDir() {
  try { fs.mkdirSync(UPLOAD_DIR, { recursive: true }); } catch {}
}

export async function putObject(key: string, body: Buffer | string, contentType = "application/octet-stream"): Promise<{ url: string; key: string }> {
  ensureDir();
  const safeKey = key.replace(/[^a-zA-Z0-9._\-\/]/g, "_");
  const filePath = path.join(UPLOAD_DIR, safeKey);
  try {
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, body);
  } catch (e) { console.error("[storage] write failed", e); }
  console.log(`[storage] put ${safeKey} (${contentType}, ${typeof body === "string" ? Buffer.byteLength(body) : body.length} bytes) -> ${filePath}`);
  return { key: safeKey, url: `/api/storage/${encodeURIComponent(safeKey)}` };
}

export async function getObject(key: string): Promise<Buffer | null> {
  const safeKey = key.replace(/[^a-zA-Z0-9._\-\/]/g, "_");
  const filePath = path.join(UPLOAD_DIR, safeKey);
  try { return await fs.promises.readFile(filePath); } catch { console.log(`[storage] miss ${safeKey}`); return null; }
}
