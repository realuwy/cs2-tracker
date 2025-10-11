"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { fetchInventory, InvItem } from "@/lib/api";

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
type WearCode = (typeof WEAR_OPTIONS)[number]["code"];

const wearLabel = (code?: string) =>
  WEAR_OPTIONS.find((w) => w.code === code)?.label ?? "";

/** Remove trailing " (none)" if present */
const stripNone = (s: string) => s.replace(/\s+\(none\)$/i, "");

/**
 * Append a wear label only for actual wear variants (FN/MW/FT/WW/BS).
 * Never append "(none)" to non-wear items.
 */
const toMarketHash = (nameNoWear: string, wear?: WearCode) => {
  if (!wear) return nameNoWear;
  if (!["FN", "MW", "FT", "WW", "BS"].includes(wear)) return nameNoWear;
  const full = wearLabel(wear);
  return full ? `${nameNoWear} (${full})` : nameNoWear;
};

/** Parse pasted names like "AK-47 | Redline (Factory New)" to extract wear */
const LABEL_TO_CODE: Record<string, WearCode> = {
  "factory new": "FN",
  "minimal wear": "MW",
  "field-tested": "FT",
  "well-worn": "WW",
  "battle-scarred": "BS",
};
function parseNameForWear(raw: string): { nameNoWear: string; wear?: WearCode } {
  const trimmed = raw.trim();
  const noNone = stripNone(trimmed);
  const m = noNone.match(
    /\s+\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)\s*$/i
  );
  if (!m) return { nameNoWear: noNone };
  const code = LABEL_TO_CODE[m[1].toLowerCase()] as WearCode | undefined;
  return { nameNoWear: noNone.replace(m[0], ""), wear: code };
}

/** Detect items that do not support wear */
function isNonWearCategory(nameNoWear: string): boolean {
  const s = nameNoWear.trim().toLowerCase();
  return /^(sticker|patch|graffiti|music kit|agent|case|capsule|souvenir|storage unit|gift|key|collectible|pin|autograph)/i.test(
    s
  );
}

/* ---------- sorting helpers (missing always last) ---------- */
const WEAR_TO_RANK: Record<string, number> = { FN: 0, MW: 1, FT: 2, WW: 3, BS: 4 };
const wearRank = (code?: string) => (code ? WEAR_TO_RANK[code] ?? 99 : 99);

const isMissingStr = (s?: string | null) => !s || s.trim() === "";
const cmpStr = (a: string | undefined, b: string | undefined, dir: 1 | -1) => {
  const am = isMissingStr(a);
  const bm = isMissingStr(b);
  if (am && bm) return 0;
  if (am) return 1; // missing -> bottom
  if (bm) return -1;
  return (a ?? "").toLocaleLowerCase().localeCompare((b ?? "").toLocaleLowerCase()) * dir;
};

const isMissingNum = (v: unknown) =>
  v === undefined ||
  v === null ||
  (typeof v === "string" && v.trim() === "") ||
  !Number.isFinite(Number(v));

const cmpNum = (a: unknown, b: unknown, dir: 1 | -1) => {
  const am = isMissingNum(a);
  const bm = isMissingNum(b);
  if (am && bm) return 0;
  if (am) return 1;
  if (bm) return -1;
  const na = Number(a);
  const nb = Number(b);
  return na === nb ? 0 : (na < nb ? -1 : 1) * dir;
};

const cmpWear = (a: string | undefined, b: string | undefined, dir: 1 | -1) => {
  const ra = wearRank(a);
  const rb = wearRank(b);
  const am = ra === 99,
    bm = rb === 99;
  if (am && bm) return 0;
  if (am) return 1;
  if (bm) return -1;
  return (ra === rb ? 0 : ra < rb ? -1 : 1) * dir;
};

/* ---------- row type ---------- */
type Row = Omit<InvItem, "pattern" | "float"> & {
  pattern?: string;
  float?: string;
  skinportAUD?: number;
  steamAUD?: number;
  priceAUD?: number; // unit (skinport)
  totalAUD?: number; // unit * qty (skinport)
  source: "steam" | "manual";
  // optional % chips (future)
  skinportH1?: number;
  skinportD1?: number;
  skinportM1?: number;
  steamH1?: number;
  steamD1?: number;
  steamM1?: number;
  steamFetchedAt?: number; // ms
};

/* ---------- sorting state ---------- */
type SortKey = "item" | "wear" | "pattern" | "float" | "qty" | "skinport" | "steam";
type SortDir = "asc" | "desc";
type SortState = { key: SortKey; dir: SortDir };
type SortAction = { type: "toggle"; key: SortKey };
function sortReducer(state: SortState, action: SortAction): SortState {
  if (state.key === action.key) {
    return { key: state.key, dir: state.dir === "asc" ? "desc" : "asc" };
  }
  return { key: action.key, dir: "asc" };
}

/* ---------- image helpers (from earlier step) ---------- */
const NONE_SUFFIX_RE = /\s+\(none\)$/i;

// small inline SVG fallback (dark rounded square)
const FALLBACK_DATA_URL =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
      <rect x="0" y="0" width="40" height="40" rx="6" ry="6" fill="#3f3f46"/>
    </svg>`
  );

/** Find an image by trying multiple key variants */
function findImage(
  images: Record<string, string>,
  row: { market_hash_name: string; nameNoWear: string; wear?: string }
): string | undefined {
  const exact = images[row.market_hash_name];
  if (exact) return exact;

  const noNone = images[row.market_hash_name.replace(NONE_SUFFIX_RE, "")];
  if (noNone) return noNone;

  const plain = images[row.nameNoWear];
  if (plain) return plain;

  const lbl = wearLabel(row.wear as WearCode);
  if (lbl) {
    const withWear = `${row.nameNoWear} (${lbl})`;
    if (images[withWear]) return images[withWear];
  }
  return undefined;
}

/* ---------- STEAM sanity guard ---------- */
// Steam must be within a sane band relative to Skinport (when available)
function sanitizeSteam(aud: number | undefined, skinport?: number): number | undefined {
  if (aud === undefined || !isFinite(aud) || aud <= 0) return undefined;

  // hard cap for obvious nonsense
  if (aud > 20000) return undefined;

  if (typeof skinport === "number" && skinport > 0) {
    // accept only if Steam is within [0.5x .. 3x] of Skinport
    const lo = skinport * 0.5;
    const hi = skinport * 3;
    if (aud < lo || aud > hi) return undefined;

    // extra guard for cheap items
    if (skinport < 50 && aud > 100) return undefined;
  }

  return aud;
}

/* ---------- component ---------- */
export default function DashboardPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [spMap, setSpMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [sort, dispatchSort] = useReducer(sortReducer, { key: "item", dir: "asc" });

  // import controls
  const [steamId, setSteamId] = useState("");

  // manual form
  const [mName, setMName] = useState("");
  const [mWear, setMWear] = useState<WearCode>("");
  const [mFloat, setMFloat] = useState("");
  const [mPattern, setMPattern] = useState("");
  const [mQty, setMQty] = useState(1);

  // back-to-top visibility
  const [showBackToTop, setShowBackToTop] = useState(false);

  // refresh timestamps
  const [skinportUpdatedAt, setSkinportUpdatedAt] = useState<number | null>(null);
  const [steamUpdatedAt, setSteamUpdatedAt] = useState<number | null>(null);

  /* load saved rows (local) + normalize legacy blanks */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Row[];
        const normalized = parsed.map((r) => ({
          ...r,
          market_hash_name: r.market_hash_name ? stripNone(r.market_hash_name) : r.market_hash_name,
          name: r.name ? stripNone(r.name) : r.name,
          nameNoWear: r.nameNoWear ? stripNone(r.nameNoWear) : r.nameNoWear,
          pattern: r.pattern && String(r.pattern).trim() !== "" ? r.pattern : undefined,
          float: r.float && String(r.float).trim() !== "" ? r.float : undefined,
          skinportAUD: isMissingNum(r.skinportAUD) ? undefined : Number(r.skinportAUD),
          steamAUD: isMissingNum(r.steamAUD) ? undefined : Number(r.steamAUD),
          quantity: Math.max(1, Number(r.quantity ?? 1)),
        }));
        setRows(normalized);
        return;
      }
    } catch {}
  }, []);

  // Lazily resolve images for rows that still have no thumbnail (Skinport → Steam fallback)
useEffect(() => {
  let cancelled = false;

  (async () => {
    // pick a small batch without images
    const batch: Array<{ name: string; idx: number }> = [];
    for (let i = 0; i < rows.length && batch.length < 6; i++) {
      const r = rows[i];
      if (!r.image || r.image.trim() === "") {
        batch.push({ name: r.market_hash_name, idx: i });
      }
    }
    if (batch.length === 0) return;

    for (const { name, idx } of batch) {
      try {
        const resp = await fetch(`/api/images/by-name?name=${encodeURIComponent(name)}`);
        const data: { url: string | null } = await resp.json();
        if (cancelled) return;

        // Only set when we definitely have a string
        if (typeof data.url === "string" && data.url.length > 0) {
          const url = data.url; // now narrowed to string
          setRows(prev =>
            prev.map((row, i) => (i === idx ? { ...row, image: url } : row))
          );
        }
      } catch {
        // ignore and move on
      }
    }
  })();

  return () => {
    cancelled = true;
  };
}, [rows]);



  /* debounced save rows (local) */
  const saveTimer = useRef<number | null>(null);
  useEffect(() => {
    try {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
      }, 150);
    } catch {}
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [rows]);

  /* load/refresh Skinport map via server route (also hydrate images) */
 async function refreshSkinport() {
  try {
    // Fetch prices + images in parallel
    const [priceRes, imgRes] = await Promise.all([
      fetch("/api/prices/skinport-map", { cache: "no-store" }),
      fetch("/api/skinport/images", { cache: "force-cache" }), // images OK to cache longer
    ]);

    const priceData: {
      map: Record<string, number>;
      images?: Record<string, string>; // keep supporting old route shape if it exists
      updatedAt?: number;
    } = await priceRes.json();

    const extraImgData: { images?: Record<string, string> } = await imgRes.json();

    const map = priceData.map || {};
    // merge any images the price route might already provide with the dedicated feed
    const images: Record<string, string> = {
      ...(priceData.images || {}),
      ...(extraImgData.images || {}),
    };

    setSkinportUpdatedAt(priceData.updatedAt ?? Date.now());
    setSpMap(map);

    // Helper: try multiple keys to locate an image
    const NONE_SUFFIX_RE = /\s+\(none\)$/i;
    const findImage = (
      mhn: string,
      nameNoWear: string,
      wear?: string
    ): string | undefined => {
      // 1) exact market_hash_name
      if (images[mhn]) return images[mhn];

      // 2) without trailing (none)
      const noNone = mhn.replace(NONE_SUFFIX_RE, "");
      if (images[noNone]) return images[noNone];

      // 3) plain nameNoWear
      if (images[nameNoWear]) return images[nameNoWear];

      // 4) nameNoWear + wear label (for weapons)
      const WEAR_LABELS: Record<string, string> = {
        FN: "Factory New",
        MW: "Minimal Wear",
        FT: "Field-Tested",
        WW: "Well-Worn",
        BS: "Battle-Scarred",
      };
      if (wear && WEAR_LABELS[wear]) {
        const withWear = `${nameNoWear} (${WEAR_LABELS[wear]})`;
        if (images[withWear]) return images[withWear];
      }
      return undefined;
    };

    // Apply prices and hydrate missing thumbnails. Also re-sanitize Steam with the fresh Skinport.
    setRows(prev =>
      prev.map(row => {
        const sp =
          map[row.market_hash_name] ??
          map[row.market_hash_name.replace(NONE_SUFFIX_RE, "")] ??
          map[row.nameNoWear];

        const priceAUD = typeof sp === "number" ? sp : undefined;
        const qty = row.quantity ?? 1;

        // Only set image if it's currently missing/blank
        const img =
          row.image && row.image.trim() !== ""
            ? row.image
            : findImage(row.market_hash_name, row.nameNoWear, row.wear as string | undefined);

        const saneSteam = sanitizeSteam(row.steamAUD, sp);

        return {
          ...row,
          skinportAUD: sp,
          priceAUD,
          totalAUD: priceAUD ? priceAUD * qty : undefined,
          image: img ?? row.image, // keep prior if still not found
          steamAUD: saneSteam,
        };
      })
    );
  } catch {
    // keep last-good values
  }
}


  useEffect(() => {
    refreshSkinport(); // initial load
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      refreshSkinport();
    }, 5 * 60 * 1000); // every 5 min
    return () => window.clearInterval(id);
  }, []);

  /* optional: auto-load default steam id */
  useEffect(() => {
    const def = process.env.NEXT_PUBLIC_DEFAULT_STEAM_ID64;
    if (def) void load(def);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* show back-to-top after scrolling */
  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
  };

  async function load(id?: string) {
    if (!id) return;
    setLoading(true);
    try {
      const inv = await fetchInventory(id);
      const mapped: Row[] = inv.items.map((it) => {
        const mhnRaw = it.market_hash_name || toMarketHash(it.nameNoWear, it.wear as WearCode);
        const mhn = stripNone(mhnRaw);
        const spAUD = spMap[mhn] ?? spMap[stripNone(mhn)];
        const qty = it.quantity ?? 1;
        const priceAUD = typeof spAUD === "number" ? spAUD : undefined;
        return {
          ...it,
          market_hash_name: mhn,
          name: stripNone(it.name || mhn),
          nameNoWear: stripNone(it.nameNoWear || mhn),
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
    const parsed = parseNameForWear(mName.trim());
    const nameNoWear = stripNone(parsed.nameNoWear);
    const nonWear = isNonWearCategory(nameNoWear);
    const wearToUse: WearCode = nonWear ? "" : (mWear || parsed.wear || "");

    const market_hash_name = stripNone(toMarketHash(nameNoWear, wearToUse));
    const spAUD = spMap[market_hash_name] ?? spMap[stripNone(market_hash_name)];
    const priceAUD = typeof spAUD === "number" ? spAUD : undefined;

    const newRow: Row = {
      market_hash_name,
      name: market_hash_name,
      nameNoWear,
      wear: wearToUse,
      pattern: mPattern.trim() || undefined,
      float: mFloat.trim() || undefined,
      image: "",
      inspectLink: "",
      quantity: mQty,
      skinportAUD: spAUD,
      priceAUD,
      totalAUD: priceAUD ? priceAUD * mQty : undefined,
      source: "manual",
    };
    setRows((r) => [newRow, ...r]);
    setMName("");
    setMWear("");
    setMFloat("");
    setMPattern("");
    setMQty(1);
  }

  function removeRow(idx: number) {
    setRows((r) => r.filter((_, i) => i !== idx));
  }

  function updateQty(idx: number, qty: number) {
    const q = Math.max(1, Math.floor(qty || 1));
    setRows((r) =>
      r.map((row, i) =>
        i === idx
          ? {
              ...row,
              quantity: q,
              totalAUD:
                typeof row.skinportAUD === "number" ? row.skinportAUD * q : row.totalAUD,
            }
          : row
      )
    );
  }

  /* -------- Steam price backfill (strict + starless variants) -------- */
  const pricesFetchingRef = useRef(false);

  async function backfillSomeSteamPrices(max = 8) {
    if (pricesFetchingRef.current) return;
    pricesFetchingRef.current = true;

    const now = Date.now();
    const STALE_MS = 45 * 60 * 1000; // 45m

    try {
      const candidates = rows
        .map((r, i) => ({ r, i }))
        .filter(
          ({ r }) =>
            r.steamAUD === undefined ||
            !r.steamFetchedAt ||
            now - r.steamFetchedAt > STALE_MS
        )
        .slice(0, max);

      if (candidates.length === 0) return;

      const results = await Promise.all(
        candidates.map(async ({ r, i }) => {
          // Try multiple market-hash variants (with and without ★ etc.)
          const starless = r.market_hash_name.replace(/^★\s*/, "");
          const variants = [
            r.market_hash_name,
            r.market_hash_name.replace(NONE_SUFFIX_RE, ""),
            starless,
            starless.replace(NONE_SUFFIX_RE, ""),
          ].filter((v, idx, arr) => v && arr.indexOf(v) === idx) as string[];

          for (const name of variants) {
            try {
              const resp = await fetch(`/api/prices/steam?name=${encodeURIComponent(name)}`);
              const data: { aud?: number | null } = await resp.json();
              const parsed = typeof data?.aud === "number" ? data.aud : undefined;

              const sane = sanitizeSteam(parsed, r.skinportAUD);
              if (sane !== undefined) {
                return { idx: i, val: sane, ts: now };
              }
            } catch {
              // try next variant
            }
          }
          return { idx: i, val: undefined as number | undefined, ts: now };
        })
      );

      const map = new Map<number, { val: number | undefined; ts: number }>();
      results.forEach(({ idx, val, ts }) => map.set(idx, { val, ts }));

      setRows((prev) =>
        prev.map((row, idx) =>
          map.has(idx)
            ? { ...row, steamAUD: map.get(idx)!.val, steamFetchedAt: map.get(idx)!.ts }
            : row
        )
      );
      setSteamUpdatedAt(now);
    } finally {
      pricesFetchingRef.current = false;
    }
  }

  useEffect(() => {
    backfillSomeSteamPrices(12); // initial
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      backfillSomeSteamPrices(8);
    }, 5 * 60 * 1000);
    return () => window.clearInterval(id);
  }, [rows]);

  /* sorting + totals (stable, missing pinned to bottom) */
  const [sorted, totals] = useMemo(() => {
    const copy = [...rows];
    const dir: 1 | -1 = sort.dir === "asc" ? 1 : -1;

    copy.sort((a, b) => {
      let c = 0;
      switch (sort.key) {
        case "item":      c = cmpStr(a.nameNoWear, b.nameNoWear, dir); break;
        case "wear":      c = cmpWear(a.wear as string, b.wear as string, dir); break;
        case "pattern":   c = cmpNum(a.pattern, b.pattern, dir); break;
        case "float":     c = cmpNum(a.float, b.float, dir); break;
        case "qty":       c = cmpNum(a.quantity, b.quantity, dir); break;
        case "skinport":  c = cmpNum(a.skinportAUD, b.skinportAUD, dir); break;
        case "steam":     c = cmpNum(a.steamAUD, b.steamAUD, dir); break;
      }
      if (c === 0) c = cmpStr(a.nameNoWear, b.nameNoWear, 1); // tie-break
      return c;
    });

    const totalItems = copy.reduce((acc, r) => acc + (r.quantity ?? 1), 0);
    const totalSkinport = copy.reduce((s, r) => s + (r.skinportAUD ?? 0) * (r.quantity ?? 1), 0);
    const totalSteam = copy.reduce((s, r) => s + (r.steamAUD ?? 0) * (r.quantity ?? 1), 0);

    return [copy, { totalItems, totalSkinport, totalSteam }] as const;
  }, [rows, sort]);

  /* Map each row object to its original index—O(1) lookup for actions */
  const origIndexMap = useMemo(() => {
    const m = new Map<Row, number>();
    rows.forEach((r, i) => m.set(r, i));
    return m;
  }, [rows]);

  /* sortable header cell */
  function Th({ label, keyId }: { label: string; keyId: SortKey }) {
    const active = sort.key === keyId;
    const ariaSort: React.AriaAttributes["aria-sort"] =
      active ? (sort.dir === "asc" ? "ascending" : "descending") : "none";
    const onClick = () => dispatchSort({ type: "toggle", key: keyId });
    return (
      <th
        aria-sort={ariaSort}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        }}
        className={`px-4 py-2 text-left select-none cursor-pointer ${
          active ? "text-white" : "text-zinc-300"
        } hover:bg-zinc-900/40`}
      >
        <span className="inline-flex items-center gap-2">
          {label}
          {active && <span className="opacity-70">{sort.dir === "asc" ? "▲" : "▼"}</span>}
        </span>
      </th>
    );
  }

  const nonWearForCurrentInput = isNonWearCategory(stripNone(mName || ""));
  const formatTime = (ts: number | null) =>
    ts ? new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";

  return (
    <div className="mx-auto max-w-6xl p-6">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-zinc-800 px-3 py-1 text-sm text-zinc-200">
            Total items: {totals.totalItems}
          </div>
          <div className="rounded-full bg-zinc-800 px-3 py-1 text-sm text-zinc-200" title={`Skinport last updated: ${formatTime(skinportUpdatedAt)}`}>
            Skinport: A${totals.totalSkinport.toFixed(2)}{" "}
            <span className="text-zinc-400">({formatTime(skinportUpdatedAt)})</span>
          </div>
          <div className="rounded-full bg-zinc-800 px-3 py-1 text-sm text-zinc-200" title={`Steam last updated: ${formatTime(steamUpdatedAt)}`}>
            Steam: A${totals.totalSteam.toFixed(2)}{" "}
            <span className="text-zinc-400">({formatTime(steamUpdatedAt)})</span>
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
              placeholder="76561198XXXXXXXXXX or /profiles/&lt;id&gt;"
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
                Wear {nonWearForCurrentInput && <span className="text-zinc-500">(not applicable)</span>}
              </label>
              <select
                className={`h-12 w-full appearance-none rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm ${
                  nonWearForCurrentInput ? "opacity-50" : ""
                }`}
                value={mWear}
                onChange={(e) => setMWear(e.target.value as WearCode)}
                disabled={nonWearForCurrentInput}
                title={nonWearForCurrentInput ? "This item type doesn't use wear" : "Wear used for pricing"}
              >
                {WEAR_OPTIONS.map((w) => (
                  <option key={w.code} value={w.code}>
                    {w.label}
                  </option>
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
                      onClick={() => setMQty((q) => Math.max(1, q - 1))}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>

                    <div className="flex h-12 min-w-[3rem] items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm">
                      {mQty}
                    </div>

                    <button
                      type="button"
                      className="h-12 w-12 rounded-xl border border-zinc-700 bg-zinc-900"
                      onClick={() => setMQty((q) => q + 1)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
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
                const orig = origIndexMap.get(r)!;
                return (
                  <tr key={r.market_hash_name + "|" + orig} className="border-t border-zinc-800">
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-3">
                        {r.image ? (
                          <img
                            src={r.image}
                            alt={r.name}
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              const el = e.currentTarget as HTMLImageElement;
                              if (el.src !== FALLBACK_DATA_URL) el.src = FALLBACK_DATA_URL;
                            }}
                            className="h-10 w-10 rounded object-contain bg-zinc-800"
                          />
                        ) : (
                          <img
                            src={FALLBACK_DATA_URL}
                            alt=""
                            className="h-10 w-10 rounded object-contain"
                          />
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

                    {/* Qty */}
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="h-8 w-8 rounded border border-zinc-700"
                          onClick={() => updateQty(orig, (r.quantity ?? 1) - 1)}
                          aria-label={`Decrease quantity for ${r.nameNoWear}`}
                        >
                          −
                        </button>
                        <div className="flex h-8 min-w-[2.5rem] items-center justify-center rounded border border-zinc-700 bg-zinc-900 text-sm">
                          {r.quantity ?? 1}
                        </div>
                        <button
                          className="h-8 w-8 rounded border border-zinc-700"
                          onClick={() => updateQty(orig, (r.quantity ?? 1) + 1)}
                          aria-label={`Increase quantity for ${r.nameNoWear}`}
                        >
                          +
                        </button>
                      </div>
                    </td>

                    {/* Prices (unit + subtotal) */}
                    <td className="px-4 py-2">
                      <div className="text-right leading-tight">
                        <div>{typeof r.skinportAUD === "number" ? `A$${r.skinportAUD.toFixed(2)}` : "—"}</div>
                        {typeof r.skinportAUD === "number" && (r.quantity ?? 1) > 1 && (
                          <div className="mt-0.5 text-[11px] text-zinc-400">
                            ×{r.quantity ?? 1} ={" "}
                            <span className="tabular-nums">
                              A${(r.skinportAUD * (r.quantity ?? 1)).toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="text-right leading-tight">
                        <div>{typeof r.steamAUD === "number" ? `A$${r.steamAUD.toFixed(2)}` : "—"}</div>
                        {typeof r.steamAUD === "number" && (r.quantity ?? 1) > 1 && (
                          <div className="mt-0.5 text-[11px] text-zinc-400">
                            ×{r.quantity ?? 1} ={" "}
                            <span className="tabular-nums">
                              A${(r.steamAUD * (r.quantity ?? 1)).toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
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

      {/* Back to top */}
      <button
        type="button"
        aria-label="Back to top"
        onClick={scrollToTop}
        className={[
          "fixed bottom-6 right-6 z-50",
          "rounded-full bg-zinc-800/90 text-zinc-100 shadow-lg shadow-black/40",
          "backdrop-blur px-4 h-12 inline-flex items-center gap-2",
          "border border-zinc-700 hover:bg-zinc-700/80",
          "transition-all duration-200",
          showBackToTop ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-3 pointer-events-none",
        ].join(" ")}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="-mt-[1px]">
          <path d="M6 14l6-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-sm">Top</span>
      </button>
    </div>
  );
}
