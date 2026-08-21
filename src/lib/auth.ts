import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
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
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionCookie(payload: SessionPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
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
  store.delete(COOKIE_NAME);
}

// Reads and verifies the session cookie. Returns null if absent/invalid —
// callers (API routes, middleware) must treat null as "not authenticated".
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
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
