"use client";
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { InvItem } from "@/lib/api"; // keep InvItem for Row typing
import { getSupabaseClient } from "@/lib/supabase";
import { fetchAccountRows, upsertAccountRows } from "@/lib/rows";
import ImportWizard from "@/components/ImportWizard";
import type { ParsedInventory } from "@/types/steam";
import { parseSteamInventory } from "@/lib/steam-parse";

/* ----------------------------- constants ----------------------------- */

const STORAGE_KEY = "cs2:dashboard:rows";
const STORAGE_TS_KEY = "cs2:dashboard:rows:updatedAt";

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
function Tooltip({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="relative inline-block group">
      {children}
      <div
        role="tooltip"
        className="pointer-events-none absolute right-0 z-50 mt-2 w-64 rounded-xl border border-border bg-surface/95 p-3 text-[12px] leading-relaxed text-muted shadow-lg opacity-0 translate-y-1 transition group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100"
      >
        {label}
      </div>
    </div>
  );
}

function mapUploadedToRows(items: any[], spMap: Record<string, number>): Row[] {
  return (items || []).map((it: any) => {
    const rawName = String(it.name ?? it.market_hash_name ?? "Unknown");
    const parsed = parseNameForWear(stripNone(rawName));
    const nameNoWear = stripNone(parsed.nameNoWear);
    // Prefer explicit exterior from upload; otherwise fall back to parsed wear.
    const wear: WearCode =
      (LABEL_TO_CODE[String(it.exterior || "").toLowerCase()] as WearCode) ??
      ((parsed.wear as WearCode) || "");

    const market_hash_name = stripNone(toMarketHash(nameNoWear, wear));
    const spAUD = spMap[market_hash_name] ?? spMap[stripNone(market_hash_name)];
    const priceAUD = typeof spAUD === "number" ? spAUD : undefined;

    // Uploaded icon may be full economy URL or a path
    const icon = String(it.icon || "");
    const image = icon.startsWith("http")
      ? icon
      : icon
      ? `https://steamcommunity-a.akamaihd.net/economy/image/${icon}`
      : "";

    return {
      // InvItem core
      market_hash_name,
      name: market_hash_name,
      nameNoWear,
      wear,
      image,
      inspectLink: "",
      quantity: Number(it.quantity ?? 1),

      // pricing
      skinportAUD: spAUD,
      steamAUD: undefined,
      priceAUD,
      totalAUD: priceAUD ? priceAUD * Number(it.quantity ?? 1) : undefined,

      // meta
      source: "steam",
    } as Row;
  });
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
  return (a ?? "").toLocaleLowerCase().localeCompare((b ?? "")!.toLocaleLowerCase()) * dir;
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
    <span className="inline-flex items-center rounded-full bg-surface2/70 px-2 py-0.5 text-[11px] text-muted">
      {children}
    </span>
  );
}

/* ----------------------------- Edit dialog ----------------------------- */

function EditRowDialog({
  open,
  row,
  onClose,
  onSave,
  spMap,
}: {
  open: boolean;
  row: Row | null;
  onClose: () => void;
  onSave: (next: Row) => void;
  spMap: Record<string, number>;
}) {
  const [name, setName] = useState(row?.nameNoWear ?? "");
  const [wear, setWear] = useState<WearCode>((row?.wear as WearCode) ?? "");
  const [flt, setFlt] = useState<string>(row?.float ?? "");
  const [pat, setPat] = useState<string>(row?.pattern ?? "");
  const [qty, setQty] = useState<number>(row?.quantity ?? 1);

  useEffect(() => {
    setName(row?.nameNoWear ?? "");
    setWear(((row?.wear as WearCode) ?? "") as WearCode);
    setFlt(row?.float ?? "");
    setPat(row?.pattern ?? "");
    setQty(row?.quantity ?? 1);
  }, [row]);

  if (!open || !row) return null;

  const apply = () => {
    const nameNoWear = stripNone(name.trim() || row.nameNoWear);
    const nonWear = isNonWearCategory(nameNoWear);
    const wearToUse: WearCode = nonWear ? "" : wear;

    const mhn = stripNone(toMarketHash(nameNoWear, wearToUse));
    const spAUD = spMap[mhn] ?? spMap[stripNone(mhn)];
    const priceAUD = typeof spAUD === "number" ? spAUD : undefined;

    const updated: Row = {
      ...row,
      market_hash_name: mhn,
      name: mhn,
      nameNoWear,
      wear: wearToUse,
      pattern: pat.trim() || undefined,
      float: flt.trim() || undefined,
      quantity: Math.max(1, qty),
      skinportAUD: spAUD,
      priceAUD,
      totalAUD: priceAUD ? priceAUD * Math.max(1, qty) : undefined,
    };
    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-card">
        <h2 className="mb-4 text-center text-2xl font-bold">Edit Item</h2>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-muted">Item</label>
            <input
              className="w-full rounded-lg border border-border bg-surface2 px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              list="item-suggestions"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-sm text-muted">Wear</label>
              <select
                className="w-full rounded-lg border border-border bg-surface2 px-3 py-2"
                value={wear}
                onChange={(e) => setWear(e.target.value as WearCode)}
                disabled={isNonWearCategory(name)}
              >
                {WEAR_OPTIONS.map((w) => (
                  <option key={w.code} value={w.code}>
                    {w.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted">Float</label>
              <input
                type="number"
                step="0.00001"
                min="0"
                max="1"
                className="w-full rounded-lg border border-border bg-surface2 px-3 py-2"
                value={flt}
                onChange={(e) => setFlt(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted">Pattern</label>
              <input
                type="number"
                className="w-full rounded-lg border border-border bg-surface2 px-3 py-2"
                value={pat}
                onChange={(e) => setPat(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-muted">Quantity</label>
            <input
              type="number"
              min={1}
              className="w-full rounded-lg border border-border bg-surface2 px-3 py-2"
              value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button className="rounded-lg border border-border bg-surface2 px-4 py-2 hover:bg-surface" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-accent px-4 py-2" onClick={apply}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- Mobile Row Card ----------------------------- */

function RowCard({ r }: { r: Row }) {
  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-3">
      <div className="flex items-start gap-3">
        {r.image ? (
          <img
            src={r.image}
            alt={r.name}
            className="h-12 w-12 rounded object-contain bg-surface2"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="h-12 w-12 rounded bg-surface2" />
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium" title={r.market_hash_name}>
            {r.nameNoWear}
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {wearLabelForRow(r.wear as WearCode) && <Pill>{wearLabelForRow(r.wear as WearCode)}</Pill>}
            {r.pattern && <Pill>Pattern: {r.pattern}</Pill>}
            {r.float && <Pill>Float: {r.float}</Pill>}
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl border border-border bg-surface2/60 p-2">
          <div className="text-xs text-muted">Qty</div>
          <div className="font-semibold">{r.quantity ?? 1}</div>
        </div>
        <div className="rounded-xl border border-border bg-surface2/60 p-2 text-right">
          <div className="text-xs text-muted">Skinport</div>
          <div className="font-semibold">
            {typeof r.skinportAUD === "number" ? `A$${r.skinportAUD.toFixed(2)}` : "—"}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface2/60 p-2">
          <div className="text-xs text-muted">Steam</div>
          <div className="font-semibold">
            {typeof r.steamAUD === "number" ? `A$${r.steamAUD.toFixed(2)}` : "—"}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-surface2 text-muted hover:bg-surface"
            title="Edit"
            onClick={() => (window as any).__dash_openEdit?.(r)}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
            </svg>
          </button>
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-surface2 text-muted hover:bg-surface"
            title="Delete"
            onClick={() => (window as any).__dash_deleteRow?.(r)}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- component ----------------------------- */

export default function DashboardPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [spMap, setSpMap] = useState<Record<string, number>>({});
  const [sort, dispatchSort] = useReducer(sortReducer, { key: "item", dir: "asc" });
  const supabase = getSupabaseClient();

  // controls
  const [mName, setMName] = useState("");
  const [mWear, setMWear] = useState<WearCode>("");
  const [mFloat, setMFloat] = useState("");
  const [mPattern, setMPattern] = useState("");
  const [mQty, setMQty] = useState(1);

  const [showBackToTop, setShowBackToTop] = useState(false);
  const [skinportUpdatedAt, setSkinportUpdatedAt] = useState<number | null>(null);
  const [steamUpdatedAt, setSteamUpdatedAt] = useState<number | null>(null);

  // manual refresh spinner
  const [refreshing, setRefreshing] = useState(false);

  // edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState<Row | null>(null);

  // --- auth state (for per-user sync) ---
  const [authed, setAuthed] = useState<string | null>(null);
  useEffect(() => {
    let unsub: (() => void) | undefined;
    (async () => {
      const { data } = await supabase.auth.getSession();
      setAuthed(data.session?.user?.id ?? null);
      const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => {
        setAuthed(sess?.user?.id ?? null);
      });
      unsub = () => sub.subscription.unsubscribe();
    })();
    return () => unsub?.();
  }, [supabase]);

  // Load any uploaded (bookmarklet) items into the table on first load
  useEffect(() => {
    try {
      const raw = localStorage.getItem("cs2_items");
      if (raw) setRows(JSON.parse(raw));
    } catch {}
  }, []);

  /* ---- restore rows (local + account sync) ---- */
  useEffect(() => {
    (async () => {
      // read local
      let localRows: Row[] | null = null;
      let localTs = 0;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) localRows = JSON.parse(raw) as Row[];
        localTs = Number(localStorage.getItem(STORAGE_TS_KEY) || "0");
      } catch {}

      // normalize local
      if (localRows) {
        localRows = localRows.map((r) => ({
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
      }

      // if authed, fetch server and decide
      if (authed) {
        const server = await fetchAccountRows();
        const serverTs = server?.updated_at ? new Date(server.updated_at).getTime() : 0;
        if (server && server.rows && serverTs >= localTs) {
          setRows(server.rows as Row[]);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(server.rows));
          localStorage.setItem(STORAGE_TS_KEY, String(serverTs || Date.now()));
        } else {
          const payload = localRows ?? [];
          setRows(payload);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
          localStorage.setItem(STORAGE_TS_KEY, String(localTs || Date.now()));
          if (payload) void upsertAccountRows(payload);
        }
      } else {
        setRows(localRows ?? []);
        if (localRows == null) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
          localStorage.setItem(STORAGE_TS_KEY, String(Date.now()));
        }
      }
    })();
  }, [authed]);

  /* ---- persist rows (local + upsert when authed) ---- */
  const saveTimer = useRef<number | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      try {
        const now = Date.now();
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
        window.localStorage.setItem(STORAGE_TS_KEY, String(now));
        if (authed) {
          await upsertAccountRows(rows);
        }
      } catch {}
    }, 250);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [rows, authed]);

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
      const extraImgData: { images?: Record<string, string> } = (await (imgRes as any)?.json?.()) ?? {};

      const map = priceData.map || {};
      const images: Record<string, string> = {
        ...(priceData.images || {}),
        ...(extraImgData.images || {}),
      };

      setSkinportUpdatedAt(priceData.updatedAt ?? Date.now());
      setSpMap(map);

      const findImage = (mhn: string, nameNoWear: string, wear?: string): string | undefined => {
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
              : findImage(row.market_hash_name, row.nameNoWear, (row.wear as string | undefined));

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

  /* ---- lazy image hydration via by-name API (Skinport→Steam) ---- */
  const hydratedNamesRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const batch: Array<{ name: string; idx: number }> = [];
      for (let i = 0; i < rows.length && batch.length < 6; i++) {
        const r = rows[i];
        const nm = r.market_hash_name;
        if ((!r.image || r.image.trim() === "") && !hydratedNamesRef.current.has(nm)) {
          hydratedNamesRef.current.add(nm);
          batch.push({ name: nm, idx: i });
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
        } catch {}
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [rows]);

  /* ---- back to top visibility ---- */
  useEffect(() => {
    if (typeof window === "undefined") return; // SSR guard
    const onScroll = () => setShowBackToTop(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ---- smooth scroll to top ---- */
  const scrollToTop = () => {
    if (typeof window === "undefined") return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
  };

  /* ---- manual add ---- */
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

  /* ---- Steam backfill (prices by name) ---- */
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
  }, []);

  /** Auto-refresh every 15 minutes (4/hour) */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const tick = async () => {
      try {
        await refreshSkinport();
        await backfillSomeSteamPrices(12);
      } catch {}
    };
    tick();
    const id = window.setInterval(tick, 15 * 60 * 1000);
    return () => window.clearInterval(id);
  }, []);

  /* ---- sorting + totals ---- */
  const [sorted, totals] = useMemo(() => {
    const copy = [...rows];
    const dir: 1 | -1 = sort.dir === "asc" ? 1 : -1;

    copy.sort((a, b) => {
      let c = 0;
      switch (sort.key) {
        case "item":
          c = cmpStr(a.nameNoWear, b.nameNoWear, dir);
          break;
        case "wear":
          c = cmpWear(a.wear as string, b.wear as string, dir);
          break;
        case "pattern":
          c = cmpNum(a.pattern, b.pattern, dir);
          break;
        case "float":
          c = cmpNum(a.float, b.float, dir);
          break;
        case "qty":
          c = cmpNum(a.quantity, b.quantity, dir);
          break;
        case "skinport":
          c = cmpNum(a.skinportAUD, b.skinportAUD, dir);
          break;
        case "steam":
          c = cmpNum(a.steamAUD, b.steamAUD, dir);
          break;
      }
      if (c === 0) c = cmpStr(a.nameNoWear, b.nameNoWear, 1);
      return c;
    });

    const totalItems = copy.reduce((acc, r) => acc + (r.quantity ?? 1), 0);
    const totalSkinport = copy.reduce(
      (s, r) => s + (r.skinportAUD ?? 0) * (r.quantity ?? 1),
      0
    );
    const totalSteam = copy.reduce((s, r) => s + (r.steamAUD ?? 0) * (r.quantity ?? 1), 0);
    return [copy, { totalItems, totalSkinport, totalSteam }] as const;
  }, [rows, sort]);

  const origIndexMap = useMemo(() => {
    const m = new Map<Row, number>();
    rows.forEach((r, i) => m.set(r, i));
    return m;
  }, [rows]);

  // expose handlers for RowCard buttons (mobile)
  useEffect(() => {
    (window as any).__dash_openEdit = (row: Row) => {
      setEditRow(row);
      setEditOpen(true);
    };
    (window as any).__dash_deleteRow = (row: Row) => {
      const orig = origIndexMap.get(row);
      if (orig != null) removeRow(orig);
    };
    return () => {
      delete (window as any).__dash_openEdit;
      delete (window as any).__dash_deleteRow;
    };
  }, [origIndexMap]);

  /* ----- AUTOCOMPLETE OPTIONS (from Skinport map + existing rows) ----- */
  const autoNames = useMemo(() => {
    const set = new Set<string>();
    Object.keys(spMap).forEach((k) => set.add(k));
    rows.forEach((r) => {
      if (r.market_hash_name) set.add(r.market_hash_name);
      if (r.nameNoWear) set.add(r.nameNoWear);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [spMap, rows]);

  // Manual refresh (Skinport + Steam)
  async function handleManualRefresh() {
    try {
      setRefreshing(true);
      await refreshSkinport();
      await backfillSomeSteamPrices(12);
    } finally {
      setRefreshing(false);
    }
  }

  // Small helper to show times like "14:32"
  function formatTime(ts: number | null) {
    return ts
      ? new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "—";
  }

  // Sort button chip used in the toolbar
  function SortChip({ k, label }: { k: SortKey; label: string }) {
    const active = sort.key === k;
    const arrow = active ? (sort.dir === "asc" ? "▲" : "▼") : "";
    return (
      <button
        onClick={() => dispatchSort({ type: "toggle", key: k })}
        className={`rounded-full border px-2.5 py-1 text-xs transition ${
          active
            ? "border-accent text-accent bg-[color:var(--chip-active,transparent)]"
            : "border-border text-muted hover:bg-surface2/60"
        }`}
      >
        {label} {arrow}
      </button>
    );
  }

/** Receive parsed items from ImportWizard or raw Steam JSON */
function handleParsed(data: any) {
  let items: any[] = [];

  try {
    if (data && (data.items || data.rows || data.inventory)) {
      items = data.items || data.rows || data.inventory;
    } else if (Array.isArray(data)) {
      items = data;
    } else if (data && data.assets && data.descriptions) {
      const parsed = parseSteamInventory(data); // make sure it's imported
      items = parsed.items || [];
    }
  } catch (err) {
    console.error("Steam JSON parse failed", err);
    items = [];
  }

  // Guard: nothing to add
  if (!Array.isArray(items) || items.length === 0) return;

  // Optional: strip obviously bad entries
  const clean = items.filter(Boolean);

  const mapped = mapUploadedToRows(clean, spMap);
  if (mapped.length === 0) return;

  setRows((prev) => [
    ...prev.filter((r) => r.source === "manual"),
    ...mapped,
  ]);

  try {
    localStorage.setItem("cs2_items", JSON.stringify(clean));
  } catch {}
}


return (
  <div className="mx-auto max-w-6xl p-6 space-y-6">
{/* Import from Steam */}
<div className="rounded-2xl border border-border bg-surface/60 p-4">
  <div className="mb-3 flex items-center justify-between">
    <h3 className="text-base font-semibold">Import from Steam</h3>

    <Tooltip
      label={
        <div className="space-y-2">
          <p className="text-text">How to import</p>
          <ul className="list-disc pl-4">
            <li>Upload the JSON exported via bookmarklet or Steam API.</li>
            <li>You can also paste the raw JSON in the <em>Paste JSON</em> tab.</li>
            <li>
              If you see <span className="font-medium">“Fetch failed: 400”</span>,
              open DevTools → Network → Copy response JSON → Paste here.
            </li>
            <li>
              Both file upload and paste automatically add items to your table.
            </li>
          </ul>
        </div>
      }
    >
      <button
        type="button"
        aria-label="Import help"
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface2 text-muted hover:text-text hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      </button>
    </Tooltip>
  </div>

  <ImportWizard onParsed={handleParsed} density="compact" />
</div>



    {/* Top row: Left Manual Add / Right Stats */}
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* Manual add (panel) */}
      <div className="flex h-full flex-col rounded-2xl border border-border bg-surface/60 backdrop-blur p-5 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.6)]">
        <div className="mb-2 flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
          <h3 className="text-base font-semibold">Search &amp; add item</h3>
        </div>
        <p className="mb-4 text-sm text-muted">
          Type the base name (without wear). Choose wear, optional float/pattern, set quantity, then add.
        </p>

          <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-12">
            <div className="md:col-span-5">
              <label className="mb-1 block text-[11px] tracking-wide text-muted">Item</label>
              <div className="relative">
                <input
                  className="h-12 w-full rounded-xl border border-border bg-surface2 px-3 pr-9 text-sm placeholder:text-muted outline-none ring-0 focus:border-accent/60 focus:ring-2 focus:ring-accent/30 transition"
                  placeholder="AK-47 | Redline"
                  value={mName}
                  onChange={(e) => setMName(e.target.value)}
                  list="item-suggestions"
                />
                <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21 21-4.35-4.35"></path><circle cx="11" cy="11" r="7"></circle></svg>
              </div>
              <datalist id="item-suggestions">
                {autoNames.map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
            </div>

            <div className="md:col-span-3">
              <label className="mb-1 block text-[11px] tracking-wide text-muted">
                Wear {isNonWearCategory(stripNone(mName || "")) && <span className="text-muted">(n/a)</span>}
              </label>
              <select
                className={`h-12 w-full appearance-none rounded-xl border border-border bg-surface2 px-3 text-sm outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/30 transition ${isNonWearCategory(stripNone(mName || "")) ? "opacity-50" : ""}`}
                value={mWear}
                onChange={(e) => setMWear(e.target.value as any)}
                disabled={isNonWearCategory(stripNone(mName || ""))}
              >
                {WEAR_OPTIONS.map((w) => (
                  <option key={w.code} value={w.code}>
                    {w.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-[11px] tracking-wide text-muted">Float (note)</label>
              <input
                className="h-12 w-full rounded-xl border border-border bg-surface2 px-3 text-sm placeholder:text-muted outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/30 transition"
                placeholder="0.1234"
                value={mFloat}
                onChange={(e) => setMFloat(e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-[11px] tracking-wide text-muted">Pattern (note)</label>
              <input
                className="h-12 w-full rounded-xl border border-border bg-surface2 px-3 text-sm placeholder:text-muted outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/30 transition"
                placeholder="123"
                value={mPattern}
                onChange={(e) => setMPattern(e.target.value)}
              />
            </div>

            <div className="md:col-span-12">
              <div className="flex flex-wrap items-center gap-3">
                <div className="w-44">
                  <label className="mb-1 block text-[11px] tracking-wide text-muted">Quantity</label>
                  <div className="flex h-12 items-stretch overflow-hidden rounded-xl border border-border bg-surface2">
                    <button
                      type="button"
                      onClick={() => setMQty((q) => Math.max(1, q - 1))}
                      className="px-3 text-muted hover:bg-surface"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <div className="flex min-w-[3.25rem] flex-1 items-center justify-center text-sm">
                      {mQty}
                    </div>
                    <button
                      type="button"
                      onClick={() => setMQty((q) => q + 1)}
                      className="px-3 text-muted hover:bg-surface"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  onClick={addManual}
                  disabled={!mName.trim()}
                  className="btn-accent h-12 flex-1 disabled:opacity-60"
                >
                  <span className="inline-flex w-full items-center justify-center gap-2 font-medium">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                    Add
                  </span>
                </button>
              </div>

              <p className="mt-2 text-xs text-muted">
                Pricing uses only <span className="font-medium">Item name + Wear</span>. Float/Pattern are for display.
              </p>
            </div>
          </div>
        </div>

        {/* Stats panel */}
        <div className="relative rounded-2xl border border-border bg-surface/60 backdrop-blur p-5 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.6)]">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold">Stats</h3>
            <button
              type="button"
              title="Refresh prices now (Skinport & Steam)"
              onClick={handleManualRefresh}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface2 hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30"
              aria-label="Refresh prices"
            >
              <svg className={["h-4 w-4", refreshing ? "animate-spin" : ""].join(" ")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-3-6.7" />
                <path d="M21 3v6h-6" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-surface2/60 p-3">
              <div className="text-xs uppercase tracking-wide text-muted">Total items</div>
              <div className="mt-1 text-2xl font-semibold">{totals.totalItems}</div>
            </div>

            <div className="rounded-xl border border-border bg-surface2/60 p-3">
              <div className="text-xs uppercase tracking-wide text-muted">Steam − Skinport</div>
              <div className={`mt-1 text-2xl font-semibold ${totals.totalSteam - totals.totalSkinport >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                A${(totals.totalSteam - totals.totalSkinport).toFixed(2)}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface2/60 p-3">
              <div className="text-xs uppercase tracking-wide text-muted">Skinport total</div>
              <div className="mt-1 text-xl font-medium">A${totals.totalSkinport.toFixed(2)}</div>
              <div className="mt-1 text-xs text-muted">
                {rows.filter((r) => typeof r.skinportAUD === "number").length}/{rows.length} priced • {formatTime(skinportUpdatedAt)}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface2/60 p-3">
              <div className="text-xs uppercase tracking-wide text-muted">Steam total</div>
              <div className="mt-1 text-xl font-medium">A${totals.totalSteam.toFixed(2)}</div>
              <div className="mt-1 text-xs text-muted">
                {rows.filter((r) => typeof r.steamAUD === "number").length}/{rows.length} priced • {formatTime(steamUpdatedAt)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sort toolbar */}
      <div className="mt-4 mb-2 flex flex-wrap items-center gap-2 text-sm">
        <span className="mr-1 text-muted">Sort:</span>
        <SortChip k="item" label="Item" />
        <SortChip k="wear" label="Exterior" />
        <SortChip k="pattern" label="Pattern" />
        <SortChip k="float" label="Float" />
        <SortChip k="qty" label="Qty" />
        <SortChip k="skinport" label="Skinport" />
        <SortChip k="steam" label="Steam" />
      </div>

      {/* DESKTOP/TABLET TABLE */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-border touch-pan-x">
        <table className="min-w-[920px] w-full text-sm">
          <thead className="bg-surface/60">
            <tr>
              <th className="px-4 py-2 text-left">Item</th>
              <th className="px-4 py-2 text-right">Qty</th>
              <th className="px-4 py-2 text-right">Skinport (AUD)</th>
              <th className="px-4 py-2 text-right">Steam (AUD)</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted">
                  No items yet. Use <span className="underline">Search &amp; add item</span> or import from Steam.
                </td>
              </tr>
            ) : (
              sorted.map((r) => {
                const orig = origIndexMap.get(r)!;
                return (
                  <tr key={r.market_hash_name + "|" + orig} className="border-top border-border">
                    {/* ITEM */}
                    <td className="px-4 py-2">
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
                            className="h-10 w-10 rounded object-contain bg-surface2"
                          />
                        ) : (
                          <img src={FALLBACK_DATA_URL} alt="" className="h-10 w-10 rounded object-contain" />
                        )}
                        <div className="min-w-0">
                          <div className="truncate font-medium" title={r.market_hash_name}>
                            {r.nameNoWear}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {wearLabelForRow(r.wear as WearCode) && <Pill>{wearLabelForRow(r.wear as WearCode)}</Pill>}
                            {r.pattern && <Pill>Pattern: {r.pattern}</Pill>}
                            {r.float && <Pill>Float: {r.float}</Pill>}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* QTY */}
                    <td className="px-4 py-2 text-right tabular-nums">{r.quantity ?? 1}</td>

                    {/* SKINPORT */}
                    <td className="px-4 py-2">
                      <div className="text-right leading-tight">
                        <div>{typeof r.skinportAUD === "number" ? `A$${r.skinportAUD.toFixed(2)}` : "—"}</div>
                        {typeof r.skinportAUD === "number" && (r.quantity ?? 1) > 1 && (
                          <div className="mt-0.5 text-[11px] text-muted">
                            ×{r.quantity ?? 1} = <span className="tabular-nums">A${(r.skinportAUD * (r.quantity ?? 1)).toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* STEAM */}
                    <td className="px-4 py-2">
                      <div className="text-right leading-tight">
                        <div>{typeof r.steamAUD === "number" ? `A$${r.steamAUD.toFixed(2)}` : "—"}</div>
                        {typeof r.steamAUD === "number" && (r.quantity ?? 1) > 1 && (
                          <div className="mt-0.5 text-[11px] text-muted">
                            ×{r.quantity ?? 1} = <span className="tabular-nums">A${(r.steamAUD * (r.quantity ?? 1)).toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* ACTIONS */}
                    <td className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-surface2 text-muted hover:bg-surface"
                          title="Edit"
                          onClick={() => {
                            setEditRow(r);
                            setEditOpen(true);
                          }}
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                          </svg>
                        </button>

                        <button
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-surface2 text-muted hover:bg-surface"
                          title="Delete"
                          onClick={() => removeRow(orig)}
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6M14 11v6" />
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARD LIST */}
      <div className="space-y-3 md:hidden">
        {sorted.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface/40 p-4 text-center text-muted">
            No items yet. Use <span className="underline">Search &amp; add item</span> or import from Steam.
          </div>
        ) : (
          sorted.map((r) => <RowCard key={r.market_hash_name + "|card"} r={r} />)
        )}
      </div>

      {/* Edit dialog */}
      <EditRowDialog
        open={editOpen}
        row={editRow}
        onClose={() => setEditOpen(false)}
        onSave={(next) => {
          setRows((prev) => prev.map((r) => (r === editRow ? next : r)));
        }}
        spMap={spMap}
      />

      {/* Back to top */}
      <button
        type="button"
        aria-label="Back to top"
        onClick={scrollToTop}
        className={[
          "fixed bottom-6 right-6 z-50 rounded-full bg-surface/90 shadow-lg shadow-black/40",
          "backdrop-blur px-4 h-12 inline-flex items-center gap-2 text-text",
          "border border-border hover:bg-surface2 transition-all duration-200",
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

