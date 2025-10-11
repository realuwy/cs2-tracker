import { NextResponse } from "next/server";

const FX_AUD_PER_USD = Number(process.env.FX_AUD_PER_USD || "1.55");
const URL = (mhn: string) =>
  `https://steamcommunity.com/market/priceoverview/?appid=730&currency=1&market_hash_name=${encodeURIComponent(mhn)}`;

type SteamResp = { success: boolean; lowest_price?: string; median_price?: string };

let cache = new Map<string, { at: number; aud: number | null }>();
const TTL = 10 * 60 * 1000; // 10 min

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");
  if (!name) return NextResponse.json({ error: "Missing ?name" }, { status: 400 });

  const hit = cache.get(name);
  if (hit && Date.now() - hit.at < TTL) {
    return NextResponse.json({ name, aud: hit.aud, fx: FX_AUD_PER_USD });
  }

  try {
    const r = await fetch(URL(name), { cache: "no-store", next: { revalidate: 0 } });
    if (!r.ok) throw new Error(String(r.status));
    const data = (await r.json()) as SteamResp;
    if (!data?.success) {
      cache.set(name, { at: Date.now(), aud: null });
      return NextResponse.json({ name, aud: null, fx: FX_AUD_PER_USD });
    }
    const usd = parseUSD(data.lowest_price || data.median_price || "");
    const aud = typeof usd === "number" ? round2(usd * FX_AUD_PER_USD) : null;
    cache.set(name, { at: Date.now(), aud });
    return NextResponse.json({ name, aud, fx: FX_AUD_PER_USD });
  } catch {
    cache.set(name, { at: Date.now(), aud: null });
    return NextResponse.json({ name, aud: null, fx: FX_AUD_PER_USD }, { status: 502 });
  }
}

function parseUSD(s: string): number | null {
  if (!s) return null;
  const n = parseFloat(s.replace(/[^\d.,-]/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}
function round2(n: number) { return Math.round(n * 100) / 100; }
