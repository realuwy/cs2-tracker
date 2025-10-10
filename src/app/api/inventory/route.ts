import { NextResponse } from "next/server";

// Placeholder: in production, fetch public inventory JSON from Steam community endpoint
// and normalize to your Item shape. We return demo data for now.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const steamUrl = body?.url ?? "";
  if (!steamUrl) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  // TODO: call steamcommunity inventory endpoint and map
  const demo = [
    {
      name: "AK-47 | Redline (Field-Tested)",
      exterior: "FT",
      icon: "https://community.cloudflare.steamstatic.com/economy/image/IzFakeDemoHash/64fx64f",
      qty: 1,
      priceMedian: 21.5,
      priceMin: 20.9,
      lastSale: 21.1,
      delta1h: 0.4,
      delta24h: 2.1,
      delta30d: 5.9
    }
  ];

  return NextResponse.json({ items: demo });
}
