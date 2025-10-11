// src/app/api/prices/skinport-map/route.ts
import { NextResponse } from "next/server";

export const revalidate = 900; // 15 minutes (server cache)

export async function GET() {
  const url = "https://api.skinport.com/v1/items?app_id=730&currency=AUD";

  try {
    const res = await fetch(url, {
      // Always fetch server-side (no CORS issues); allow Next to cache
      headers: { "User-Agent": "cs2-tracker/1.0" },
      // revalidate above controls cache; keep no-store off here
    });

    if (!res.ok) {
      return NextResponse.json({ map: {}, updatedAt: Date.now() }, { status: 200 });
    }

    type SPItem = {
      market_hash_name: string;
      min_price?: number | null;
      suggested_price?: number | null;
    };

    const data = (await res.json()) as SPItem[];
    const map: Record<string, number> = {};
    for (const it of data) {
      if (!it?.market_hash_name) continue;
      const price =
        (typeof it.min_price === "number" && isFinite(it.min_price) && it.min_price > 0
          ? it.min_price
          : undefined) ??
        (typeof it.suggested_price === "number" && isFinite(it.suggested_price) && it.suggested_price > 0
          ? it.suggested_price
          : undefined);
      if (price !== undefined) {
        map[it.market_hash_name] = price;
      }
    }

    return NextResponse.json({ map, updatedAt: Date.now() }, { status: 200 });
  } catch {
    // If Skinport hiccups, return last-good shape (empty map) so UI stays stable
    return NextResponse.json({ map: {}, updatedAt: Date.now() }, { status: 200 });
  }
}
