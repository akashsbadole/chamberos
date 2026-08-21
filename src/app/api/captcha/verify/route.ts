import { NextRequest, NextResponse } from "next/server";

// Stub: in dev, any non-empty token passes; in prod, verify against hCaptcha/reCAPTCHA secret
export async function POST(req: NextRequest) {
  const { token } = await req.json().catch(()=> ({}));
  const secret = process.env.CAPTCHA_SECRET;
  if (!secret) return NextResponse.json({ ok: true, stub: true }); // no secret = dev bypass
  if (!token) return NextResponse.json({ error: "captcha required" }, { status: 400 });
  // In prod: verify via fetch to hcaptcha.com/siteverify or google recaptcha
  // const res = await fetch(`https://hcaptcha.com/siteverify`, { method:"POST", body: new URLSearchParams({ secret, response: token }) });
  // const data = await res.json(); if (!data.success) return 400;
  return NextResponse.json({ ok: true });
}
