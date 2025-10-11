"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchInventory, fetchSkinportMap, InvItem } from "@/lib/api";

/* ---------- lightweight persistence ---------- */
const STORAGE_KEY = "cs2:dashboard:rows";

/* ---------- wear options & helpers ---------- */
const WEAR_OPTIONS = [
  { code: "", label: "(none)" },
  { code: "FN", label: "Factory New" },
  { code: "MW", label: "Minimal Wear" },
  { code: "FT", label: "Field-Tested" },
  { code: "WW", label: "Well-Worn" },
  { code: "BS", label: "Battle-Scarred" },
] as const;
type WearCode = typeof WEAR_OPTIONS[number]["code"];
const wearLabel = (code?: string) =>
  WEAR_OPTIONS.find((w) => w.code === code)?.label ?? "";
const toMarketHash = (nameNoWear: string, wear?: WearCode) => {
  const full = wearLabel(wear);
  return full ? `${nameNoWear} (${full})` : nameNoWear;
};

/* ---------- row type ---------- */
type Row = InvItem & {
  skinportAUD?: number;
  priceAUD?: number;
  totalAUD?: number;
  float?: string; // display only
  pattern?: string; // display only
  source: "steam" | "manual";
};

export default function DashboardPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [spMap, setSpMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  // import controls
  const [steamId, setSteamId] = useState("");

  // manual form
  const [mName, setMName] = useState("");
  const [mWear, setMWear] = useState<WearCode>("");
  const [mFloat, setMFloat] = useState("");
  const [mPattern, setMPattern] = useState("");

  /* load saved rows (local) */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setRows(JSON.parse(raw));
    } catch {}
  }, []);

  /* save rows on change (local) */
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    } catch {}
  }, [rows]);

  /* prices once */
  useEffect(() => {
    fetchSkinportMap()
      .then((res) => setSpMap(res.map))
      .catch(() => {});
  }, []);

  /* optional: auto-load default steam id */
  useEffect(() => {
    const def = process.env.NEXT_PUBLIC_DEFAULT_STEAM_ID64;
    if (def) void load(def);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load(id?: string) {
    setLoading(true);
    try {
      const inv = await fetchInventory(id);
      const mapped: Row[] = inv.items.map((it) => {
        const mhn =
          it.market_hash_name || toMarketHash(it.nameNoWear, it.wear as WearCode);
        const spAUD = spMap[mhn];
        const qty = it.quantity ?? 1;
        const priceAUD = typeof spAUD === "number" ? spAUD : undefined;
        return {
          ...it,
          market_hash_name: mhn,
          skinportAUD: spAUD,
          priceAUD,
          totalAUD: priceAUD ? priceAUD * qty : undefined,
          source: "steam",
        };
      });
      setRows((prev) => [...prev.filter((r) => r.source === "manual"), ...mapped]);
    } finally {
      setLoading(false);
    }
  }

  function addManual() {
    if (!mName.trim()) return;
    const nameNoWear = mName.trim();
    const market_hash_name = toMarketHash(nameNoWear, mWear);
    const spAUD = spMap[market_hash_name];
    const priceAUD = typeof spAUD === "number" ? spAUD : undefined;

    const newRow: Row = {
      market_hash_name,
      name: market_hash_name, // show full with wear under hash
      nameNoWear,
      wear: mWear,
      pattern: mPattern.trim(),
      float: mFloat.trim(),
      image: "",
      inspectLink: "",
      quantity: 1,
      skinportAUD: spAUD,
      priceAUD,
      totalAUD: priceAUD ?? undefined,
      source: "manual",
    };
    setRows((r) => [newRow, ...r]);

    setMName("");
    setMWear("");
    setMFloat("");
    setMPattern("");
  }

  function removeRow(idx: number) {
    setRows((r) => r.filter((_, i) => i !== idx));
  }

  const totalItems = useMemo(() => {
    return rows.reduce((acc, r) => acc + (r.quantity ?? 1), 0);
  }, [rows]);

  return (
    <div className="mx-auto max-w-6xl p-6">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="rounded-full bg-zinc-800 px-3 py-1 text-sm text-zinc-200">
          Total items: {totalItems}
        </div>
      </div>

      {/* Cards */}
      <div className="grid items-stretch grid-cols-1 gap-6 md:grid-cols-2">
        {/* Import card */}
        <div className="flex h-full flex-col rounded-2xl border border-zinc-800 p-4">
          <div className="text-lg font-medium">Import from Steam</div>
          <p className="mb-3 mt-1 text-sm text-zinc-400">
            Paste your <span className="font-medium">SteamID64</span> or a{" "}
            <span className="font-mono">steamcommunity.com/profiles/&lt;id&gt;</span>{" "}
            URL (public inventory).
          </p>
          <div className="mt-auto flex gap-2">
            <input
              className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4"
              placeholder="76561198XXXXXXXXXX or /profiles/<id>"
              value={steamId}
              onChange={(e) => setSteamId(e.target.value)}
            />
            <button
              onClick={() => load(steamId || undefined)}
              className="h-12 shrink-0 rounded-xl bg-amber-600 px-5 text-black hover:bg-amber-500 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Importing…" : "Import"}
            </button>
          </div>
        </div>

        {/* Manual card */}
        <div className="flex h-full flex-col rounded-2xl border border-zinc-800 p-4">
          <div className="text-lg font-medium">Add manual item</div>

          {/* baseline-aligned controls */}
          <div className="mt-3 grid items-end grid-cols-1 gap-3 md:grid-cols-12">
            {/* Name */}
            <div className="md:col-span-5">
              <label className="mb-1 block text-[11px] leading-none text-zinc-400">
                Item name (paste WITHOUT wear)
              </label>
              <input
                className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm placeholder:text-zinc-500"
                placeholder="AK-47 | Redline"
                value={mName}
                onChange={(e) => setMName(e.target.value)}
              />
            </div>

            {/* Wear */}
            <div className="md:col-span-3">
              <label className="mb-1 block text-[11px] leading-none text-zinc-400">
                Wear (used for pricing)
              </label>
              <select
                className="h-12 w-full appearance-none rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm"
                value={mWear}
                onChange={(e) => setMWear(e.target.value as WearCode)}
              >
                {WEAR_OPTIONS.map((w) => (
                  <option key={w.code} value={w.code}>
                    {w.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Float */}
            <div className="md:col-span-2">
              <label className="mb-1 block text-[11px] leading-none text-zinc-400">
                Float (note only)
              </label>
              <input
                className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm placeholder:text-zinc-500"
                placeholder="0.1234"
                value={mFloat}
                onChange={(e) => setMFloat(e.target.value)}
              />
            </div>

            {/* Pattern */}
            <div className="md:col-span-2">
              <label className="mb-1 block text-[11px] leading-none text-zinc-400">
                Pattern (note only)
              </label>
              <input
                className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm placeholder:text-zinc-500"
                placeholder="123"
                value={mPattern}
                onChange={(e) => setMPattern(e.target.value)}
              />
            </div>

            {/* Add */}
            <div className="md:col-span-12">
              <button
                onClick={addManual}
                className="h-12 w-full rounded-xl bg-amber-600 px-4 text-black hover:bg-amber-500 disabled:opacity-60"
                disabled={!mName.trim()}
              >
                Add
              </button>
              <p className="mt-2 text-xs text-zinc-400">
                Pricing uses only <span className="font-medium">Item name + Wear</span>. Float/Pattern are for display.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-800">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-900/60 text-zinc-300">
            <tr>
              <th className="px-4 py-2 text-left">Item</th>
              <th className="px-4 py-2 text-left">Exterior</th>
              <th className="px-4 py-2 text-left">Pattern</th>
              <th className="px-4 py-2 text-left">Float</th>
              <th className="px-4 py-2 text-right">Qty</th>
              <th className="px-4 py-2 text-right">Skinport (AUD)</th>
              <th className="px-4 py-2 text-right">Total (AUD)</th>
              <th className="px-4 py-2 text-left">Source</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-zinc-400">
                  No items yet. Use <span className="underline">Add manual item</span> or import from Steam.
                </td>
              </tr>
            ) : (
              rows.map((r, idx) => (
                <tr key={r.market_hash_name + idx} className="border-t border-zinc-800">
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-3">
                      {r.image ? (
                        <img
                          src={r.image}
                          alt={r.name}
                          className="h-10 w-10 rounded object-contain"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded bg-zinc-800" />
                      )}
                      <div className="leading-tight">
                        <div className="font-medium">{r.nameNoWear}</div>
                        <div className="text-xs text-zinc-500">
                          {r.market_hash_name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2">{wearLabel(r.wear as WearCode) || "—"}</td>
                  <td className="px-4 py-2">{r.pattern || "—"}</td>
                  <td className="px-4 py-2">{r.float || "—"}</td>
                  <td className="px-4 py-2 text-right">{r.quantity ?? 1}</td>
                  <td className="px-4 py-2 text-right">
                    {typeof r.priceAUD === "number"
                      ? `A$${r.priceAUD.toFixed(2)}`
                      : "—"}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {typeof r.totalAUD === "number"
                      ? `A$${r.totalAUD.toFixed(2)}`
                      : "—"}
                  </td>
                  <td className="px-4 py-2">{r.source}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => removeRow(idx)}
                      className="rounded-lg border border-zinc-700 px-3 py-1 text-zinc-300 hover:bg-zinc-800"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


