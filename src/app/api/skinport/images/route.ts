import { NextResponse } from "next/server";

/**
 * Public Skinport items endpoint includes an `image` for each `market_hash_name`.
 * We return a compact { [market_hash_name]: imageUrl } map.
 */
export const revalidate = 60 * 60; // 1 hour

export async function GET() {
  try {
    // AUD not required for images, but harmless to include
    const url = "https://api.skinport.com/v1/items?app_id=730&currency=AUD&tradable=1";
    const res = await fetch(url, { headers: { "User-Agent": "cs2-tracker/1.0" } });
    if (!res.ok) return NextResponse.json({ images: {} }, { status: 200 });

    type Item = { market_hash_name: string; image: string };
    const data = (await res.json()) as Item[];

    const images: Record<string, string> = {};
    for (const it of data) {
      if (it?.market_hash_name && it?.image) {
        images[it.market_hash_name] = it.image;
      }
    }
    return NextResponse.json({ images }, { status: 200 });
  } catch {
    return NextResponse.json({ images: {} }, { status: 200 });
  }
}
