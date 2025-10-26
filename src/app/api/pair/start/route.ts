import { NextResponse } from "next/server";
import { kv, PAIR_TTL_SECONDS, pairKey, PairRecord } from "@/lib/kv";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { id } = await req.json().catch(() => ({}));
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const code = randomUUID().replace(/-/g, "").slice(0, 24); // compact token
    const record: PairRecord = { id, status: "pending", createdAt: Date.now() };

    await kv.set(pairKey(code), record, { ex: PAIR_TTL_SECONDS });

    return NextResponse.json({ code, ttl: PAIR_TTL_SECONDS });
  } catch (e) {
    return NextResponse.json({ error: "pair:start failed" }, { status: 500 });
  }
}
