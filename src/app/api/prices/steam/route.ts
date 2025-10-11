// src/app/api/prices/steam/route.ts
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name");
    if (!name) {
      return NextResponse.json({ error: "Missing ?name" }, { status: 400 });
    }

    // 18 = AUD, Steam Market priceoverview
    const u = new URL("https://steamcommunity.com/market/priceoverview/");
    u.searchParams.set("appid", "730");
    u.searchParams.set("currency", "18");
    u.searchParams.set("market_hash_name", name);

    const r = await fetch(u.toString(), {
      // avoid being cached too long by edge
      cache: "no-store",
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const j = (await r.json()) as
      | { success: boolean; lowest_price?: string; median_price?: string }
      | any;

    if (!j?.success) return NextResponse.json({ aud: null });

    const parseAUD = (s?: string) => {
      if (!s) return undefined;
      // Steam formats vary by locale, handle both "A$1.23" and "$1.23 AUD"
      const num = Number(s.replace(/[^\d.,]/g, "").replace(",", "."));
      return isFinite(num) ? num : undefined;
    };

    const aud = parseAUD(j.lowest_price) ?? parseAUD(j.median_price);
    return NextResponse.json({ aud: aud ?? null });
  } catch {
    return NextResponse.json({ aud: null });
  }
}
