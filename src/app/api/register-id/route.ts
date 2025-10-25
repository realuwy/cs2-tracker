import { NextResponse } from "next/server";
import { kv, P } from "@/lib/kv";

export const runtime = "edge";

type Body = { email?: string; userId: string };

const norm = (e?: string) => (e || "").trim().toLowerCase();
const isUuidV4 = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

export async function POST(req: Request) {
  try {
    const { email, userId } = (await req.json()) as Body;

    if (!isUuidV4(userId)) {
      return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
    }

    const em = norm(email);
    if (!em) {
      // Local-only path (user didn't provide email)
      return NextResponse.json({ ok: true, message: "Local-only: no email linked" });
    }

    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      // Soft-ack so the app keeps working even if KV not configured
      return NextResponse.json({ ok: false, message: "KV not configured" }, { status: 202 });
    }

    // Idempotent: overwrite with latest mapping
    await kv.set(P(`email:${em}`), userId);
    await kv.set(P(`uid:${userId}`), em);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Internal error" }, { status: 500 });
  }
}
