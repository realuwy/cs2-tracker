"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchInventory, fetchSkinportMap, InvItem } from "@/lib/api";

/* ---------- config ---------- */
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

/* ---------- types ---------- */
type Row = InvItem & {
  skinportAUD?: number;
  steamAUD?: number;
  priceAUD?: number; // alias of skinportAUD for existing code
  totalAUD?: number; // alias of skinport total (qty * skinport)
  float?: string;
  pattern?: string;
  source: "steam" | "manual";
};

/* ---------- sorting ---------- */
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

  /* prices once */
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
      name: market_hash_name,
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
    setRows(r => r.map((row, i) => i === idx ? { 
      ...row, 
      quantity: qty < 1 ? 1 : Math.floor(qty),
      totalAUD: typeof row.skinportAUD === "number" ? row.skinportAUD * (qty < 1 ? 1 : Math.floor(qty)) : row.totalAUD
    } : row));
  }

/* backfill Steam prices lazily */
useEffect(() => {
  const missing = rows
    .map((r, i) => ({ r, i }))
    .filter(({ r }) => r.steamAUD === undefined);
  if (missing.length === 0) return;

  (async () => {
    for (const { r, i } of missing) {
      try {
        const resp = await fetch(
          `/api/prices/steam?name=${encodeURIComponent(r.market_hash_name)}`
        );
        const data: { aud?: number | null } = await resp.json();
        const val = typeof data?.aud === "number" ? data.aud : undefined;
        setRows(prev =>
          prev.map((row, idx) => (idx === i ? { ...row, steamAUD: val } : row))
        );
      } catch {
        setRows(prev =>
          prev.map((row, idx) =>
            idx === i ? { ...row, steamAUD: undefined } : row
          )
        );
      }
    }
  })();
}, [rows]);


  /* sorting logic */
  const sorted = useMemo(() => {
    const copy = [...rows];
    const cmp = (a: any, b: any) => (a < b ? -1 : a > b ? 1 : 0);
    copy.sort((a, b) => {
      let va: any = "", vb: any = "";
      switch (sortKey) {
        case "item":     va = a.nameNoWear; vb = b.nameNoWear; break;
        case "wear":     va = wearLabel(a.wear); vb = wearLabel(b.wear); break;
        case "pattern":  va = a.pattern || ""; vb = b.pattern || ""; break;
        case "float":    va = Number(a.float ?? NaN); vb = Number(b.float ?? NaN); break;
        case "qty":      va = a.quantity ?? 1; vb = b.quantity ?? 1; break;
        case "skinport": va = a.skinportAUD ?? -Infinity; vb = b.skinportAUD ?? -Infinity; break;
        case "steam":    va = a.steamAUD ?? -Infinity; vb = b.steamAUD ?? -Infinity; break;
      }
      const c = cmp(va, vb);
      return sortDir === "asc" ? c : -c;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  /* totals */
  const totalItems = useMemo(() => sorted.reduce((acc, r) => acc + (r.quantity ?? 1), 0), [sorted]);
  const totalSkinport = useMemo(
    () => sorted.reduce((s, r) => s + ((r.skinportAUD ?? 0) * (r.quantity ?? 1)), 0),
    [sorted]
  );
  const totalSteam = useMemo(
    () => sorted.reduce((s, r) => s + ((r.steamAUD ?? 0) * (r.quantity ?? 1)), 0),
    [sorted]
  );

  function Th({
    label, keyId
  }: { label: string; keyId: SortKey }) {
    const active = sortKey === keyId;
    return (
      <th
        onClick={() => {
          if (active) setSortDir(d => (d === "asc" ? "desc" : "asc"));
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
            Total items: {totalItems}
          </div>
          <div className="rounded-full bg-zinc-800 px-3 py-1 text-sm text-zinc-200">
            Skinport: A${totalSkinport.toFixed(2)}
          </div>
          <div className="rounded-full bg-zinc-800 px-3 py-1 text-sm text-zinc-200">
            Steam: A${totalSteam.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Cards (unchanged UI for import/manual) */}
      {/* ... keep your existing cards here (we didn't change them in this diff) ... */}

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
              sorted.map((r, idx) => (
                <tr key={r.market_hash_name + idx} className="border-t border-zinc-800">
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
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="h-8 w-8 rounded border border-zinc-700"
                        onClick={() => updateQty(idx, (r.quantity ?? 1) - 1)}
                      >−</button>
                      <input
                        type="number"
                        min={1}
                        className="h-8 w-16 rounded border border-zinc-700 bg-zinc-900 text-center"
                        value={r.quantity ?? 1}
                        onChange={(e) => updateQty(idx, Math.max(1, Number(e.target.value) || 1))}
                      />
                      <button
                        className="h-8 w-8 rounded border border-zinc-700"
                        onClick={() => updateQty(idx, (r.quantity ?? 1) + 1)}
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
                      onClick={() => removeRow(rows.indexOf(r))}
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



