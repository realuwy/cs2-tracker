import { NextResponse } from "next/server";

export const revalidate = 900; // cache 15m on the server

export async function GET() {
  const url = "https://api.skinport.com/v1/items?app_id=730&currency=AUD";

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "cs2-tracker/1.0" },
    });

    if (!res.ok) {
      return NextResponse.json(
        { map: {}, images: {}, updatedAt: Date.now() },
        { status: 200 }
      );
    }

    type SPItem = {
      market_hash_name: string;
      min_price?: number | null;
      suggested_price?: number | null;
      image?: string | null;
    };

    const data = (await res.json()) as SPItem[];

    const map: Record<string, number> = {};
    const images: Record<string, string> = {};

    for (const it of data) {
      if (!it?.market_hash_name) continue;

      const price =
        (typeof it.min_price === "number" && isFinite(it.min_price) && it.min_price > 0
          ? it.min_price
          : undefined) ??
        (typeof it.suggested_price === "number" && isFinite(it.suggested_price) && it.suggested_price > 0
          ? it.suggested_price
          : undefined);

      if (price !== undefined) map[it.market_hash_name] = price;
      if (it.image && typeof it.image === "string") images[it.market_hash_name] = it.image;
    }

    return NextResponse.json({ map, images, updatedAt: Date.now() }, { status: 200 });
  } catch {
    return NextResponse.json(
      { map: {}, images: {}, updatedAt: Date.now() },
      { status: 200 }
    );
  }
}
