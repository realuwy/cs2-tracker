// src/lib/api.ts

/** Basic inventory row used by dashboard/portfolio UIs */
export type InvItem = {
  market_hash_name: string;      // e.g. "AK-47 | Redline (Factory New)" or "Sticker | ... (none)"
  name: string;                  // display name (can equal market_hash_name)
  nameNoWear: string;            // e.g. "AK-47 | Redline"
  wear?: "" | "FN" | "MW" | "FT" | "WW" | "BS";
  pattern?: string;
  float?: string;
  image: string;
  inspectLink: string;
  quantity?: number;
};

/** Try a list of endpoints until one responds OK. */
async function tryFetchJson<T>(urls: string[]): Promise<T | null> {
  for (const u of urls) {
    try {
      const r = await fetch(u, { cache: "no-store" });
      if (r.ok) {
        return (await r.json()) as T;
      }
    } catch {
      // keep trying next url
    }
  }
  return null;
}

/**
 * Fetch Steam inventory (normalized to { items: InvItem[] }).
 * NOTE: Update the endpoint list below if your API route has a different path.
 */
export async function fetchInventory(
  steamId?: string
): Promise<{ items: InvItem[] }> {
  if (!steamId) return { items: [] };

  // Try a few likely routes; keep the one that matches your project.
  const qs = `steamId=${encodeURIComponent(steamId)}`;
  const candidates = [
    `/api/steam/inventory?${qs}`,
    `/api/inventory?${qs}`,
  ];

  const res = await tryFetchJson<{ items?: InvItem[]; data?: InvItem[] }>(candidates);

  // Accept either { items: [...] } or { data: [...] }
  const items =
    (res?.items as InvItem[] | undefined) ??
    (res?.data as InvItem[] | undefined) ??
    [];

  return { items };
}

/**
 * Skinport price map for **all** CS2 items (not just skins).
 * Returns a dictionary: market_hash_name -> price (AUD).
 */
export async function fetchSkinportMap(): Promise<{ map: Record<string, number> }> {
  const url = "https://api.skinport.com/v1/items?app_id=730&currency=AUD";
  try {
    const res = await fetch(url, {
      // Cache for 30 minutes on the server/edge if Next uses this in RSC;
      // client calls still get standard browser caching.
      next: { revalidate: 60 * 30 },
    });
    if (!res.ok) return { map: {} };

    type SPItem = {
      market_hash_name: string;
      min_price?: number | null;       // AUD
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
        map[it.market_hash_name] = price;
      }
    }
    return { map };
  } catch {
    return { map: {} };
  }
}
