"use client";

import { useEffect, useState } from "react";

type Item = {
  id: string;
  name: string;
  exterior?: string;
  icon?: string;
};

export default function DashboardPage() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("portfolio_items");
      setItems(raw ? JSON.parse(raw) : []);
    } catch {
      setItems([]);
    }
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-bold">Your Portfolio</h1>
      <p className="mt-2 text-white/70">Imported items are stored locally for now.</p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-white/10">
        <table className="min-w-full text-sm">
          <thead className="bg-white/[0.04]">
            <tr>
              <th className="px-4 py-3 text-left">Item</th>
              <th className="px-4 py-3 text-left">Exterior</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-white/60" colSpan={2}>
                  No items yet. Try the <a className="text-amber-400 underline" href="/import">Import</a> page.
                </td>
              </tr>
            )}
            {items.map((it) => (
              <tr key={it.id} className="border-t border-white/10">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {it.icon ? <img src={it.icon} alt="" className="h-10 w-10 rounded" /> : <div className="h-10 w-10 rounded bg-white/10" />}
                    <div className="font-medium">{it.name}</div>
                  </div>
                </td>
                <td className="px-4 py-3">{it.exterior || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
