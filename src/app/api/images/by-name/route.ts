import { NextResponse } from "next/server";

export const revalidate = 60 * 60; // 1 hour

function okUrl(u?: string | null) {
  if (!u) return null;
  try {
    const url = new URL(u);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

async function trySkinport(name: string): Promise<string | null> {
  try {
    // The public Skinport items feed is large; here we try the listing page query first.
    // If Skinport adds a name filter in the future, swap to that.
    const url = "https://api.skinport.com/v1/items?app_id=730&tradable=1&currency=AUD";
    const res = await fetch(url, { headers: { "User-Agent": "cs2-tracker/1.0" } });
    if (!res.ok) return null;
    const arr = (await res.json()) as Array<{ market_hash_name?: string; image?: string }>;
    // exact match first, then starless match (★ → removed)
    const starless = name.replace(/^★\s*/u, "");
    const item =
      arr.find((x) => x.market_hash_name === name) ??
      arr.find((x) => x.market_hash_name === starless);
    return okUrl(item?.image);
  } catch {
    return null;
  }
}

async function trySteamListing(name: string): Promise<string | null> {
  try {
    const url = `https://steamcommunity.com/market/listings/730/${encodeURIComponent(name)}`;
    const res = await fetch(url, { headers: { "User-Agent": "cs2-tracker/1.0" }, cache: "no-store" });
    if (!res.ok) return null;
    const html = await res.text();

    // Large preview on listing page
    const m = html.match(/<img[^>]+id="market_listing_largeimage"[^>]+src="([^"]+)"/i);
    if (m && m[1]) return okUrl(m[1]);

    // Fallback: any economy image on the page
    const m2 = html.match(/https?:\/\/[^"]+\/economy\/image\/[^"]+/i);
    if (m2 && m2[0]) return okUrl(m2[0]);

    return null;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name");
    if (!name) return NextResponse.json({ url: null }, { status: 400 });

    // 1) Skinport
    let url = await trySkinport(name);
    // 2) Steam Market page
    if (!url) url = await trySteamListing(name);

    return NextResponse.json({ url: url ?? null }, { status: 200 });
  } catch {
    return NextResponse.json({ url: null }, { status: 200 });
  }
}
