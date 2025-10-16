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

const WEB_API = "https://api.steampowered.com";
const KEY = process.env.STEAM_WEB_API_KEY || "";       // server-only
const PROXY = process.env.STEAM_PROXY_URL || "";       // fallback Worker

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
    const raw = (searchParams.get("id") || "").trim();
    if (!raw) {
      return bad(400, "Paste a Steam profile URL: /id/<vanity>/ or /profiles/<steamid64>");
    }

    // 0) Accept ONLY the two shapes you asked for
    const parsed = parseSteamUrl(raw);
    if (!parsed) {
      return bad(400, "Only these are accepted: https://steamcommunity.com/id/<name>/ or https://steamcommunity.com/profiles/<steamid64>");
    }

    // 1) Resolve to SteamID64 (vanity -> resolve via Web API)
    const id64 = await toSteamID64(parsed);
    if (!id64) {
      return bad(400, "Couldn't resolve that profile. Check the URL or try again later.");
    }

    // 2) Prefer official Web API (server key; users don't need keys)
    if (KEY) {
      const apiUrl =
        `${WEB_API}/IEconService/GetInventoryItemsWithDescriptions/v1/` +
        `?key=${encodeURIComponent(KEY)}&steamid=${encodeURIComponent(id64)}` +
        `&appid=730&contextid=2&language=en&count=5000`;

      const r = await fetch(apiUrl, { cache: "no-store" });
      const t = await r.text().catch(() => "");
      const j = safeJson(t);

      if (r.ok && j?.result?.items && j?.result?.descriptions) {
        const items = normalizeWebAPI(j.result.items, j.result.descriptions);
        return NextResponse.json({ count: items.length, items }, { status: 200 });
      }
      // fall through if Web API didn’t return usable data
    }

    // 3) Fallback: your Cloudflare Worker (community endpoints, normalized)
    if (PROXY) {
      const pr = await fetch(`${PROXY}?id=${encodeURIComponent(id64)}`, { cache: "no-store" });
      const pt = await pr.text().catch(() => "");
      const pj = safeJson(pt);
      if (pr.ok && pj && Array.isArray(pj.items)) {
        return NextResponse.json({ count: Number(pj.count) || pj.items.length, items: pj.items }, { status: 200 });
      }
      // continue to your direct fallbacks if Worker also fails
    }

    // 4) Your original direct community fallbacks (kept intact)

    // --- New inventory endpoint ---
    const primaryUrl = `https://steamcommunity.com/inventory/${id64}/730/2?l=english&count=5000`;
    let res = await fetch(primaryUrl, { cache: "no-store", headers: COMMON_HEADERS });

    if (res.ok) {
      const items = await mapNew(await res.json());
      return NextResponse.json({ count: items.length, items }, { status: 200 });
    }

    let text = await safeText(res);
    // --- Legacy JSON endpoint ---
    const legacyUrl = `https://steamcommunity.com/profiles/${id64}/inventory/json/730/2?l=english`;
    const resLegacy = await fetch(legacyUrl, { cache: "no-store", headers: COMMON_HEADERS });

    if (resLegacy.ok) {
      const data = await resLegacy.json();
      if (data && data.success) {
        const items = mapLegacy(data);
        return NextResponse.json({ count: items.length, items }, { status: 200 });
      }
    }

    // --- Alternate host ---
    const altUrl = `https://inventory.steampowered.com/730/2/${id64}?l=english&count=5000`;
    const resAlt = await fetch(altUrl, { cache: "no-store", headers: COMMON_HEADERS });

    if (resAlt.ok) {
      const items = await mapNew(await resAlt.json());
      return NextResponse.json({ count: items.length, items }, { status: 200 });
    }

    const legacyTxt = await safeText(resLegacy);
    const altTxt = await safeText(resAlt);

    if (res.status === 400 && text.trim() === "null") {
      return bad(400, "Steam returned no inventory for this account. Confirm Inventory is Public and CS2 items exist. If it still fails, try again later.");
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
    return bad(500, e?.message || "Unexpected error");
  }
}

/* --------------------------- helpers --------------------------- */

function bad(status: number, msg: string) {
  return NextResponse.json({ error: msg }, { status });
}

function safeText(r: Response): Promise<string> {
  return r.text().catch(() => "");
}

function safeJson(t: string) {
  try { return JSON.parse(t); } catch { return null; }
}

type ParsedSteamUrl =
  | { kind: "profiles"; id64: string }
  | { kind: "id"; vanity: string };

function parseSteamUrl(input: string): ParsedSteamUrl | null {
  let u: URL;
  try { u = new URL(input); } catch { return null; }
  const host = u.hostname.replace(/^www\./, "").toLowerCase();
  if (host !== "steamcommunity.com") return null;

  // /profiles/<17>
  const m1 = u.pathname.match(/^\/profiles\/(\d{17})(?:\/|$)/i);
  if (m1) return { kind: "profiles", id64: m1[1] };

  // /id/<vanity>
  const m2 = u.pathname.match(/^\/id\/([^\/?#]+)(?:\/|$)/i);
  if (m2) return { kind: "id", vanity: decodeURIComponent(m2[1]) };

  return null;
}

async function toSteamID64(parsed: ParsedSteamUrl): Promise<string | null> {
  if (parsed.kind === "profiles") return parsed.id64;
  if (!KEY) return null; // cannot resolve vanity without server key
  const url =
    `${WEB_API}/ISteamUser/ResolveVanityURL/v1/` +
    `?key=${encodeURIComponent(KEY)}&vanityurl=${encodeURIComponent(parsed.vanity)}&url_type=1`;
  const r = await fetch(url, { cache: "no-store" });
  const j = safeJson(await r.text().catch(() => ""));
  if (j?.response?.success === 1 && j?.response?.steamid) return String(j.response.steamid);
  return null;
}

// Map "new" format
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

// Map legacy format
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
      function normalizeWebAPI(items: any[], descriptions: any[]) {
  const dmap = new Map<string, any>();
  for (const d of descriptions) {
    dmap.set(`${d.classid}_${d.instanceid || "0"}`, d);
  }

  return items.map((it: any) => {
    const key = `${it.classid}_${it.instanceid || "0"}`;
    const d = dmap.get(key) || {};
    const name = d?.market_hash_name || d?.market_name || d?.name || "Unknown";
    const icon = d?.icon_url || d?.icon_url_large || "";
    const wear = extractWearFromName(name);
    const inspect = findInspect(d);
    return {
      id: String(it.assetid || it.id || ""),
      assetid: String(it.assetid || ""),
      classid: String(it.classid || ""),
      name,
      market_hash_name: d?.market_hash_name || "",
      nameNoWear: stripWear(name),
      wear,
      icon: icon ? `https://steamcommunity-a.akamaihd.net/economy/image/${icon}` : "",
      inspectLink: inspect,
      tradable: !!d?.tradable,
      type: d?.type || "",
    };
  });
}

function stripWear(n: string) {
  return n.replace(/\s*\((FN|MW|FT|WW|BS)\)\s*$/i, "").trim();
}

function extractWearFromName(n: string) {
  const m = n.match(/\((FN|MW|FT|WW|BS)\)\s*$/i);
  return m ? m[1].toUpperCase() : "";
}

function findInspect(d: any) {
  const actions = Array.isArray(d?.actions) ? d.actions : [];
  const owner = Array.isArray(d?.owner_actions) ? d.owner_actions : [];
  const act = [...actions, ...owner].find((a: any) => /Inspect in Game/i.test(a?.name || ""));
  return act?.link || "";
}

    };
  });
}
