import { NextResponse } from "next/server";

/**
 * GET /api/steam/inventory?id=<steamid or profile url>
 * Uses Steam's public inventory endpoint:
 * https://steamcommunity.com/inventory/{steamid}/730/2?l=english&count=5000
 * No API key required for public inventories.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let id = (searchParams.get("id") || "").trim();

    if (!id) {
      return NextResponse.json({ error: "Missing 'id' (SteamID64 or profile URL)" }, { status: 400 });
    }

    // Accept full profile URLs and extract the 64-bit ID if present
    // Examples:
    // - https://steamcommunity.com/profiles/76561198000000000
    // - https://steamcommunity.com/id/customname  (not supported without resolving)
    const profilesMatch = id.match(/steamcommunity\.com\/profiles\/(\d{17})/i);
    if (profilesMatch) id = profilesMatch[1];

    // If it's not a 17-digit SteamID64, we can’t resolve vanity URLs server-side without WebAPI key.
    if (!/^\d{17}$/.test(id)) {
      return NextResponse.json(
        { error: "Please provide a SteamID64 or a /profiles/<id> URL (not a vanity /id/<name> URL)." },
        { status: 400 }
      );
    }

    const url = `https://steamcommunity.com/inventory/${id}/730/2?l=english&count=5000`;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 502 });
    }

    // Shape: { assets: [], descriptions: [], total_inventory_count, ... }
    const data = await res.json();

    // Build quick lookup for descriptions (icon, name, wear, etc.)
    const descMap = new Map<string, any>();
    for (const d of data.descriptions ?? []) {
      // Build icon URL (Steam CDN)
      const icon =
        d.icon_url_large
          ? `https://community.cloudflare.steamstatic.com/economy/image/${d.icon_url_large}`
          : d.icon_url
          ? `https://community.cloudflare.steamstatic.com/economy/image/${d.icon_url}`
          : "";

      descMap.set(`${d.classid}_${d.instanceid ?? "0"}`, {
        market_hash_name: d.market_hash_name,
        icon,
        tags: d.tags ?? [],
        actions: d.actions ?? [],
        name: d.name,
      });
    }

    // Normalize assets to a compact list
    const items = (data.assets ?? []).map((a: any) => {
      const key = `${a.classid}_${a.instanceid ?? "0"}`;
      const meta = descMap.get(key) || {};
      // Try to pull exterior (Factory New, etc.) from tags or name
      const exterior =
        (meta.tags || []).find((t: any) => t.category === "Exterior")?.name ||
        (meta.market_hash_name || "").match(/\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)/)?.[1] ||
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

    return NextResponse.json({ count: items.length, items });
  } catch (e) {
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

