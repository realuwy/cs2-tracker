"use client";

import { useEffect, useMemo, useState } from "react";

type Item = {
  id: string;
  name: string;
  exterior?: string;
  icon?: string;
  qty?: number;
  source?: "steam" | "manual";
};

// decide storage per call based on guest flag
function getStore() {
  const isGuest =
    typeof window !== "undefined" && sessionStorage.getItem("guest") === "1";
  return {
    isGuest,
    read(): Item[] {
      try {
        const raw = isGuest
          ? sessionStorage.getItem("portfolio_items")
          : localStorage.getItem("portfolio_items");
        return JSON.parse(raw || "[]");
      } catch {
        return [];
      }
    },
    write(items: Item[]) {
      const json = JSON.stringify(items);
      if (isGuest) sessionStorage.setItem("portfolio_items", json);
      else localStorage.setItem("portfolio_items", json);
    },
  };
}

function uid() {
  return "manual-" + Math.random().toString(36).slice(2, 9);
}

export default function DashboardPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loadingImport, setLoadingImport] = useState(false);
  const [importId, setImportId] = useState("");
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [importErr, setImportErr] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);

  // manual add fields
  const [name, setName] = useState("");
  const [exterior, setExterior] = useState("");
  const [icon, setIcon] = useState("");
  const [qty, setQty] = useState(1);

  useEffect(() => {
    const store = getStore();
    setIsGuest(store.isGuest);
    setItems(store.read());
  }, []);

  const totalQty = useMemo(
    () => items.reduce((n, i) => n + (i.qty || 1), 0),
    [items]
  );

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    setImportMsg(null);
    setImportErr(null);
    setLoadingImport(true);
    try {
      const res = await fetch(
        `/api/inventory?id=${encodeURIComponent(importId)}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to import");

      const store = getStore();
      const existing = store.read();
      const imported: Item[] = (data.items || []).map((it: any) => ({
        id: it.id,
        name: it.name,
        exterior: it.exterior,
        icon: it.icon,
        qty: 1,
        source: "steam" as const,
      }));

      const byId = new Map<string, Item>();
      [...existing, ...imported].forEach((i) => byId.set(i.id, i));
      const next = Array.from(byId.values());
      setItems(next);
      store.write(next);
      setImportMsg(`Imported ${data.count} items.`);
    } catch (err: any) {
      setImportErr(err?.message || "Something went wrong");
    } finally {
      setLoadingImport(false);
    }
  }

  function addManual(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const store = getStore();
    const next: Item[] = [
      ...items,
      {
        id: uid(),
        name: name.trim(),
        exterior: exterior.trim(),
        icon: icon.trim(),
        qty: Math.max(1, Number(qty) || 1),
        source: "manual" as const,
      },
    ];
    setItems(next);
    store.write(next);
    setName("");
    setExterior("");
    setIcon("");
    setQty(1);
  }

  function remove(id: string) {
    const store = getStore();
    const next = items.filter((i) => i.id !== id);
    setItems(next);
    store.write(next);
  }

  function clearAll() {
    const store = getStore();
    setItems([]);
    store.write([]);
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Your Portfolio</h1>
          <p className="mt-1 text-white/70">
            Steam imports + manual items shown here.
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm">
          Total items: <span className="font-semibold">{totalQty}</span>
        </div>
      </div>

      {isGuest && (
        <div className="mt-4 rounded-md border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-200">
          Guest mode: items are temporary and clear when you close the page.
          <span className="ml-2 opacity-80">
            Create an account on the home page to save them.
          </span>
        </div>
      )}

      {/* Add / Import section */}
      <section id="add-items" className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Import from Steam */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h2 className="mb-3 text-lg font-semibold">Import from Steam</h2>
          <form onSubmit={handleImport} className="mt-3 flex gap-2">
            <input
              value={importId}
              onChange={(e) => setImportId(e.target.value)}
              placeholder="SteamID64 or /profiles/<id>"
              className="flex-1 rounded-md border border-white/10 bg-black/30 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button
              disabled={loadingImport || !importId.trim()}
              className="rounded-md bg-amber-500 px-4 font-semibold text-black disabled:opacity-50"
            >
              {loadingImport ? "Importing…" : "Import"}
            </button>
          </form>
          {importMsg && (
            <div className="mt-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-2 text-sm">
              {importMsg}
            </div>
          )}
          {importErr && (
            <div className="mt-3 rounded-md border border-red-500/30 bg-red-500/10 p-2 text-sm">
              {importErr}
            </div>
          )}
        </div>

        {/* Manual add */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h2 className="mb-3 text-lg font-semibold">Add manual item</h2>
          <form onSubmit={addManual} className="grid grid-cols-1 gap-2 sm:grid-cols-5">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Item name"
              className="rounded-md border border-white/10 bg-black/30 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-400 sm:col-span-2"
            />
            <input
              value={exterior}
              onChange={(e) => setExterior(e.target.value)}
              placeholder="Exterior (FN/MW/FT/WW/BS)"
              className="rounded-md border border-white/10 bg-black/30 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-400"
            />
            <input
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="Icon URL (optional)"
              className="rounded-md border border-white/10 bg-black/30 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-400"
            />
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              placeholder="Qty"
              className="rounded-md border border-white/10 bg-black/30 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button className="rounded-md bg-amber-500 px-4 font-semibold text-black hover:bg-amber-400">
              Add
            </button>
          </form>
        </div>
      </section>

      {/* Table */}
      <div className="mt-6 overflow-x-auto rounded-xl border border-white/10">
        <table className="min-w-full text-sm">
          <thead className="bg-white/[0.04]">
            <tr>
              <th className="px-4 py-3 text-left">Item</th>
              <th className="px-4 py-3 text-left">Exterior</th>
              <th className="px-4 py-3 text-left">Qty</th>
              <th className="px-4 py-3 text-left">Source</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-white/60" colSpan={5}>
                  No items yet. Use <a className="text-amber-400 underline" href="#add-items">Add items</a>.
                </td>
              </tr>
            )}
            {items.map((it) => (
              <tr key={it.id} className="border-top border-white/10">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {it.icon ? <img src={it.icon} alt="" className="h-10 w-10 rounded" /> : <div className="h-10 w-10 rounded bg-white/10" />}
                    <div className="font-medium">{it.name}</div>
                  </div>
                </td>
                <td className="px-4 py-3">{it.exterior || "—"}</td>
                <td className="px-4 py-3">{it.qty || 1}</td>
                <td className="px-4 py-3 capitalize">{it.source || "—"}</td>
                <td className="px-4 py-3">
                  <button onClick={() => remove(it.id)} className="rounded-md bg-white/10 px-3 py-1 hover:bg-white/15">
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {items.length > 0 && (
        <div className="mt-4">
          <button onClick={clearAll} className="rounded-md border border-white/10 px-3 py-1 text-sm text-white/70 hover:bg-white/5">
            Clear all
          </button>
        </div>
      )}
    </main>
  );
}

