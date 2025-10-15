import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let id = (searchParams.get("id") || "").trim();

    if (!id) {
      return NextResponse.json({ error: "Missing 'id' (SteamID64 or /profiles/<id> URL)" }, { status: 400 });
    }
    const m = id.match(/steamcommunity\.com\/profiles\/(\d{17})/i);
    if (m) id = m[1];
    if (!/^\d{17}$/.test(id)) {
      return NextResponse.json(
        { error: "Provide a SteamID64 or a /profiles/<id> URL (not a vanity /id/<name> URL)" },
        { status: 400 }
      );
    }

    // --- Primary: new inventory endpoint ---
    const primaryUrl = `https://steamcommunity.com/inventory/${id}/730/2?l=english&count=5000`;
    const commonHeaders = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
      "Accept": "application/json,text/plain,*/*",
      "Accept-Language": "en-US,en;q=0.9",
      "Referer": "https://steamcommunity.com/",
    } as const;

    let res = await fetch(primaryUrl, { cache: "no-store", headers: commonHeaders });

    // Helper to map "new" format
    const mapNew = async () => {
      const data = await res.json();
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
      return items;
    };

    if (res.ok) {
      const items = await mapNew();
      return NextResponse.json({ count: items.length, items }, { status: 200 });
    }

    // If 400 + "null" -> try legacy endpoint
    const text = await res.text().catch(() => "");
    if (res.status === 400 && text.trim() === "null") {
      // --- Legacy: JSON endpoint ---
      const legacyUrl = `https://steamcommunity.com/profiles/${id}/inventory/json/730/2?l=english`;
      const resLegacy = await fetch(legacyUrl, { cache: "no-store", headers: commonHeaders });

      if (resLegacy.ok) {
        const data = await resLegacy.json();

        // Legacy "success" check
        if (data && data.success) {
          const inv: Record<string, any> = data.rgInventory || {};
          const desc: Record<string, any> = data.rgDescriptions || {};

          const items = Object.values(inv).map((asset: any) => {
            const key = `${asset.classid}_${asset.instanceid || "0"}`;
            const meta = desc[key] || {};
            const icon =
              meta.icon_url_large
                ? `https://community.cloudflare.steamstatic.com/economy/image/${meta.icon_url_large}`
                : meta.icon_url
                ? `https://community.cloudflare.steamstatic.com/economy/image/${meta.icon_url}`
                : "";
            const name = meta.market_hash_name || meta.name || "Unknown";
            const exterior =
              (meta.tags || []).find((t: any) => t.category === "Exterior")?.name ||
              (name || "").match(
                /\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)/
              )?.[1] ||
              "";
            return {
              id: `${asset.classid}_${asset.instanceid || "0"}_${asset.id}`,
              assetid: asset.id,
              classid: asset.classid,
              name,
              exterior,
              icon,
            };
          });

          return NextResponse.json({ count: items.length, items }, { status: 200 });
        }

        // Legacy returned but not success
        return NextResponse.json(
          {
            error:
              "Steam returned no inventory via legacy endpoint. Check that CS2 items exist and inventory is Public.",
            status: 400,
          },
          { status: 400 }
        );
      }

      // Legacy request failed entirely
      const legTxt = await resLegacy.text().catch(() => "");
      return NextResponse.json(
        {
          error: "Steam inventory error (legacy)",
          status: resLegacy.status,
          body: legTxt?.slice(0, 200) ?? "",
        },
        { status: resLegacy.status }
      );
    }

    // Other non-OK status from primary
    return NextResponse.json(
      { error: "Steam inventory error", status: res.status, body: text?.slice(0, 200) ?? "" },
      { status: res.status }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
  }
}
