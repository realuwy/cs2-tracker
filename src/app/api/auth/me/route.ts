// src/app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { kv } from "@/lib/kv";

// If your KV session uses a different cookie name, add it here:
const SESSION_COOKIE_NAMES = ["sid", "session", "auth_session"];
const EMAIL_COOKIE_NAMES = ["auth_email", "email"];

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

export async function GET() {
  // ... read auth cookie / session and derive email
  const email = /* your lookup here, or null */ null;

  return new Response(JSON.stringify({ email }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      pragma: "no-cache",
      expires: "0",
      "surrogate-control": "no-store",
    },
  });
}


export async function GET() {
  try {
    const jar = cookies();

    // 1) Fast path: some flows store the email directly in a cookie
    for (const name of EMAIL_COOKIE_NAMES) {
      const v = jar.get(name)?.value;
      if (v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
        return NextResponse.json({ email: v });
      }
    }

    // 2) KV session lookup by ID from cookie (sid / session / auth_session)
    for (const name of SESSION_COOKIE_NAMES) {
      const sid = jar.get(name)?.value;
      if (!sid) continue;

      // Convention: session data stored under `session:${sid}` -> { email: string, ... }
      try {
        const session = (await kv.get(`session:${sid}`)) as { email?: string } | null;
        if (session?.email) {
          return NextResponse.json({ email: session.email });
        }
      } catch {
        // ignore and try next option
      }
    }

    // Not signed in
    return NextResponse.json({ email: null });
  } catch {
    // On any error, return anonymous
    return NextResponse.json({ email: null });
  }
}
