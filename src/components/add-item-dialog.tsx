"use client";

import { useEffect, useState } from "react";
import type { Item } from "@/lib/types";

export default function AddItemDialog({ open, onClose, onAdd }:
  { open: boolean; onClose: () => void; onAdd: (items: Item[]) => void }) {

  const [name, setName] = useState("");
  const [exterior, setExterior] = useState("FN");
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState<number | ''>('');

  useEffect(() => {
    if (!open) {
      setName(""); setExterior("FN"); setQty(1); setPrice('');
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border border-neutral-800 bg-neutral-900/90 backdrop-blur p-4 space-y-3">
        <div className="text-lg font-medium">Add item</div>
        <input
          className="w-full rounded-md bg-neutral-900/60 border border-neutral-800 px-3 py-2 text-sm outline-none focus:border-neutral-600"
          placeholder="Item name (market_hash_name)"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <div className="flex gap-2">
          <select
            className="rounded-md bg-neutral-900/60 border border-neutral-800 px-3 py-2 text-sm flex-1"
            value={exterior}
            onChange={e => setExterior(e.target.value)}
          >
            {["FN","MW","FT","WW","BS"].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <input
            type="number"
            min={1}
            className="rounded-md bg-neutral-900/60 border border-neutral-800 px-3 py-2 text-sm w-28"
            value={qty}
            onChange={e => setQty(parseInt(e.target.value || "1", 10))}
          />
          <input
            type="number"
            step="0.01"
            className="rounded-md bg-neutral-900/60 border border-neutral-800 px-3 py-2 text-sm w-32"
            placeholder="Median $"
            value={price}
            onChange={e => setPrice(e.target.value === "" ? "" : parseFloat(e.target.value))}
          />
        </div>
        <div className="flex items-center justify-end gap-2">
          <button onClick={onClose} className="rounded-md bg-white/10 px-3 py-2 text-sm hover:bg-white/15">Cancel</button>
          <button
            onClick={() => {
              if (!name.trim()) return;
              const icon = "https://community.cloudflare.steamstatic.com/economy/image/IzFakeDemoHash/64fx64f";
              onAdd([{ name, exterior, icon, qty, priceMedian: typeof price === 'number' ? price : undefined }]);
              onClose();
            }}
            className="rounded-md bg-white px-3 py-2 text-sm text-black hover:bg-neutral-200"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
