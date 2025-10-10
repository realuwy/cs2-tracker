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

function readList(): Item[] {
  try {
    return JSON.parse(localStorage.getItem("portfolio_items") || "[]");
  } catch {
    return [];
  }
}
function writeList(items: Item[]) {
  localStorage.setItem("portfolio_items", JSON.stringify(items));
}
function uid() {
  return "manual-" + Math.random().toString(36).slice(2, 9);
}

export default function DashboardPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [name, setName] = useState("");
  const [exterior, setExterior] = useState("");
  const [icon, setIcon] = useState("");
  const [qty, setQty] = useState(1);

  useEffect(() => {
    setItems(readList());
  }, []);

  const totalQty = useMemo(() => items.reduce((n, i) => n + (i.qty || 1), 0), [items]);

  function addManual(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const next = [
      ...items,
      {
        id: uid(),
        name: name.trim(),
        exterior: exterior.trim(),
        icon: icon.trim(),
        qty: Math.max(1, Number(qty) || 1),
        source: "manual",
      },
    ];
    setItems(next);
    writeList(next);
    setName("");
    setExterior("");
    setIcon("");
    setQty(1);
  }

  function remove(id: string) {
    const next = items.filter((i) => i.id !== id);
    setItems(next);
    writeList(next);
  }

  function clearAll() {
    setItems([]);
    writeList([]);
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Your Portfolio</h1>
          <p className="mt-1 text-white/70">Imported + manual items shown here.</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm">
          Total items: <span className="font-semibold">{totalQty}</span>
        </div>
      </div>

      {/* Add manual item inline */}
      <form onSubmit={addManual} className="mt-6 grid grid-cols-1 gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Item name (e.g., AK-47 | Redline)"
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
                  No items yet. Use <a className="text-amber-400 underline" href="/import">Import</a> or add manually above.
                </td>
              </tr>
            )}
            {items.map((it) => (
              <tr key={it.id} className="border-t border-white/10">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {it.icon ? (
                      <img src={it.icon} alt="" className="h-10 w-10 rounded" />
                    ) : (
                      <div className="h-10 w-10 rounded bg-white/10" />
                    )}
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

