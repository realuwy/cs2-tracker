import { NextResponse } from "next/server";
import { kv } from "@/lib/kv";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  if (!email) return NextResponse.json({ rows: [] }, { status: 400 });
  const key = `cs2:rows:${email.toLowerCase()}`;
  const rows = (await kv.get(key)) || [];
  return NextResponse.json({ rows }, { headers: { "cache-control": "no-store" } });
}

