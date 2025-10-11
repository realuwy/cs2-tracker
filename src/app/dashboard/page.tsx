"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { fetchInventory, InvItem } from "@/lib/api";

/* ----------------------------- constants ----------------------------- */

const STORAGE_KEY = "cs2:dashboard:rows";

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

/** Only for display under item name — hides "(none)". */
const wearLabelForRow = (code?: WearCode) => (code ? wearLabel(code) : "");

const LABEL_TO_CODE: Record<string, WearCode> = {
  "factory new": "FN",
  "minimal wear": "MW",
  "field-tested": "FT",
  "well-worn": "WW",
  "battle-scarred": "BS",
};

const NONE_SUFFIX_RE = /\s+\(none\)$/i;

// fallback gray square
const FALLBACK_DATA_URL =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect x="0" y="0" width="40" height="40" rx="6" ry="6" fill="#3f3f46"/></svg>`
  );

/* ----------------------------- helpers ----------------------------- */

const stripNone = (s: string) => s.replace(NONE_SUFFIX_RE, "");

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

function isNonWearCategory(nameNoWear: string): boolean {
  const s = nameNoWear.trim().toLowerCase();
  return /^(sticker|patch|graffiti|music kit|agent|case|capsule|souvenir|storage unit|gift|key|collectible|pin|autograph)/i.test(
    s
  );
}

const WEAR_TO_RANK: Record<string, number> = { FN: 0, MW: 1, FT: 2, WW: 3, BS: 4 };
const wearRank = (code?: string) => (code ? WEAR_TO_RANK[code] ?? 99 : 99);

const isMissingStr = (s?: string | null) => !s || s.trim() === "";
const isMissingNum = (v: unknown) =>
  v === undefined ||
  v === null ||
  (typeof v === "string" && v.trim() === "") ||
  !Number.isFinite(Number(v));

const cmpStr = (a: string | undefined, b: string | undefined, dir: 1 | -1) => {
  const am = isMissingStr(a);
  const bm = isMissingStr(b);
  if (am && bm) return 0;
  if (am) return 1;
  if (bm) return -1;
  return (a ?? "").toLocaleLowerCase().localeCompare((b ?? "").toLocaleLowerCase()) * dir;
};
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
  const am = ra === 99, bm = rb === 99;
  if (am && bm) return 0;
  if (am) return 1;
  if (bm) return -1;
  return (ra === rb ? 0 : ra < rb ? -1 : 1) * dir;
};

function toMarketHash(nameNoWear: string, wear?: WearCode) {
  if (!wear) return nameNoWear;
  if (!["FN", "MW", "FT", "WW", "BS"].includes(wear)) return nameNoWear;
  const lbl = wearLabel(wear);
  return lbl ? `${nameNoWear} (${lbl})` : nameNoWear;
}

// Steam must be within [0.5x..3x] of Skinport and not insane
function sanitizeSteam(aud: number | undefined, skinport?: number): number | undefined {
  if (aud === undefined || !isFinite(aud) || aud <= 0) return undefined;
  if (aud > 20000) return undefined;
  if (typeof skinport === "number" && skinport > 0) {
    const lo = skinport * 0.5, hi = skinport * 3;
    if (aud < lo || aud > hi) return undefined;
    if (skinport < 50 && aud > 100) return undefined;
  }
  return aud;
}

/* ----------------------------- types ----------------------------- */

type Row = Omit<InvItem, "pattern" | "float"> & {
  pattern?: string;
  float?: string;
  skinportAUD?: number;
  steamAUD?: number;
  priceAUD?: number;
  totalAUD?: number;
  source: "steam" | "manual";
  steamFetchedAt?: number;
};

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

/* ----------------------------- UI atoms ----------------------------- */

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-zinc-700/60 bg-zinc-900/70 px-2 py-0.5 text-[11px] text-zinc-300 shadow-sm shadow-black/20">
      {children}
    </span>
  );
}

function TinyIconBtn({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 transition"
    >
      {children}
    </button>
  );
}

/* ----------------------------- component ----------------------------- */

type EditorState = {
  idx: number;
  qty: number;
  float: string;
  pattern: string;
  wear: WearCode;
} | null;

export default function DashboardPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [spMap, setSpMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [sort, dispatchSort] = useReducer(sortReducer, { key: "item", dir: "asc" });

  // controls
  const [steamId, setSteamId] = useState("");
  const [mName, setMName] = useState("");
  const [mWear, setMWear] = useState<WearCode>("");
  const [mFloat, setMFloat] = useState("");
  const [mPattern, setMPattern] = useState("");
  const [mQty, setMQty] = useState(1);

  const [showBackToTop, setShowBackToTop] = useState(false);
  const [skinportUpdatedAt, setSkinportUpdatedAt] = useState<number | null>(null);
  const [steamUpdatedAt, setSteamUpdatedAt] = useState<number | null>(null);

  const [editor, setEditor] = useState<EditorState>(null);

  /* ---- restore rows ---- */
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
          image: (r as any).image == null ? "" : (r as any).image,
          skinportAUD: isMissingNum(r.skinportAUD) ? undefined : Number(r.skinportAUD),
          steamAUD: isMissingNum(r.steamAUD) ? undefined : Number(r.steamAUD),
          quantity: Math.max(1, Number(r.quantity ?? 1)),
        }));
        setRows(normalized);
      }
    } catch {}
  }, []);

  /* ---- persist rows ---- */
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

  /* ---- Skinport map + images ---- */
  async function refreshSkinport() {
    try {
      const [priceRes, imgRes] = await Promise.all([
        fetch("/api/prices/skinport-map", { cache: "no-store" }),
        fetch("/api/skinport/images", { cache: "force-cache" }).catch(() => null),
      ]);

      const priceData: {
        map: Record<string, number>;
        images?: Record<string, string>;
        updatedAt?: number;
      } = await priceRes.json();
      const extraImgData: { images?: Record<string, string> } =
        (await imgRes?.json?.()) ?? {};

      const map = priceData.map || {};
      const images: Record<string, string> = {
        ...(priceData.images || {}),
        ...(extraImgData.images || {}),
      };

      setSkinportUpdatedAt(priceData.updatedAt ?? Date.now());
      setSpMap(map);

      const findImage = (
        mhn: string,
        nameNoWear: string,
        wear?: string
      ): string | undefined => {
        if (images[mhn]) return images[mhn];
        const noNone = mhn.replace(NONE_SUFFIX_RE, "");
        if (images[noNone]) return images[noNone];
        if (images[nameNoWear]) return images[nameNoWear];
        const lbl = wearLabel(wear);
        if (lbl) {
          const withWear = `${nameNoWear} (${lbl})`;
          if (images[withWear]) return images[withWear];
        }
        return undefined;
      };

      setRows((prev) =>
        prev.map((row) => {
          const sp =
            map[row.market_hash_name] ??
            map[row.market_hash_name.replace(NONE_SUFFIX_RE, "")] ??
            map[row.nameNoWear];

          const priceAUD = typeof sp === "number" ? sp : undefined;
          const qty = row.quantity ?? 1;

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
            image: img ?? row.image,
            steamAUD: saneSteam,
          };
        })
      );
    } catch {
      // keep last-good values
    }
  }

  useEffect(() => {
    refreshSkinport();
  }, []);
  useEffect(() => {
    const id = window.setInterval(() => refreshSkinport(), 5 * 60 * 1000);
    return () => window.clearInterval(id);
  }, []);

  /* ---- lazy image hydration via by-name API (Skinport→Steam) ---- */
  useEffect(() => {
    let cancelled = false;

    (async () => {
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

          if (typeof data.url === "string" && data.url.length > 0) {
            const url = data.url;
            setRows((prev) =>
              prev.map((row, i) => {
                if (i === idx) return { ...row, image: url };
                if ((row as any).image == null) return { ...row, image: "" };
                return row;
              })
            );
          }
        } catch {
          // ignore
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [rows]);

  /* ---- optional default import ---- */
  useEffect(() => {
    const def = process.env.NEXT_PUBLIC_DEFAULT_STEAM_ID64;
    if (def) void load(def);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- back to top visibility ---- */
  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const scrollToTop = () => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
  };

  /* ---- import & manual add ---- */
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
          image: (it as any).image ?? "",
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

  /* ---- Steam backfill ---- */
  const pricesFetchingRef = useRef(false);

  async function backfillSomeSteamPrices(max = 8) {
    if (pricesFetchingRef.current) return;
    pricesFetchingRef.current = true;

    const now = Date.now();
    const STALE_MS = 45 * 60 * 1000;

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
              if (sane !== undefined) return { idx: i, val: sane, ts: now };
            } catch {}
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
    backfillSomeSteamPrices(12);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const id = window.setInterval(() => backfillSomeSteamPrices(8), 5 * 60 * 1000);
    return () => window.clearInterval(id);
  }, [rows]);

  /* ---- sorting + totals ---- */
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
      if (c === 0) c = cmpStr(a.nameNoWear, b.nameNoWear, 1);
      return c;
    });

    const totalItems = copy.reduce((acc, r) => acc + (r.quantity ?? 1), 0);
    const totalSkinport = copy.reduce((s, r) => s + (r.skinportAUD ?? 0) * (r.quantity ?? 1), 0);
    const totalSteam = copy.reduce((s, r) => s + (r.steamAUD ?? 0) * (r.quantity ?? 1), 0);
    return [copy, { totalItems, totalSkinport, totalSteam }] as const;
  }, [rows, sort]);

  const origIndexMap = useMemo(() => {
    const m = new Map<Row, number>();
    rows.forEach((r, i) => m.set(r, i));
    return m;
  }, [rows]);

  function SortChip({ k, label }: { k: SortKey; label: string }) {
    const active = sort.key === k;
    const arrow = active ? (sort.dir === "asc" ? "▲" : "▼") : "";
    return (
      <button
        onClick={() => dispatchSort({ type: "toggle", key: k })}
        className={`rounded-full border px-2.5 py-1 text-xs transition ${
          active
            ? "border-amber-600 text-amber-400 bg-amber-600/10"
            : "border-zinc-700 text-zinc-300 hover:bg-zinc-800/60"
        }`}
      >
        {label} {arrow}
      </button>
    );
  }

  const nonWearForCurrentInput = isNonWearCategory(stripNone(mName || ""));
  const formatTime = (ts: number | null) =>
    ts ? new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";

  /* -------- editor helpers -------- */
  const openEditor = (idx: number, r: Row) => {
    setEditor({
      idx,
      qty: r.quantity ?? 1,
      float: r.float ?? "",
      pattern: r.pattern ?? "",
      wear: (r.wear as WearCode) ?? "",
    });
  };

  const applyEditor = () => {
    if (!editor) return;
    const { idx, qty, float, pattern, wear } = editor;
    setRows((prev) =>
      prev.map((row, i) =>
        i === idx
          ? {
              ...row,
              quantity: Math.max(1, Math.floor(qty || 1)),
              float: float.trim() || undefined,
              pattern: pattern.trim() || undefined,
              wear,
              // recompute totals if qty changed
              totalAUD:
                typeof row.skinportAUD === "number"
                  ? row.skinportAUD * Math.max(1, Math.floor(qty || 1))
                  : row.totalAUD,
              market_hash_name: stripNone(toMarketHash(row.nameNoWear, wear)),
            }
          : row
      )
    );
    setEditor(null);
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <div className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-sm text-zinc-200">
            Total items: <span className="tabular-nums">{totals.totalItems}</span>
          </div>
          <div className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-sm text-zinc-200" title={`Skinport last updated: ${formatTime(skinportUpdatedAt)}`}>
            Skinport: <span className="tabular-nums">A${totals.totalSkinport.toFixed(2)}</span>{" "}
            <span className="text-zinc-400">({formatTime(skinportUpdatedAt)})</span>
          </div>
          <div className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-sm text-zinc-200" title={`Steam last updated: ${formatTime(steamUpdatedAt)}`}>
            Steam: <span className="tabular-nums">A${totals.totalSteam.toFixed(2)}</span>{" "}
            <span className="text-zinc-400">({formatTime(steamUpdatedAt)})</span>
          </div>
        </div>
      </div>

      {/* Cards — IMPORT + MANUAL */}
      <div className="grid items-stretch grid-cols-1 gap-6 md:grid-cols-2">
        {/* Import */}
        <div className="flex h-full flex-col rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
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

        {/* Manual add */}
        <div className="flex h-full flex-col rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
          <div className="text-lg font-medium">Add manual item</div>
          <div className="mt-3 grid items-end grid-cols-1 gap-3 md:grid-cols-12">
            <div className="md:col-span-5">
              <label className="mb-1 block text-[11px] leading-none text-zinc-400">Item name (paste WITHOUT wear)</label>
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
                className={`h-12 w-full appearance-none rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm ${nonWearForCurrentInput ? "opacity-50" : ""}`}
                value={mWear}
                onChange={(e) => setMWear(e.target.value as WearCode)}
                disabled={nonWearForCurrentInput}
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
            <div className="md:col-span-12">
              <div className="flex items-center gap-3">
                <div className="w-40">
                  <label className="mb-1 block text-[11px] leading-none text-zinc-400">Quantity</label>
                  <div className="flex h-12 items-center gap-2">
                    <button type="button" className="h-12 w-12 rounded-xl border border-zinc-700 bg-zinc-900" onClick={() => setMQty((q) => Math.max(1, q - 1))}>−</button>
                    <div className="flex h-12 min-w-[3rem] items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm tabular-nums">{mQty}</div>
                    <button type="button" className="h-12 w-12 rounded-xl border border-zinc-700 bg-zinc-900" onClick={() => setMQty((q) => q + 1)}>+</button>
                  </div>
                </div>
                <button onClick={addManual} className="h-12 grow rounded-xl bg-amber-600 px-4 text-black hover:bg-amber-500 disabled:opacity-60" disabled={!mName.trim()}>
                  Add
                </button>
              </div>
              <p className="mt-2 text-xs text-zinc-400">Pricing uses only <span className="font-medium">Item name + Wear</span>. Float/Pattern are for display.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sort toolbar */}
      <div className="mt-6 mb-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="mr-1 text-zinc-400">Sort:</span>
        <SortChip k="item" label="Item" />
        <SortChip k="wear" label="Exterior" />
        <SortChip k="pattern" label="Pattern" />
        <SortChip k="float" label="Float" />
        <SortChip k="qty" label="Qty" />
        <SortChip k="skinport" label="Skinport" />
        <SortChip k="steam" label="Steam" />
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-2xl border border-zinc-800">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur text-zinc-300">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Item</th>
              <th className="px-4 py-3 text-right font-medium">Qty</th>
              <th className="px-4 py-3 text-right font-medium">Skinport (AUD)</th>
              <th className="px-4 py-3 text-right font-medium">Steam (AUD)</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-800">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-400">
                  No items yet. Use <span className="underline">Add manual item</span> or import from Steam.
                </td>
              </tr>
            ) : (
              sorted.map((r) => {
                const orig = origIndexMap.get(r)!;
                const isOpen = editor?.idx === orig;
                return (
                  <tr key={r.market_hash_name + "|" + orig} className="bg-zinc-950/40 hover:bg-zinc-900/40 transition-colors">
                    {/* ITEM */}
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-3">
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
                            className="h-10 w-10 rounded-lg object-contain bg-zinc-800"
                          />
                        ) : (
                          <img src={FALLBACK_DATA_URL} alt="" className="h-10 w-10 rounded-lg object-contain" />
                        )}

                        <div className="min-w-0">
                          <div className="truncate font-medium" title={r.market_hash_name}>
                            {r.nameNoWear}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {/* NOTE: wear hidden if code==="" */}
                            {wearLabelForRow(r.wear as WearCode) && (
                              <Pill>{wearLabelForRow(r.wear as WearCode)}</Pill>
                            )}
                            {r.pattern && <Pill>Pattern: {r.pattern}</Pill>}
                            {r.float && <Pill>Float: {r.float}</Pill>}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* QTY (number only) */}
                    <td className="px-4 py-3 text-right tabular-nums">{r.quantity ?? 1}</td>

                    {/* SKINPORT */}
                    <td className="px-4 py-3">
                      <div className="text-right leading-tight">
                        <div className="tabular-nums">{typeof r.skinportAUD === "number" ? `A$${r.skinportAUD.toFixed(2)}` : "—"}</div>
                        {typeof r.skinportAUD === "number" && (r.quantity ?? 1) > 1 && (
                          <div className="mt-0.5 text-[11px] text-zinc-400 tabular-nums">
                            ×{r.quantity ?? 1} = A${(r.skinportAUD * (r.quantity ?? 1)).toFixed(2)}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* STEAM */}
                    <td className="px-4 py-3">
                      <div className="text-right leading-tight">
                        <div className="tabular-nums">{typeof r.steamAUD === "number" ? `A$${r.steamAUD.toFixed(2)}` : "—"}</div>
                        {typeof r.steamAUD === "number" && (r.quantity ?? 1) > 1 && (
                          <div className="mt-0.5 text-[11px] text-zinc-400 tabular-nums">
                            ×{r.quantity ?? 1} = A${(r.steamAUD * (r.quantity ?? 1)).toFixed(2)}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* ACTIONS: edit + delete */}
                    <td className="relative px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <TinyIconBtn title="Edit" onClick={() => openEditor(orig, r)}>
                          {/* pencil */}
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M12 20h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M16.5 3.5l4 4L8 20H4v-4L16.5 3.5z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </TinyIconBtn>
                        <TinyIconBtn title="Delete" onClick={() => removeRow(orig)}>
                          {/* trash */}
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M3 6h18M8 6V4h8v2m-1 0v14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V6h10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </TinyIconBtn>
                      </div>

                      {/* Editor popover */}
                      {isOpen && (
                        <div className="absolute right-3 top-12 z-20 w-72 rounded-xl border border-zinc-700 bg-zinc-950 p-3 shadow-xl shadow-black/40">
                          <div className="grid grid-cols-12 gap-3">
                            <div className="col-span-4">
                              <label className="mb-1 block text-[11px] text-zinc-400">Qty</label>
                              <input
                                inputMode="numeric"
                                className="h-9 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 text-sm tabular-nums"
                                value={editor?.qty ?? 1}
                                onChange={(e) =>
                                  setEditor((s) => (s ? { ...s, qty: Math.max(1, Number(e.target.value) || 1) } : s))
                                }
                              />
                            </div>
                            <div className="col-span-8">
                              <label className="mb-1 block text-[11px] text-zinc-400">Wear</label>
                              <select
                                className="h-9 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 text-sm"
                                value={editor?.wear ?? ""}
                                onChange={(e) =>
                                  setEditor((s) => (s ? { ...s, wear: e.target.value as WearCode } : s))
                                }
                              >
                                {WEAR_OPTIONS.map((w) => (
                                  <option key={w.code} value={w.code}>
                                    {w.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="col-span-6">
                              <label className="mb-1 block text-[11px] text-zinc-400">Float</label>
                              <input
                                className="h-9 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 text-sm"
                                placeholder="0.1234"
                                value={editor?.float ?? ""}
                                onChange={(e) =>
                                  setEditor((s) => (s ? { ...s, float: e.target.value } : s))
                                }
                              />
                            </div>
                            <div className="col-span-6">
                              <label className="mb-1 block text-[11px] text-zinc-400">Pattern</label>
                              <input
                                className="h-9 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 text-sm"
                                placeholder="123"
                                value={editor?.pattern ?? ""}
                                onChange={(e) =>
                                  setEditor((s) => (s ? { ...s, pattern: e.target.value } : s))
                                }
                              />
                            </div>
                          </div>

                          <div className="mt-3 flex justify-end gap-2">
                            <button
                              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-zinc-300 hover:bg-zinc-800"
                              onClick={() => setEditor(null)}
                            >
                              Cancel
                            </button>
                            <button
                              className="rounded-lg bg-amber-600 px-3 py-1.5 text-black hover:bg-amber-500"
                              onClick={applyEditor}
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      )}
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
          "fixed bottom-6 right-6 z-50 rounded-full bg-zinc-800/90 text-zinc-100 shadow-lg shadow-black/40",
          "backdrop-blur px-4 h-12 inline-flex items-center gap-2",
          "border border-zinc-700 hover:bg-zinc-700/80 transition-all duration-200",
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
