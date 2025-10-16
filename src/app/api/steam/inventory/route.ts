import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/* ---------- Config / env ---------- */
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";
const COMMON_HEADERS = {
  "User-Agent": UA,
  "Accept": "application/json,text/plain,*/*",
  "Accept-Language": "en-US,en;q=0.9",
  "Referer": "https://steamcommunity.com/",
};

const WEB_API = "https://api.steampowered.com";
const KEY = process.env.STEAM_WEB_API_KEY || ""; // server-only
const PROXY = process.env.STEAM_PROXY_URL || ""; // Cloudflare Worker fallback
const CACHE_TTL_SEC = 300;

/* ---------- Types ---------- */
type Item = {
  id: string;
  assetid: string;
  classid: string;
  name: string;
  exterior: string;
  icon: string;
};

type ParsedSteamUrl =
  | { kind: "profiles"; id64: string }
  | { kind: "id"; vanity: string };

/* ---------- Handler ---------- */
export async function GET(req: Request) {
  const started = Date.now();
  const trace: any[] = [];
  try {
    const { searchParams } = new URL(req.url);
    const raw = (searchParams.get("id") || "").trim();
    const debug = searchParams.get("debug") === "1";

    if (!raw) {
      return out(400, "Paste a Steam profile URL: https://steamcommunity.com/id/<vanity>/ or https://steamcommunity.com/profiles/<steamid64>", trace, started, debug);
    }

    // Accept only the two canonical shapes
    const parsed = parseSteamUrl(raw);
    if (!parsed) {
      return out(400, "Only accepted: https://steamcommunity.com/id/<vanity>/ or https://steamcommunity.com/profiles/<steamid64>", trace, started, debug);
    }

    // Resolve to 17-digit SteamID64 (vanity -> via Web API)
    const id64 = await toSteamID64(parsed).catch((e) => {
      trace.push({ step: "resolveVanity", error: String(e) });
      return null;
    });
    if (!id64) {
      return out(400, "Couldn't resolve that profile. Check the URL or try again later.", trace, started, debug);
    }
    trace.push({ step: "resolved", id64 });

    // Tiny cache (if edge cache is available)
    const cacheKey = new Request(`${new URL(req.url).origin}/api/steam/inventory?id=${id64}`, { method: "GET" });
    // @ts-ignore
    if (typeof caches !== "undefined") {
      // @ts-ignore
      const hit = await caches.default.match(cacheKey).catch(() => null);
      if (hit) return hit;
    }

    /* 1) Prefer official Web API (users don't need keys — server-only) */
    if (KEY) {
      try {
        const apiUrl =
          `${WEB_API}/IEconService/GetInventoryItemsWithDescriptions/v1/` +
          `?key=${encodeURIComponent(KEY)}&steamid=${encodeURIComponent(id64)}` +
          `&appid=730&contextid=2&language=en&count=5000`;

        const r = await fetch(apiUrl, { cache: "no-store" });
        const t = await r.text().catch(() => "");
        const j = safeJson(t);

        trace.push({ step: "webapi", status: r.status, ok: r.ok, hasItems: !!j?.result?.items, hasDesc: !!j?.result?.descriptions });

        if (r.ok && j?.result?.items && j?.result?.descriptions) {
          const items = normalizeWebAPI(j.result.items, j.result.descriptions);
          return cacheAndSend(cacheKey, items, trace, started, debug);
        }
      } catch (e) {
        trace.push({ step: "webapi", error: String(e) });
      }
    } else {
      trace.push({ step: "webapi", skipped: "no KEY" });
    }

    /* 2) Fallback: Cloudflare Worker proxy (normalized community endpoints) */
    if (PROXY) {
      try {
        const pr = await fetch(`${PROXY}?id=${encodeURIComponent(id64)}`, { cache: "no-store" });
        const pt = await pr.text().catch(() => "");
        const pj = safeJson(pt);
        trace.push({ step: "worker", status: pr.status, ok: pr.ok, hasItems: Array.isArray(pj?.items) });
        if (pr.ok && pj && Array.isArray(pj.items)) {
          const items: Item[] = pj.items;
          return cacheAndSend(cacheKey, items, trace, started, debug);
        }
      } catch (e) {
        trace.push({ step: "worker", error: String(e) });
      }
    } else {
      trace.push({ step: "worker", skipped: "no PROXY" });
    }

    /* 3) Direct community fallbacks (as last resort) */

    // New inventory endpoint
    try {
      const primaryUrl = `https://steamcommunity.com/inventory/${id64}/730/2?l=english&count=5000`;
      const res = await fetch(primaryUrl, { cache: "no-store", headers: COMMON_HEADERS });
      trace.push({ step: "community-new", status: res.status, ok: res.ok });

      if (res.ok) {
        const items = await mapNew(await res.json());
        return cacheAndSend(cacheKey, items, trace, started, debug);
      }

      const text = await safeText(res);

      // Legacy endpoint
      try {
        const legacyUrl = `https://steamcommunity.com/profiles/${id64}/inventory/json/730/2?l=english`;
        const resLegacy = await fetch(legacyUrl, { cache: "no-store", headers: COMMON_HEADERS });
        trace.push({ step: "community-legacy", status: resLegacy.status, ok: resLegacy.ok });

        if (resLegacy.ok) {
          const data = await resLegacy.json().catch(() => null);
          if (data && data.success) {
            const items = mapLegacy(data);
            return cacheAndSend(cacheKey, items, trace, started, debug);
          }
        }

        // Alternate host
        try {
          const altUrl = `https://inventory.steampowered.com/730/2/${id64}?l=english&count=5000`;
          const resAlt = await fetch(altUrl, { cache: "no-store", headers: COMMON_HEADERS });
          trace.push({ step: "community-alt", status: resAlt.status, ok: resAlt.ok });

          if (resAlt.ok) {
            const items = await mapNew(await resAlt.json());
            return cacheAndSend(cacheKey, items, trace, started, debug);
          }

          const legacyTxt = await safeText(resLegacy);
          const altTxt = await safeText(resAlt);

          if (res.status === 400 && text.trim() === "null") {
            return out(400, "Steam returned no inventory for this account. Confirm Inventory is Public and CS2 items exist. Try again later.", trace, started, debug);
          }

          return NextResponse.json(
            {
              error: "Steam inventory error (all endpoints failed)",
              primary: { status: res.status, body: text.slice(0, 200) },
              legacy: { status: resLegacy.status, body: legacyTxt.slice(0, 200) },
              alternate: { status: resAlt.status, body: altTxt.slice(0, 200) },
              trace,
              tookMs: Date.now() - started,
            },
            { status: 502 }
          );
        } catch (e) {
          trace.push({ step: "community-alt", error: String(e) });
          return out(502, "Steam inventory error (alternate endpoint failed)", trace, started, debug);
        }
      } catch (e) {
        trace.push({ step: "community-legacy", error: String(e) });
        return out(502, "Steam inventory error (legacy endpoint failed)", trace, started, debug);
      }
    } catch (e) {
      trace.push({ step: "community-new", error: String(e) });
      return out(502, "Steam inventory error (network)", trace, started, debug);
    }
  } catch (e: any) {
    return out(500, e?.message || "Unexpected error", trace, started, true);
  }
}

/* ---------- helpers (top-level) ---------- */

function out(status: number, msg: string, trace: any[], started: number, debug: boolean) {
  const body = debug ? { error: msg, trace, tookMs: Date.now() - started } : { error: msg };
  return NextResponse.json(body, { status });
}

function bad(status: number, msg: string) {
  return NextResponse.json({ error: msg }, { status });
}

function safeText(r: Response): Promise<string> {
  return r.text().catch(() => "");
}

function safeJson(t: string) {
  try { return JSON.parse(t); } catch { return null; }
}

function cacheHeaders() {
  return { "cache-control": `public, max-age=${CACHE_TTL_SEC}` };
}

async function cacheAndSend(cacheKey: Request, items: Item[], trace?: any[], started?: number, debug?: boolean) {
  const res = NextResponse.json(
    debug ? { count: items.length, items, trace, tookMs: (started ? Date.now() - started : undefined) } : { count: items.length, items },
    { status: 200, headers: cacheHeaders() }
  );
  // @ts-ignore
  if (typeof caches !== "undefined") {
    try {
      // @ts-ignore
      await caches.default.put(cacheKey, res.clone());
    } catch { /* ignore cache put errors */ }
  }
  return res;
}

/** Accept only the two canonical shapes */
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

/** Vanity → SteamID64 (requires server key) */
async function toSteamID64(parsed: ParsedSteamUrl): Promise<string | null> {
  if (parsed.kind === "profiles") return parsed.id64;
  if (!KEY) return null; // cannot resolve without server key
  const url =
    `${WEB_API}/ISteamUser/ResolveVanityURL/v1/` +
    `?key=${encodeURIComponent(KEY)}&vanityurl=${encodeURIComponent(parsed.vanity)}&url_type=1`;
  try {
    const r = await fetch(url, { cache: "no-store" });
    const j = safeJson(await r.text().catch(() => ""));
    return (j?.response?.success === 1 && j?.response?.steamid) ? String(j.response.steamid) : null;
  } catch {
    return null;
  }
}

/** Map NEW format: { assets:[], descriptions:[] } */
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
      assetid: String(a.assetid),
      classid: String(a.classid),
      name,
      exterior,
      icon: meta.icon || "",
    };
  });
}

/** Map LEGACY format: { success, rgInventory, rgDescriptions } */
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
      assetid: String(asset.id),
      classid: String(asset.classid),
      name,
      exterior,
      icon,
    };
  });
}

/** Map WEB API format (items[] + descriptions[]) → Item[] */
function normalizeWebAPI(items: any[], descriptions: any[]): Item[] {
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

    return {
      id: String(it.assetid || it.id || ""),
      assetid: String(it.assetid || ""),
      classid: String(it.classid || ""),
      name,
      exterior: wearToExterior(wear, name),
      icon: icon ? `https://steamcommunity-a.akamaihd.net/economy/image/${icon}` : "",
    };
  });
}

/** Wear helpers */
function stripWear(n: string) {
  return n.replace(/\s*\((FN|MW|FT|WW|BS)\)\s*$/i, "").trim();
}
function extractWearFromName(n: string) {
  const m = n.match(/\((FN|MW|FT|WW|BS|Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)\s*$/i);
  if (!m) return "";
  const val = m[1].toUpperCase();
  if (val.startsWith("FACTORY")) return "FN";
  if (val.startsWith("MINIMAL")) return "MW";
  if (val.startsWith("FIELD")) return "FT";
  if (val.startsWith("WELL")) return "WW";
  if (val.startsWith("BATTLE")) return "BS";
  return val;
}
function wearToExterior(w: string, name: string) {
  if (w) {
    const map: Record<string, string> = {
      FN: "Factory New",
      MW: "Minimal Wear",
      FT: "Field-Tested",
      WW: "Well-Worn",
      BS: "Battle-Scarred",
    };
    return map[w] || stripWear(name);
  }
  return (name.match(/\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)/)?.[1] as string) || "";
}
