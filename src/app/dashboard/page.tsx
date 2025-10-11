// src/app/dashboard/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchInventory, fetchSkinportMap, InvItem } from "@/lib/api";

/* ---------- local persistence ---------- */
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
  // If no wear (stickers, agents, cases…), key is just the name
  return full ? `${nameNoWear} (${full})` : nameNoWear;
};

/* ---------- sorting helpers (bidirectional, missing always last) ---------- */
const WEAR_TO_RANK: Record<string, number> = { FN: 0, MW: 1, FT: 2, WW: 3, BS: 4 };
const wearRank = (code?: string) => (code ? WEAR_TO_RANK[code] ?? 99 : 99);

const isMissingStr = (s?: string | null) => !s || s.trim() === "";
const cmpStr = (a?: string, b?: string, dir: 1 | -1) => {
  const am = isMissingStr(a);
  const bm = isMissingStr(b);
  if (am && bm) return 0;
  if (am) return 1;
  if (bm) return -1;
  return a!.toLocaleLowerCase().localeCompare(b!.toLocaleLowerCase()) * dir;
};

const isMissingNum = (v: unknown) => !Number.isFinite(Number(v));
const cmpStr = (a: string | undefined, b: string | undefined, dir: 1 | -1) => {
  const am = isMissingStr(a);
  const bm = isMissingStr(b);
  if (am && bm) return 0;
  if (am) return 1; // missing -> bottom
  if (bm) return -1;
  return (a ?? "").toLocaleLowerCase().localeCompare((b ?? "").toLocaleLowerCase()) * dir;
};

// Wear rank comparator; non-wear always bottom
const cmpWear = (a: string | undefined, b: string | undefined, dir: 1 | -1) => {
  const ra = wearRank(a);
  const rb = wearRank(b);
  const am = ra === 99, bm = rb === 99;
  if (am && bm) return 0;
  if (am) return 1;
  if (bm) return -1;
  return (ra === rb ? 0 : (ra < rb ? -1 : 1)) * dir;
};

/* ---------- row type ---------- */
type Row = InvItem & {
  skinportAUD?: number;
  steamAUD?: number;
  priceAUD?: number; // alias of skinportAUD for legacy display
  totalAUD?: number; // alias of skinport total (qty * skinport)
  float?: string;    // display only
  pattern?: string;  // display only
  source: "steam" | "manual";
};

/* ---------- sorting state ---------- */
type SortKey = "item" | "wear" | "pattern" | "float" | "qty" | "skinport" | "steam";
type SortDir = "asc" | "desc";

export default function DashboardPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [spMap, setSpMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  // sorting
  const [sortKey, setSortKey] = useState<SortKey>("item");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // import controls
  const [steamId, setSteamId] = useState("");

  // manual form
  const [mName, setMName] = useState("");
  const [mWear, setMWear] = useState<WearCode>("");
  const [mFloat, setMFloat] = useState("");
  const [mPattern, setMPattern] = useState("");
  const [mQty, setMQty] = useState(1);

  /* load saved rows (local) */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setRows(JSON.parse(raw));
    } catch {}
  }, []);

  /* save rows (local) */
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(rows)); } catch {}
  }, [rows]);

  /* load Skinport map once */
  useEffect(() => {
    fetchSkinportMap().then(res => setSpMap(res.map)).catch(() => {});
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
        const mhn = it.market_hash_name || toMarketHash(it.nameNoWear, it.wear as WearCode);
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
      // Replace steam rows but keep manual rows
      setRows(prev => [...prev.filter(r => r.source === "manual"), ...mapped]);
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
      name: market_hash_name, // show full with wear
      nameNoWear,
      wear: mWear,
      pattern: mPattern.trim(),
      float: mFloat.trim(),
      image: "",
      inspectLink: "",
      quantity: mQty,
      skinportAUD: spAUD,
      priceAUD,
      totalAUD: priceAUD ? priceAUD * mQty : undefined,
      source: "manual",
    };
    setRows(r => [newRow, ...r]);
    setMName(""); setMWear(""); setMFloat(""); setMPattern(""); setMQty(1);
  }

  function removeRow(idx: number) {
    setRows(r => r.filter((_, i) => i !== idx));
  }

  function updateQty(idx: number, qty: number) {
    const q = Math.max(1, Math.floor(qty || 1));
    setRows(r => r.map((row, i) =>
      i === idx
        ? {
            ...row,
            quantity: q,
            totalAUD: typeof row.skinportAUD === "number" ? row.skinportAUD * q : row.totalAUD,
          }
        : row
    ));
  }

  /* backfill Steam prices lazily (and cache 10 min via API) */
  useEffect(() => {
    const missing = rows
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => r.steamAUD === undefined);
    if (missing.length === 0) return;

    (async () => {
      for (const { r, i } of missing) {
        try {
          const resp = await fetch(`/api/prices/steam?name=${encodeURIComponent(r.market_hash_name)}`);
          const data: { aud?: number | null } = await resp.json();
          const val = typeof data?.aud === "number" ? data.aud : undefined;
          setRows(prev => prev.map((row, idx) => (idx === i ? { ...row, steamAUD: val } : row)));
        } catch {
          setRows(prev => prev.map((row, idx) => (idx === i ? { ...row, steamAUD: undefined } : row)));
        }
      }
    })();
  }, [rows]);

  /* sorting + totals */
  const [sorted, totals] = useMemo(() => {
    const copy = [...rows];
    const dir: 1 | -1 = sortDir === "asc" ? 1 : -1;

    copy.sort((a, b) => {
      switch (sortKey) {
        case "item":
          return cmpStr(a.nameNoWear, b.nameNoWear, dir);
        case "wear":
          return cmpWear(a.wear as string, b.wear as string, dir);
        case "pattern":
          return cmpNum(a.pattern, b.pattern, dir);
        case "float":
          return cmpNum(a.float, b.float, dir);
        case "qty":
          return cmpNum(a.quantity, b.quantity, dir);
        case "skinport":
          return cmpNum(a.skinportAUD, b.skinportAUD, dir);
        case "steam":
          return cmpNum(a.steamAUD, b.steamAUD, dir);
        default:
          return 0;
      }
    });

    const totalItems = copy.reduce((acc, r) => acc + (r.quantity ?? 1), 0);
    const totalSkinport = copy.reduce((s, r) => s + ((r.skinportAUD ?? 0) * (r.quantity ?? 1)), 0);
    const totalSteam = copy.reduce((s, r) => s + ((r.steamAUD ?? 0) * (r.quantity ?? 1)), 0);
    return [copy, { totalItems, totalSkinport, totalSteam }] as const;
  }, [rows, sortKey, sortDir]);

  /* sortable header cell (uses parent state via closure) */
  function Th({ label, keyId }: { label: string; keyId: SortKey }) {
    const active = sortKey === keyId;
    return (
      <th
        onClick={() => {
          if (active) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
          else { setSortKey(keyId); setSortDir("asc"); }
        }}
        className={`px-4 py-2 text-left select-none cursor-pointer ${active ? "text-white" : ""}`}
        title="Click to sort"
      >
        {label} {active ? (sortDir === "asc" ? "▲" : "▼") : ""}
      </th>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-zinc-800 px-3 py-1 text-sm text-zinc-200">
            Total items: {totals.totalItems}
          </div>
          <div className="rounded-full bg-zinc-800 px-3 py-1 text-sm text-zinc-200">
            Skinport: A${totals.totalSkinport.toFixed(2)}
          </div>
          <div className="rounded-full bg-zinc-800 px-3 py-1 text-sm text-zinc-200">
            Steam: A${totals.totalSteam.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Cards — IMPORT + MANUAL */}
      <div className="grid items-stretch grid-cols-1 gap-6 md:grid-cols-2">
        {/* Import from Steam */}
        <div className="flex h-full flex-col rounded-2xl border border-zinc-800 p-4">
          <div className="text-lg font-medium">Import from Steam</div>
          <p className="mb-3 mt-1 text-sm text-zinc-400">
            Paste your <span className="font-medium">SteamID64</span> or a{" "}
            <span className="font-mono">steamcommunity.com/profiles/&lt;id&gt;</span> URL (public inventory).
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

        {/* Add manual item */}
        <div className="flex h-full flex-col rounded-2xl border border-zinc-800 p-4">
          <div className="text-lg font-medium">Add manual item</div>

          <div className="mt-3 grid items-end grid-cols-1 gap-3 md:grid-cols-12">
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
                  <option key={w.code} value={w.code}>{w.label}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-[11px] leading-none text-zinc-400">Float (note only)</label>
              <input
                className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm placeholder:text-zinc-500"
                placeholder="0.1234"
                value={mFloat}
                onChange={(e) => setMFloat(e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-[11px] leading-none text-zinc-400">Pattern (note only)</label>
              <input
                className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm placeholder:text-zinc-500"
                placeholder="123"
                value={mPattern}
                onChange={(e) => setMPattern(e.target.value)}
              />
            </div>

            {/* Quantity counter */}
            <div className="md:col-span-12">
              <div className="flex items-center gap-3">
                <div className="w-40">
                  <label className="mb-1 block text-[11px] leading-none text-zinc-400">Quantity</label>
                  <div className="flex h-12 items-center gap-2">
                    <button
                      type="button"
                      className="h-12 w-12 rounded-xl border border-zinc-700 bg-zinc-900"
                      onClick={() => setMQty(q => Math.max(1, q - 1))}
                      aria-label="Decrease quantity"
                    >−</button>

                    <div className="flex h-12 min-w-[3rem] items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm">
                      {mQty}
                    </div>

                    <button
                      type="button"
                      className="h-12 w-12 rounded-xl border border-zinc-700 bg-zinc-900"
                      onClick={() => setMQty(q => q + 1)}
                      aria-label="Increase quantity"
                    >+</button>
                  </div>
                </div>

                <button
                  onClick={addManual}
                  className="h-12 grow rounded-xl bg-amber-600 px-4 text-black hover:bg-amber-500 disabled:opacity-60"
                  disabled={!mName.trim()}
                >
                  Add
                </button>
              </div>

              <p className="mt-2 text-xs text-zinc-400">
                Pricing uses only <span className="font-medium">Item name + Wear</span>. Float/Pattern are for display.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-800">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-900/60 text-zinc-300">
            <tr>
              <Th label="Item" keyId="item" />
              <Th label="Exterior" keyId="wear" />
              <Th label="Pattern" keyId="pattern" />
              <Th label="Float" keyId="float" />
              <Th label="Qty" keyId="qty" />
              <Th label="Skinport (AUD)" keyId="skinport" />
              <Th label="Steam (AUD)" keyId="steam" />
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-zinc-400">
                  No items yet. Use <span className="underline">Add manual item</span> or import from Steam.
                </td>
              </tr>
            ) : (
              sorted.map((r) => {
                // Important: compute original index so actions update the correct row after sorting
                const orig = rows.indexOf(r);
                return (
                  <tr key={r.market_hash_name + "|" + orig} className="border-t border-zinc-800">
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-3">
                        {r.image ? (
                          <img src={r.image} alt={r.name} className="h-10 w-10 rounded object-contain" />
                        ) : (
                          <div className="h-10 w-10 rounded bg-zinc-800" />
                        )}
                        <div className="leading-tight">
                          <div className="font-medium">{r.nameNoWear}</div>
                          <div className="text-xs text-zinc-500">{r.market_hash_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2">{wearLabel(r.wear as WearCode) || "—"}</td>
                    <td className="px-4 py-2">{r.pattern || "—"}</td>
                    <td className="px-4 py-2">{r.float || "—"}</td>

                    {/* Qty counter cell */}
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="h-8 w-8 rounded border border-zinc-700"
                          onClick={() => updateQty(orig, (r.quantity ?? 1) - 1)}
                          aria-label={`Decrease quantity for ${r.nameNoWear}`}
                        >−</button>

                        <div className="flex h-8 min-w-[2.5rem] items-center justify-center rounded border border-zinc-700 bg-zinc-900 text-sm">
                          {r.quantity ?? 1}
                        </div>

                        <button
                          className="h-8 w-8 rounded border border-zinc-700"
                          onClick={() => updateQty(orig, (r.quantity ?? 1) + 1)}
                          aria-label={`Increase quantity for ${r.nameNoWear}`}
                        >+</button>
                      </div>
                    </td>

                    <td className="px-4 py-2 text-right">
                      {typeof r.skinportAUD === "number" ? `A$${r.skinportAUD.toFixed(2)}` : "—"}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {typeof r.steamAUD === "number" ? `A$${r.steamAUD.toFixed(2)}` : "—"}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => removeRow(orig)}
                        className="rounded-lg border border-zinc-700 px-3 py-1 text-zinc-300 hover:bg-zinc-800"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

