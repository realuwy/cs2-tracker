import { NextResponse } from "next/server";

type SteamAsset = {
  classid: string;
  instanceid: string;
  assetid: string;
  description?: SteamDescription;
};
type SteamDescription = {
  classid: string;
  instanceid: string;
  name: string;
  market_name?: string;
  market_hash_name?: string;
  icon_url?: string;
  icon_url_large?: string;
  actions?: { link: string; name: string }[];
};
type SteamChunk = {
  assets: SteamAsset[];
  descriptions: SteamDescription[];
  more_items?: boolean;
  last_assetid?: string;
};

const INVENTORY_URL = (id: string, start?: string) =>
  `https://steamcommunity.com/inventory/${id}/730/2?l=english&count=5000${start ? `&start_assetid=${encodeURIComponent(start)}` : ""}`;

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const steamId = searchParams.get("steamId") || process.env.NEXT_PUBLIC_DEFAULT_STEAM_ID64;
  if (!steamId) {
    return NextResponse.json({ error: "Missing steamId" }, { status: 400 });
  }

  try {
    // paginate inventory
    let start: string | undefined;
    const chunks: SteamChunk[] = [];
    for (let i = 0; i < 20; i++) {
      const url = INVENTORY_URL(steamId, start);
      const r = await fetch(url, { cache: "no-store", next: { revalidate: 0 } });
      if (!r.ok) break;
      const data = (await r.json()) as SteamChunk;
      if (!data?.assets?.length || !data?.descriptions?.length) break;
      chunks.push(data);
      if (data.more_items && data.last_assetid) start = data.last_assetid;
      else break;
      await new Promise((res) => setTimeout(res, 320));
    }

    // merge descriptions
    const descMap = new Map<string, SteamDescription>();
    const assets: SteamAsset[] = [];
    for (const ch of chunks) {
      for (const d of ch.descriptions) descMap.set(`${d.classid}_${d.instanceid}`, d);
      for (const a of ch.assets) assets.push({ ...a, description: descMap.get(`${a.classid}_${a.instanceid}`) });
    }

    // normalize & aggregate quantities
    const map = new Map<string, any>();
    for (const a of assets) {
      const d = a.description;
      if (!d) continue;
      const mhn = d.market_hash_name || d.market_name || d.name;
      const wear = parseWear(mhn);
      const nameNoWear = removeWear(d.name || mhn);
      const pattern = parsePattern(mhn);
      const image = toImage(d);
      const inspect = toInspect(d, a.assetid);
      const key = `${mhn}|${image}|${inspect}`;

      const prev = map.get(key) || {
        market_hash_name: mhn,
        name: d.name || mhn,
        nameNoWear,
        wear,
        pattern,
        image,
        inspectLink: inspect,
        quantity: 0,
      };
      prev.quantity += 1;
      map.set(key, prev);
    }

    const items = Array.from(map.values());
    return NextResponse.json({ steamId, count: items.length, items }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

function parseWear(name: string) {
  if (!name) return "";
  if (name.includes("(Factory New)")) return "FN";
  if (name.includes("(Minimal Wear)")) return "MW";
  if (name.includes("(Field-Tested)")) return "FT";
  if (name.includes("(Well-Worn)")) return "WW";
  if (name.includes("(Battle-Scarred)")) return "BS";
  return "";
}
function removeWear(name: string) {
  return name.replace(/\s*\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)\s*/g, "").trim();
}
function parsePattern(name: string) {
  const m = name.match(/Pattern\s*#?\s*(\d{1,4})/i);
  return m ? `#${m[1]}` : "";
}
function toImage(d: SteamDescription) {
  const p = d.icon_url_large || d.icon_url;
  return p ? `https://community.akamai.steamstatic.com/economy/image/${p}` : "";
}
function toInspect(d: SteamDescription, assetid: string) {
  const act = d.actions?.find((a) => a.link?.includes("%assetid%"));
  return act ? act.link.replace("%assetid%", assetid) : "";
}
