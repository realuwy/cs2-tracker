// src/lib/steam-parse.ts
import type {
  SteamInventoryResponse,
  SteamDescription,
  ParsedInventory,
} from "@/types/steam";

const ECON_BASE = "https://steamcommunity-a.akamaihd.net/economy/image/";

function pickExterior(desc?: SteamDescription): string | undefined {
  if (!desc) return undefined;

  // Prefer tags
  const tag = desc.tags?.find((t) => t.category === "Exterior" || t.localized_category_name === "Exterior");
  if (tag?.localized_tag_name) return tag.localized_tag_name;

  // Fallback to descriptions array line like "Exterior: Field-Tested"
  const wearLine = desc.descriptions?.find(
    (d) => d.name === "exterior_wear" || /Exterior:/i.test(d.value || "")
  )?.value;
  if (wearLine) {
    const m = wearLine.match(/Exterior:\s*(.+)$/i);
    if (m) return m[1].trim();
  }
  return undefined;
}

export function parseSteamInventory(json: SteamInventoryResponse): ParsedInventory {
  const assets = json.assets ?? [];
  const descs = json.descriptions ?? [];
  const props = json.asset_properties ?? [];

  // Map description by classid_instanceid
  const descMap = new Map<string, SteamDescription>();
  for (const d of descs) {
    descMap.set(`${d.classid}_${d.instanceid}`, d);
  }

  // Map properties by assetid (float/pattern)
  const floatMap = new Map<string, { float?: string; pattern?: string }>();
  for (const p of props) {
    for (const ap of p.asset_properties) {
      const cur = floatMap.get(p.assetid) ?? {};
      if ("float_value" in ap && ap.name === "Wear Rating") {
        cur.float = String(ap.float_value);
      } else if ("int_value" in ap && ap.name === "Pattern Template") {
        cur.pattern = String(ap.int_value);
      }
      floatMap.set(p.assetid, cur);
    }
  }

  const items = assets.map((a) => {
    const d = descMap.get(`${a.classid}_${a.instanceid}`);
    const name = d?.market_hash_name || d?.market_name || d?.name || "Unknown";
    const exterior = pickExterior(d);
    const icon = d?.icon_url ? `${ECON_BASE}${d.icon_url}` : "";
    const mixins = floatMap.get(a.assetid) ?? {};

    return {
      name,
      market_hash_name: name,
      icon,
      exterior,                   // used to compute wear code
      quantity: Number(a.amount ?? 1),
      float: mixins.float,        // optional display fields
      pattern: mixins.pattern,    // optional display fields
      _assetid: a.assetid,
      _classid: a.classid,
      _instanceid: a.instanceid,
    };
  });

  return { items };
}
