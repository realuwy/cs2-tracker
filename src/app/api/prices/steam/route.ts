import { NextResponse } from "next/server";

export const revalidate = 600; // 10 minutes

// Steam currency code for AUD
const STEAM_CURRENCY_AUD = 22;

function parseSteamMoney(raw?: string | null): number | null {
  if (!raw) return null;

  // Keep digits, comma, dot, and spaces; drop currency symbols and others
  let s = raw.replace(/[^0-9,.\s]/g, "").trim();

  // Remove spaces
  s = s.replace(/\s+/g, "");

  // If both comma and dot exist, treat comma as thousands separator
  if (s.includes(",") && s.includes(".")) {
    s = s.replace(/,/g, "");
  } else if (s.includes(",") && !s.includes(".")) {
    // Only comma present -> treat as decimal separator
    s = s.replace(/,/g, ".");
  }

  const val = parseFloat(s);
  if (!isFinite(val) || val <= 0) return null;
  if (val > 100000) return null; // sanity cap
  return val;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name");
    if (!name) return NextResponse.json({ error: "Missing ?name" }, { status: 400 });

    const url = `https://steamcommunity.com/market/priceoverview/?appid=730&currency=${STEAM_CURRENCY_AUD}&market_hash_name=${encodeURIComponent(
      name
    )}`;

    const res = await fetch(url, { headers: { "User-Agent": "cs2-tracker/1.0" } });
    if (!res.ok) return NextResponse.json({ aud: null }, { status: 200 });

    const data = (await res.json()) as {
      success?: boolean;
      lowest_price?: string;
      median_price?: string;
    };

    if (!data?.success) return NextResponse.json({ aud: null }, { status: 200 });

    const price =
      parseSteamMoney(data.lowest_price) ??
      parseSteamMoney(data.median_price) ??
      null;

    return NextResponse.json({ aud: price }, { status: 200 });
  } catch {
    return NextResponse.json({ aud: null }, { status: 200 });
  }
}
