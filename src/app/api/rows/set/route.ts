import { NextResponse } from "next/server";
import { kv } from "@/lib/kv";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { email, rows } = await req.json().catch(() => ({}));
  if (!email || !Array.isArray(rows)) return NextResponse.json({ ok: false }, { status: 400 });
  const key = `cs2:rows:${email.toLowerCase()}`;
  await kv.set(key, rows);
  return NextResponse.json({ ok: true }, { headers: { "cache-control": "no-store" } });
}
