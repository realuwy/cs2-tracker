// src/app/api/auth/verify-code/route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// TODO: replace with your real verifier (e.g., Upstash, Supabase, Resend etc.)
async function verifyCode(email: string, code: string): Promise<boolean> {
  // Return true if the code matches for that email
  // Example placeholder:
  return typeof email === "string" && typeof code === "string" && code.length > 0;
}

function setSessionCookie(value: string) {
  const jar = cookies();
  jar.set({
    name: "session",
    value,                // ideally a signed JWT or opaque token
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: true,
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json().catch(() => ({} as any));
    if (!email || !code) {
      return NextResponse.json({ ok: false, error: "Missing email or code" }, { status: 400 });
    }

    const ok = await verifyCode(email, code);
    if (!ok) {
      return NextResponse.json({ ok: false, error: "Invalid code" }, { status: 401 });
    }

    // Create/attach a session for this email
    // In production, store a proper token; this is a placeholder
    setSessionCookie(JSON.stringify({ email }));

    return NextResponse.json(
      { ok: true, email },
      { headers: { "cache-control": "no-store, max-age=0" } }
    );
  } catch (err) {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  }
}

