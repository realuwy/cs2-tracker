import { NextResponse } from "next/server";
import { kv, pairKey, PairRecord, PAIR_TTL_SECONDS } from "@/lib/kv";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { code } = await req.json().catch(() => ({}));
    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Missing code" }, { status: 400 });
    }

    const key = pairKey(code);
    const record = (await kv.get<PairRecord>(key)) || null;
    if (!record) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 410 });
    }
    if (record.status === "claimed") {
      // Already used once — reject replays
      return NextResponse.json({ error: "Code already claimed" }, { status: 409 });
    }

    const updated: PairRecord = {
      ...record,
      status: "claimed",
      claimedAt: Date.now(),
    };

    // Update but keep short TTL so the desktop can still see “claimed”
    await kv.set(key, updated, { ex: Math.max(30, PAIR_TTL_SECONDS - Math.floor((Date.now() - record.createdAt) / 1000)) });

    return NextResponse.json({ id: record.id, ok: true });
  } catch {
    return NextResponse.json({ error: "pair:claim failed" }, { status: 500 });
  }
}
