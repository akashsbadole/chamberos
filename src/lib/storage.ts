// Storage abstraction – local filesystem in dev (`./uploads`), S3 in prod when S3_BUCKET + AWS creds are set.
// Env: S3_BUCKET, S3_REGION (default ap-south-1), AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_ENDPOINT (for MinIO/R2)
import fs from "fs";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const S3_BUCKET = process.env.S3_BUCKET;
const S3_REGION = process.env.S3_REGION || "ap-south-1";

function ensureDir() {
  try { fs.mkdirSync(UPLOAD_DIR, { recursive: true }); } catch {}
}

export async function putObject(key: string, body: Buffer | string, contentType = "application/octet-stream"): Promise<{ url: string; key: string }> {
  const safeKey = key.replace(/[^a-zA-Z0-9._\-\/]/g, "_");
  if (S3_BUCKET) {
    try {
      // Lazy import — `npm install @aws-sdk/client-s3` only needed when S3_BUCKET is set
      // @ts-ignore — optional dep, fallback to local if not installed
      const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
      const client = new S3Client({ region: S3_REGION, endpoint: process.env.S3_ENDPOINT || undefined, forcePathStyle: !!process.env.S3_ENDPOINT });
      await client.send(new PutObjectCommand({ Bucket: S3_BUCKET, Key: safeKey, Body: typeof body === "string" ? Buffer.from(body) : body, ContentType: contentType }));
      const url = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${safeKey}`;
      console.log(`[storage:s3] put s3://${S3_BUCKET}/${safeKey}`);
      return { key: safeKey, url };
    } catch (e) { console.error("[storage:s3] failed, falling back to local", e); }
  }
  ensureDir();
  const filePath = path.join(UPLOAD_DIR, safeKey);
  try {
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, body);
  } catch (e) { console.error("[storage] write failed", e); }
  console.log(`[storage:local] put ${safeKey} (${contentType}, ${typeof body === "string" ? Buffer.byteLength(body) : body.length} bytes) -> ${filePath}`);
  return { key: safeKey, url: `/api/storage/${encodeURIComponent(safeKey)}` };
}

export async function getObject(key: string): Promise<Buffer | null> {
  const safeKey = key.replace(/[^a-zA-Z0-9._\-\/]/g, "_");
  const filePath = path.join(UPLOAD_DIR, safeKey);
  try { return await fs.promises.readFile(filePath); } catch { console.log(`[storage] miss ${safeKey}`); return null; }
}
