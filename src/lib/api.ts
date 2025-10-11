// src/lib/api.ts
export async function fetchSkinportMap(): Promise<{ map: Record<string, number> }> {
  // Public endpoint, no auth required. Includes ALL CS2 items, not just skins.
  const url = "https://api.skinport.com/v1/items?app_id=730&currency=AUD";
  const res = await fetch(url, { next: { revalidate: 60 * 30 } }); // cache 30m
  if (!res.ok) return { map: {} };

  type SPItem = {
    market_hash_name: string;
    min_price?: number | null; // AUD
    suggested_price?: number | null; // fallback
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
      // exact match by market_hash_name covers stickers/agents/cases too
      map[it.market_hash_name] = price;
    }
  }
  return { map };
}
