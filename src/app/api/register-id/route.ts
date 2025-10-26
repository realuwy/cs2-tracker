// src/app/api/register-id/route.ts
import { NextResponse } from "next/server";
import { kv, emailKey, idEmailKey } from "@/lib/kv";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { email, id, failIfExists } = await req.json().catch(() => ({}));
    if (!email || typeof email !== "string" || !id || typeof id !== "string") {
      return NextResponse.json({ error: "Missing email or id" }, { status: 400 });
    }

    const ek = emailKey(email);
    const existing = await kv.get<string>(ek);

    if (existing && failIfExists) {
      return NextResponse.json({ error: "Email already linked" }, { status: 409 });
    }

    // Create/overwrite email -> id and id -> email
    await kv.set(ek, id);
    await kv.set(idEmailKey(id), email);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "register-id failed" }, { status: 500 });
  }
}

