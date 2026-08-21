// Storage abstraction – local DB blob in dev, S3 in prod.
// Swap `putObject` to use @aws-sdk/client-s3 when S3 creds are available.
export async function putObject(key: string, body: Buffer | string, contentType = "application/octet-stream"): Promise<{ url: string; key: string }> {
  // Dev: log and return a pseudo URL; in prod upload to S3 and return presigned URL
  console.log(`[storage stub] put ${key} (${contentType}, ${typeof body === "string" ? body.length : body.length} bytes)`);
  return { key, url: `/api/storage/${encodeURIComponent(key)}` };
}

export async function getObject(key: string): Promise<Buffer | null> {
  console.log(`[storage stub] get ${key}`);
  return null;
}
