export async function fetchInventory(steamId?: string) {
  const url = `/api/inventory${steamId ? `?steamId=${encodeURIComponent(steamId)}` : ""}`;
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error("Inventory fetch failed");
  return r.json() as Promise<{ steamId: string; count: number; items: InvItem[] }>;
}
export type InvItem = {
  market_hash_name: string;
  name: string;
  nameNoWear: string;
  wear: "" | "FN" | "MW" | "FT" | "WW" | "BS";
  pattern: string;
  image: string;
  inspectLink: string;
  quantity: number;
};

export async function fetchSkinportMap() {
  const r = await fetch("/api/prices/skinport");
  if (!r.ok) throw new Error("Skinport fetch failed");
  return r.json() as Promise<{ currency: string; map: Record<string, number> }>;
}
