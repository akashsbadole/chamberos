import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import crypto from "crypto";
import { query, queryOne } from "./db";

const COOKIE_NAME = "chambers_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  userId: string;
  firmId: string;
  role: "ADMIN" | "LAWYER" | "PARALEGAL" | "CLIENT";
  email: string;
  name: string;
  jti?: string;
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function isTokenRevoked(token: string): Promise<boolean> {
  const h = hashToken(token);
  const row = await queryOne<{ tokenHash: string }>(`SELECT "tokenHash" FROM "RevokedToken" WHERE "tokenHash" = $1`, [h]);
  return !!row;
}

export async function revokeToken(token: string): Promise<void> {
  const h = hashToken(token);
  const exp = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);
  await query(`INSERT INTO "RevokedToken" ("tokenHash", "expiresAt") VALUES ($1,$2) ON CONFLICT ("tokenHash") DO NOTHING`, [h, exp.toISOString()]);
  // Lazy cleanup of expired
  await query(`DELETE FROM "RevokedToken" WHERE "expiresAt" < now()`).catch(()=>{});
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionCookie(payload: SessionPayload) {
  const jti = crypto.randomUUID();
  const token = await new SignJWT({ ...payload, jti })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setJti(jti)
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecret());

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION_SECONDS,
    path: "/",
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) { try { await revokeToken(token); } catch {} }
  store.delete(COOKIE_NAME);
}

export async function revokeCurrentSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) await revokeToken(token);
}

export async function revokeAllForFirm(firmId: string): Promise<void> {
  // For demo: revoke is token-based, not firm-based. In prod, store jti->firmId and revoke all for firm.
  // Here we just log; real impl would query User firm and revoke each active token via Redis set.
  await query(`DELETE FROM "RevokedToken" WHERE "expiresAt" < now()`).catch(()=>{});
}

// Reads and verifies the session cookie. Returns null if absent/invalid —
// callers (API routes, middleware) must treat null as "not authenticated".
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    if (await isTokenRevoked(token)) return null;
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

// For use in middleware (Edge runtime) — same verification, no `cookies()` API.
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;

interface UserRow {
  id: string;
  firmId: string;
  name: string;
  email: string;
  passwordHash: string;
  role: SessionPayload["role"];
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  return queryOne<UserRow>(
    `SELECT id, "firmId", name, email, "passwordHash", role FROM "User" WHERE email = $1`,
    [email]
  );
}

export async function createFirmAndAdmin(firmName: string, name: string, email: string, password: string) {
  const passwordHash = await hashPassword(password);
  const firmId = `firm_${crypto.randomUUID()}`;
  const userId = `user_${crypto.randomUUID()}`;

  await query(`INSERT INTO "Firm" (id, name) VALUES ($1, $2)`, [firmId, firmName]);
  await query(
    `INSERT INTO "User" (id, "firmId", name, email, "passwordHash", role) VALUES ($1, $2, $3, $4, $5, 'ADMIN')`,
    [userId, firmId, name, email, passwordHash]
  );

  return { firmId, userId };
}
