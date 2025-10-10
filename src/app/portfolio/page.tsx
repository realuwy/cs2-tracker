"use client";

import { useEffect, useState } from "react";
import { Item } from "@/lib/types";
import { readGuestPortfolio, saveGuestPortfolio } from "@/lib/portfolio-store";
import AddItemDialog from "@/components/add-item-dialog";
import { PriceChangePills } from "@/components/price-change-pills";

export default function PortfolioPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setItems(readGuestPortfolio());
  }, []);

  const total = items.reduce((s, it) => s + (it.priceMedian ?? 0) * (it.qty ?? 1), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your Portfolio (guest)</h1>
        <button onClick={() => setOpen(true)} className="rounded-md bg-white/10 px-3 py-2 text-sm hover:bg-white/15">Add items</button>
      </div>

      <div className="rounded-lg border border-neutral-800 p-4 bg-neutral-900/40">
        <div className="text-sm text-neutral-400">Total value (median)</div>
        <div className="text-2xl font-semibold">${total.toFixed(2)}</div>
      </div>

      <div className="space-y-2">
        {items.length === 0 && <div className="text-neutral-400 text-sm">No items yet. Click “Add items”.</div>}
        {items.map((it, idx) => (
          <div key={idx} className="flex items-center justify-between border border-neutral-800 rounded-md p-3">
            <div className="flex items-center gap-3">
              <img src={it.icon} width={40} height={40} className="rounded" alt="" />
              <div>
                <div className="text-sm font-medium">{it.name}</div>
                <div className="text-xs text-neutral-400">{it.exterior}</div>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div>Qty: <span className="font-medium">{it.qty ?? 1}</span></div>
              <div>Median: <span className="font-medium">${(it.priceMedian ?? 0).toFixed(2)}</span></div>
              <PriceChangePills d1h={it.delta1h} d24h={it.delta24h} d30d={it.delta30d} />
            </div>
          </div>
        ))}
      </div>

      <AddItemDialog open={open} onClose={() => setOpen(false)} onAdd={(newItems) => {
        const next = [...items, ...newItems];
        setItems(next);
        saveGuestPortfolio(next);
      }} />
    </div>
  );
}
