import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Runs on the Edge runtime — can't import src/lib/auth.ts directly (it uses
// next/headers' cookies() + node's bcrypt), so session verification is
// duplicated here in a minimal form. Keep the JWT payload shape in sync with
// src/lib/auth.ts's SessionPayload.

const COOKIE_NAME = "chambers_session";
const PUBLIC_PATHS = ["/login", "/register"];
const PUBLIC_API_PREFIXES = ["/api/auth/"];

// --- Rate limiting (in-memory, per-instance; replace with Redis/Upstash for multi-instance) ---
const rateBuckets = new Map<string, number[]>();
function hitRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const arr = rateBuckets.get(key) ?? [];
  const recent = arr.filter((t) => now - t < windowMs);
  recent.push(now);
  rateBuckets.set(key, recent);
  // lazy cleanup to avoid unbounded growth
  if (rateBuckets.size > 5000) {
    for (const [k, v] of rateBuckets) if (v.length === 0 || now - v[v.length - 1] > windowMs) rateBuckets.delete(k);
  }
  return recent.length > max;
}
function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

function getSecret(): Uint8Array {
  return new TextEncoder().encode(process.env.AUTH_SECRET ?? "");
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rate limiting + optional CAPTCHA for sensitive endpoints
  const ip = clientIp(req);
  if (pathname === "/api/auth/login" || pathname === "/api/auth/register") {
    if (hitRateLimit(`auth:${ip}`, 5, 60_000)) {
      return NextResponse.json({ error: "Too many requests. Try again in a minute." }, { status: 429, headers: { "Retry-After": "60" } });
    }
    if (process.env.CAPTCHA_SECRET) {
      const captcha = req.headers.get("x-captcha-token");
      if (!captcha) {
        // In prod, require CAPTCHA after 3 attempts; here we just log and allow if no token but rate limit will catch abuse
        // To enforce: return NextResponse.json({ error: "CAPTCHA required" }, { status: 400 });
      }
    }
  }
  if (pathname === "/api/ai") {
    if (hitRateLimit(`ai:${ip}`, 20, 60_000)) {
      return NextResponse.json({ error: "AI rate limit exceeded" }, { status: 429, headers: { "Retry-After": "60" } });
    }
  }

  if (PUBLIC_PATHS.includes(pathname) || PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) {
    const res = NextResponse.next();
    addSecurityHeaders(res);
    return res;
  }

  // Let Next.js internals and static assets through untouched.
  if (pathname.startsWith("/_next") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return redirectToLogin(req);
  }

  try {
    await jwtVerify(token, getSecret());
    const res = NextResponse.next();
    addSecurityHeaders(res);
    return res;
  } catch {
    return redirectToLogin(req);
  }
}

function addSecurityHeaders(res: NextResponse) {
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  // CSP is intentionally permissive for Next dev; tighten in production via next.config
}

function redirectToLogin(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
