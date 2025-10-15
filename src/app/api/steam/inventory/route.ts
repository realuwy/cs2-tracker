// src/app/api/steam/inventory/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";        // ensure Node runtime (not Edge)
export const dynamic = "force-dynamic"; // no static caching
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let id = (searchParams.get("id") || "").trim();

    if (!id) {
      return NextResponse.json({ error: "Missing 'id' (SteamID64 or /profiles/<id> URL)" }, { status: 400 });
    }

    // Accept /profiles/<steamid> URLs
    const m = id.match(/steamcommunity\.com\/profiles\/(\d{17})/i);
    if (m) id = m[1];

    // We don’t resolve vanity names here
    if (!/^\d{17}$/.test(id)) {
      return NextResponse.json(
        { error: "Provide a SteamID64 or a /profiles/<id> URL (not a vanity /id/<name> URL)" },
        { status: 400 }
      );
    }

    const url = `https://steamcommunity.com/inventory/${id}/730/2?l=english&count=5000`;

    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
        "Accept": "application/json,text/plain,*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://steamcommunity.com/",
      },
    });

    // 👇 Friendlier error handling (your requested block)
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      // Steam sometimes returns 400 + "null" for private/empty/not-exposed inventories.
      if (res.status === 400 && text.trim() === "null") {
        return NextResponse.json(
          {
            error:
              "Steam returned no inventory. Check that the SteamID64 is correct and the inventory is Public.",
            hint:
              "Use /profiles/<17-digit-id> or a 17-digit SteamID64. Vanity /id/<name> is not supported.",
            status: 400,
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "Steam inventory error", status: res.status, body: text?.slice(0, 200) ?? "" },
        { status: res.status }
      );
    }

    const data = await res.json();

    // Build description lookup
    const descMap = new Map<string, any>();
    for (const d of data.descriptions ?? []) {
      const icon =
        d.icon_url_large
          ? `https://community.cloudflare.steamstatic.com/economy/image/${d.icon_url_large}`
          : d.icon_url
          ? `https://community.cloudflare.steamstatic.com/economy/image/${d.icon_url}`
          : "";
      descMap.set(`${d.classid}_${d.instanceid ?? "0"}`, {
        market_hash_name: d.market_hash_name,
        name: d.name,
        tags: d.tags ?? [],
        icon,
      });
    }

    const items = (data.assets ?? []).map((a: any) => {
      const key = `${a.classid}_${a.instanceid ?? "0"}`;
      const meta = descMap.get(key) || {};
      const exterior =
        (meta.tags || []).find((t: any) => t.category === "Exterior")?.name ||
        (meta.market_hash_name || meta.name || "").match(
          /\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)/
        )?.[1] ||
        "";

      return {
        id: `${a.classid}_${a.instanceid}_${a.assetid}`,
        assetid: a.assetid,
        classid: a.classid,
        name: meta.market_hash_name || meta.name || "Unknown",
        exterior,
        icon: meta.icon || "",
      };
    });

    return NextResponse.json({ count: items.length, items }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
  }
}
