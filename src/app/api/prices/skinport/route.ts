import { NextResponse } from "next/server";

const APP_ID = 730;
const CURRENCY = process.env.SKINPORT_CURRENCY || "AUD";
const URL = `https://api.skinport.com/v1/items?app_id=${APP_ID}&currency=${encodeURIComponent(CURRENCY)}`;

type SkinportItem = {
  market_hash_name?: string;
  market_name?: string;
  lowest_price?: number | string;
  min_price?: number | string;
  suggested_price?: number | string;
};

let cache: { at: number; data: Record<string, number> } | null = null;
const TTL_MS = 10 * 60 * 1000;

export const dynamic = "force-dynamic";

export async function GET() {
  if (cache && Date.now() - cache.at < TTL_MS) {
    return NextResponse.json({ currency: CURRENCY, map: cache.data });
  }

  const r = await fetch(URL, { next: { revalidate: 600 } });
  if (!r.ok) {
    return NextResponse.json({ error: "Skinport fetch failed" }, { status: 502 });
  }
  const arr = (await r.json()) as SkinportItem[];

  const map: Record<string, number> = {};
  for (const it of arr) {
    const key = it.market_hash_name || it.market_name;
    if (!key) continue;
    const v =
      toNum(it.lowest_price) ??
      toNum(it.min_price) ??
      toNum(it.suggested_price);
    if (typeof v === "number") map[key] = round2(v);
  }
  cache = { at: Date.now(), data: map };
  return NextResponse.json({ currency: CURRENCY, map });
}

function toNum(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(/[^\d.,-]/g, "").replace(",", ".");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}
function round2(n: number) {
  return Math.round(n * 100) / 100;
}

