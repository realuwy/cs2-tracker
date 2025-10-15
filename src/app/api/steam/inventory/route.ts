import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";
const COMMON_HEADERS = {
  "User-Agent": UA,
  "Accept": "application/json,text/plain,*/*",
  "Accept-Language": "en-US,en;q=0.9",
  "Referer": "https://steamcommunity.com/",
};

type Item = {
  id: string;
  assetid: string;
  classid: string;
  name: string;
  exterior: string;
  icon: string;
};

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

    // --- 1) New inventory endpoint (steamcommunity.com/inventory) ---
    const primaryUrl = `https://steamcommunity.com/inventory/${id}/730/2?l=english&count=5000`;
    let res = await fetch(primaryUrl, { cache: "no-store", headers: COMMON_HEADERS });

    if (res.ok) {
      const items = await mapNew(await res.json());
      return NextResponse.json({ count: items.length, items }, { status: 200 });
    }

    let text = await safeText(res);
    if (res.status === 400 && text.trim() === "null") {
      // friendly null case continues to fallback below
    } else if (res.status !== 400) {
      // If not the "null" case, try fallbacks too but keep details for final error
    }

    // --- 2) Legacy JSON endpoint (steamcommunity.com/profiles/.../inventory/json) ---
    const legacyUrl = `https://steamcommunity.com/profiles/${id}/inventory/json/730/2?l=english`;
    const resLegacy = await fetch(legacyUrl, { cache: "no-store", headers: COMMON_HEADERS });

    if (resLegacy.ok) {
      const data = await resLegacy.json();
      if (data && data.success) {
        const items = mapLegacy(data);
        return NextResponse.json({ count: items.length, items }, { status: 200 });
      }
    }

    // --- 3) Alternative host (inventory.steampowered.com) ---
    // This often works when the other two do not.
    // Example: https://inventory.steampowered.com/730/2/{steamid}?l=english&count=5000
    const altUrl = `https://inventory.steampowered.com/730/2/${id}?l=english&count=5000`;
    const resAlt = await fetch(altUrl, { cache: "no-store", headers: COMMON_HEADERS });

    if (resAlt.ok) {
      const items = await mapNew(await resAlt.json()); // same shape as "new"
      return NextResponse.json({ count: items.length, items }, { status: 200 });
    }

    // If all 3 failed, return the friendliest message we can.
    const legacyTxt = await safeText(resLegacy);
    const altTxt = await safeText(resAlt);

    // Special case for null body
    if (res.status === 400 && text.trim() === "null") {
      return NextResponse.json(
        {
          error:
            "Steam returned no inventory for this account. Confirm the SteamID64 is correct, Inventory is Public, and CS2 items exist.",
          hint:
            "If everything looks correct, Steam may be blocking this request from the host. Try again later or import using another network.",
          status: 400,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Steam inventory error (all endpoints failed)",
        primary: { status: res.status, body: text.slice(0, 200) },
        legacy: { status: resLegacy.status, body: legacyTxt.slice(0, 200) },
        alternate: { status: resAlt.status, body: altTxt.slice(0, 200) },
      },
      { status: 502 }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
  }
}

/* --------------------------- helpers --------------------------- */

function safeText(r: Response): Promise<string> {
  return r.text().catch(() => "");
}

// Map "new" format: { assets: [], descriptions: [] }
function mapNew(data: any): Item[] {
  const descMap = new Map<string, any>();
  for (const d of data?.descriptions ?? []) {
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
  return (data?.assets ?? []).map((a: any) => {
    const key = `${a.classid}_${a.instanceid ?? "0"}`;
    const meta = descMap.get(key) || {};
    const name = meta.market_hash_name || meta.name || "Unknown";
    const exterior =
      (meta.tags || []).find((t: any) => t.category === "Exterior")?.name ||
      (name || "").match(/\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)/)?.[1] ||
      "";
    return {
      id: `${a.classid}_${a.instanceid ?? "0"}_${a.assetid}`,
      assetid: a.assetid,
      classid: a.classid,
      name,
      exterior,
      icon: meta.icon || "",
    };
  });
}

// Map legacy format: { success, rgInventory, rgDescriptions }
function mapLegacy(data: any): Item[] {
  const inv: Record<string, any> = data.rgInventory || {};
  const desc: Record<string, any> = data.rgDescriptions || {};
  return Object.values(inv).map((asset: any) => {
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
      (name || "").match(/\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)/)?.[1] ||
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
}
