// src/app/api/rows/get/route.ts
export const runtime = "edge";

import { NextResponse } from "next/server";
import { redis, rowsKey, rowsTsKey } from "@/lib/kv";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id")?.trim();

  if (!id) {
    return NextResponse.json({ ok: false, error: "missing id" }, { status: 400 });
  }

  const key = rowsKey(id);
  const tsKey = rowsTsKey(id);

  const [raw, ts] = await Promise.all([
    redis.get<string>(key),
    redis.get<number>(tsKey),
  ]);

  let rows: any[] = [];
  try {
    rows = raw ? JSON.parse(raw) : [];
  } catch {
    rows = [];
  }

  return NextResponse.json({ ok: true, rows, updatedAt: ts ?? null });
}
