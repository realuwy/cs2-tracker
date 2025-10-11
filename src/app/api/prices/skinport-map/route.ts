import { NextResponse } from "next/server";

export const revalidate = 900; // 15 min server cache

type SPItem = {
  market_hash_name: string;
  min_price?: number | null;
  suggested_price?: number | null;
  image?: string | null;
};

async function safeJson(url: string): Promise<SPItem[]> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "cs2-tracker/1.0" } });
    if (!res.ok) return [];
    const data = (await res.json()) as unknown;
    return Array.isArray(data) ? (data as SPItem[]) : [];
  } catch {
    return [];
  }
}

export async function GET() {
  // A: priced list (often lacks image)
  const pricedUrl = "https://api.skinport.com/v1/items?app_id=730&currency=AUD";
  // B: generic list (usually has image)
  const genericUrl = "https://api.skinport.com/v1/items?app_id=730";

  const [priced, generic] = await Promise.all([safeJson(pricedUrl), safeJson(genericUrl)]);

  const imagesByName: Record<string, string> = {};
  for (const it of generic) {
    if (it?.market_hash_name && typeof it.image === "string" && it.image) {
      imagesByName[it.market_hash_name] = it.image;
    }
  }

  const map: Record<string, number> = {};
  // Fallback: if priced is empty for some reason, use generic for prices too.
  const byNameFromGeneric = new Map(generic.map((g) => [g.market_hash_name, g]));
  const all = priced.length > 0 ? priced : generic;

  for (const it of all) {
    if (!it?.market_hash_name) continue;
    const primary = it;
    const fallback = byNameFromGeneric.get(it.market_hash_name);

    const min =
      typeof primary.min_price === "number" ? primary.min_price :
      typeof fallback?.min_price === "number" ? fallback.min_price : undefined;

    const suggested =
      typeof primary.suggested_price === "number" ? primary.suggested_price :
      typeof fallback?.suggested_price === "number" ? fallback.suggested_price : undefined;

    const price =
      (typeof min === "number" && isFinite(min) && min > 0 ? min : undefined) ??
      (typeof suggested === "number" && isFinite(suggested) && suggested > 0 ? suggested : undefined);

    if (price !== undefined) {
      map[it.market_hash_name] = price;
    }
    // hydrate images map as well (generic set already filled)
    if (!imagesByName[it.market_hash_name] && typeof it.image === "string" && it.image) {
      imagesByName[it.market_hash_name] = it.image;
    }
  }

  return NextResponse.json(
    { map, images: imagesByName, updatedAt: Date.now() },
    { status: 200 }
  );
}

