"use client";

import { useState } from "react";

type Item = {
  id: string;
  name: string;
  exterior?: string;
  icon?: string;
  qty?: number;
  source?: "steam" | "manual";
};

export default function ImportPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    setError(null);
    try {
      const res = await fetch(`/api/inventory?id=${encodeURIComponent(input)}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to import");

      const existing = readList();
      // mark imported as steam source, qty default 1
      const imported: Item[] = (data.items || []).map((it: any) => ({
        id: it.id,
        name: it.name,
        exterior: it.exterior,
        icon: it.icon,
        qty: 1,
        source: "steam",
      }));

      // simple dedupe by id
      const byId = new Map<string, Item>();
      [...existing, ...imported].forEach((i) => byId.set(i.id, i));
      writeList(Array.from(byId.values()));

      setMsg(`Imported ${data.count} items. Open your Dashboard to view them.`);
    } catch (e: any) {
      setError(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-bold">Import your Steam Inventory</h1>
      <p className="mt-2 text-white/70">
        Paste your <strong>SteamID64</strong> or a{" "}
        <code className="rounded bg-white/10 px-1">steamcommunity.com/profiles/&lt;id&gt;</code> URL (public
        inventory required).
      </p>

      <form onSubmit={handleImport} className="mt-6 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="76561198XXXXXXXXX or a /profiles/ URL"
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-400"
        />
        <button
          disabled={loading || !input.trim()}
          className="rounded-lg bg-amber-500 px-4 font-semibold text-black disabled:opacity-50"
        >
          {loading ? "Importing…" : "Import"}
        </button>
      </form>

      {msg && <div className="mt-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">{msg}</div>}
      {error && <div className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm">{error}</div>}
    </main>
  );
}

