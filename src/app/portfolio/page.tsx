"use client";
import { useEffect, useState } from "react";
import { fetchInventory, fetchSkinportMap, InvItem } from "@/lib/api";

type Row = InvItem & { skinportAUD?: number; priceAUD?: number; totalAUD?: number };

export default function PortfolioPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [steamId, setSteamId] = useState<string>("");

  async function load(id?: string) {
    setLoading(true);
    try {
      const inv = await fetchInventory(id);
      const sp = await fetchSkinportMap();
      const mapped: Row[] = inv.items.map((it) => {
        const spAUD = sp.map[it.market_hash_name];
        const priceAUD = typeof spAUD === "number" ? spAUD : undefined;
        const totalAUD = priceAUD ? priceAUD * (it.quantity ?? 1) : undefined;
        return { ...it, skinportAUD: spAUD, priceAUD, totalAUD };
      });
      setRows(mapped);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const def = process.env.NEXT_PUBLIC_DEFAULT_STEAM_ID64;
    if (def) load(def);
  }, []);

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="flex items-center gap-2">
        <input
          className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2"
          placeholder="Enter SteamID64 (public inventory)"
          value={steamId}
          onChange={(e) => setSteamId(e.target.value)}
        />
        <button
          onClick={() => load(steamId || undefined)}
          className="rounded-xl bg-white/10 px-4 py-2 hover:bg-white/20"
          disabled={loading}
        >
          {loading ? "Loading…" : "Import"}
        </button>
      </div>

      <div className="mt-6 text-sm text-zinc-400">
        Showing {rows.length} unique items {loading && "(updating…)"}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {rows.map((r) => (
          <div key={r.market_hash_name + r.inspectLink} className="rounded-2xl border border-zinc-800 p-4">
            {r.image && <img src={r.image} alt={r.name} className="mb-3 h-24 w-24 rounded-lg object-contain" />}
            <div className="font-medium">{r.nameNoWear}</div>
            <div className="text-xs text-zinc-400">{r.wear || "—"} {r.pattern}</div>
            <div className="mt-2 text-sm">
              {typeof r.priceAUD === "number" ? `Skinport: A$${r.priceAUD.toFixed(2)}` : "No price"}
            </div>
            <div className="text-xs text-zinc-500">Qty: {r.quantity}</div>
            {r.inspectLink && (
              <a href={r.inspectLink} className="mt-1 inline-block text-xs text-sky-400 hover:underline">
                Inspect
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
