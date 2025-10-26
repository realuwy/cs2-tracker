// src/app/api/rows/set/route.ts
export const runtime = "edge";

import { NextResponse } from "next/server";
import { redis, rowsKey, rowsTsKey } from "@/lib/kv";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const id = body?.id?.trim();
  const rows = Array.isArray(body?.rows) ? body.rows : [];

  if (!id) {
    return NextResponse.json({ ok: false, error: "missing id" }, { status: 400 });
  }

  const key = rowsKey(id);
  const tsKey = rowsTsKey(id);

  await Promise.all([
    redis.set(key, JSON.stringify(rows), { ex: 60 * 60 * 24 * 90 }), // keep 90 days
    redis.set(tsKey, Date.now()),
  ]);

  return NextResponse.json({ ok: true });
}
