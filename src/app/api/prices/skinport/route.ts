import { NextResponse } from "next/server";

/**
 * GET /api/prices/skinport
 * Fetches Skinport marketplace prices for CS2 (app_id=730) in AUD.
 * We revalidate every 5 minutes to respect Skinport's caching guidance.
 * Docs: https://docs.skinport.com/items
 */
export const revalidate = 300; // seconds

type SkinportItem = {
  market_hash_name: string;
  currency: string;
  min_price: number | null;
  median_price: number | null;
  quantity: number | null;
  // other fields exist but we don't need them yet
};

function exteriorFromName(name: string): string {
  // Pulls (Factory New), (Minimal Wear), etc. and compresses to FN/MW/FT/WW/BS
  const m = name.match(/\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)/i);
  const map: Record<string, string> = {
    "factory new": "FN",
    "minimal wear": "MW",
    "field-tested": "FT",
    "well-worn": "WW",
    "battle-scarred": "BS",
  };
  return m ? (map[m[1].toLowerCase()] ?? m[1]) : "";
}

export async function GET() {
  const params = new URLSearchParams({
    app_id: "730",
    currency: "AUD",
    tradable: "0",
  });

  const res = await fetch(`https://api.skinport.com/v1/items?${params.toString()}`, {
    // Accept-Encoding is optional; Skinport shows it in examples
    headers: { "Accept-Encoding": "br" },
    // Let Next.js cache/revalidate on the server
    next: { revalidate },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch Skinport prices" }, { status: 502 });
  }

  const raw: SkinportItem[] = await res.json();

  // Map to your Item shape (src/lib/types.ts) with safe fallbacks
  const items = raw.map((it) => ({
    name: it.market_hash_name,
    exterior: exteriorFromName(it.market_hash_name),
    icon: "https://placehold.co/40x40", // placeholder; we’ll swap to real icons later
    qty: it.quantity ?? undefined,
    priceMedian: it.median_price ?? undefined,
    priceMin: it.min_price ?? undefined,
    lastSale: undefined,
    delta1h: undefined,
    delta24h: undefined,
    delta30d: undefined,
  }));

  // Limit to a sensible amount for now (you can remove slice later)
  return NextResponse.json(items.slice(0, 400));
}
