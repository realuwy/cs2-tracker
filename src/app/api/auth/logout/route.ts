// src/app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAMES = ["sid", "session", "auth_session"];
const EMAIL_COOKIE_NAMES = ["auth_email", "email"];

export const runtime = "nodejs";

export async function POST() {
  const jar = cookies();

  [...SESSION_COOKIE_NAMES, ...EMAIL_COOKIE_NAMES].forEach((name) => {
    if (jar.get(name)) {
      // ✅ Next 14 cookies API
      jar.set(name, "", {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: true,
        expires: new Date(0),
      });
    }
  });

  return NextResponse.json({ ok: true });
}
