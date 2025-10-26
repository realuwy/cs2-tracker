import { NextResponse } from "next/server";
import { codeKey, kv } from "@/lib/kv";
import { signToken } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json().catch(() => ({}));
    if (!email || !code) {
      return NextResponse.json({ error: "Email and code required" }, { status: 400 });
    }

    const key = codeKey(email);
    const rec = (await kv.get<{ code: string; tries: number }>(key)) || null;
    if (!rec) {
      return NextResponse.json({ error: "Code expired or invalid" }, { status: 400 });
    }

    const tries = (rec.tries ?? 0) + 1;
    if (tries > 5) {
      await kv.del(key);
      return NextResponse.json({ error: "Too many attempts. Request a new code." }, { status: 429 });
    }

    if (rec.code !== String(code).trim()) {
      await kv.set(key, { code: rec.code, tries }, { ex: 10 * 60 });
      return NextResponse.json({ error: "Incorrect code" }, { status: 401 });
    }

    // success
    await kv.del(key);
    const token = signToken(email.toLowerCase(), 60 * 60 * 24 * 7); // 7 days
    return NextResponse.json({ ok: true, token });
  } catch {
    return NextResponse.json({ error: "verify-code failed" }, { status: 500 });
  }
}
