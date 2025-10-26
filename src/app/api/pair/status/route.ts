import { NextResponse } from "next/server";
import { kv, pairKey, PairRecord } from "@/lib/kv";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code") || "";
  if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });

  const record = (await kv.get<PairRecord>(pairKey(code))) || null;
  if (!record) return NextResponse.json({ status: "expired" as const });

  return NextResponse.json({ status: record.status });
}
