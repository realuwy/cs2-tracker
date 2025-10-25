// src/app/api/register-id/route.ts
import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

export const runtime = "edge";

type Body = { email?: string; userId: string };

function isUuidV4(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}
const norm = (e?: string) => (e || "").trim().toLowerCase();

export async function POST(req: Request) {
  try {
    const { email, userId } = (await req.json()) as Body;
    if (!isUuidV4(userId)) return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
    const em = norm(email);
    if (!em) return NextResponse.json({ ok: true, message: "No email provided; local only" });

    await kv.set(`email:${em}`, userId);
    await kv.set(`uid:${userId}`, em);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Internal error" }, { status: 500 });
  }
}
