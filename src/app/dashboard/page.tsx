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

// choose storage based on auth mode
function getStorage(): Storage {
  if (typeof window === "undefined") return localStorage as unknown as Storage;
  const guest = sessionStorage.getItem("auth_mode") === "guest";
  // if guest flag found, use sessionStorage; else persist to localStorage
  return guest ? sessionStorage : localStorage;
}

function readList(): Item[] {
  try {
    return JSON.parse(getStorage().getItem("portfolio_items") || "[]");
  } catch {
    return [];
  }
}
function writeList(items: Item[]) {
  getStorage().setItem("portfolio_items", JSON.stringify(items));
}
function uid() {
  return "manual-" + Math.random().toString(36).slice(2, 9);
}

export default function DashboardPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [mode, setMode] = useState<"guest" | "user">("user");

  // import state...
  const [loadingImport, setLoadingImport] = useState(false);
  const [importId, setImportId] = useState("");
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [importErr, setImportErr] = useState<string | null>(null);

  // manual add...
  const [name, setName] = useState("");
  const [exterior, setExterior] = useState("");
  const [icon, setIcon] = useState("");
  const [qty, setQty] = useState(1);

  useEffect(() => {
    // detect mode (guest stored in sessionStorage, user stored in localStorage)
    const isGuest = typeof window !== "undefined" && sessionStorage.getItem("auth_mode") === "guest";
    setMode(isGuest ? "guest" : "user");
    setItems(readList());
  }, []);

  const totalQty = useMemo(() => items.reduce((n, i) => n + (i.qty || 1), 0), [items]);

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    setImportMsg(null);
    setImportErr(null);
    setLoadingImport(true);
    try {
      const res = await fetch(`/api/inventory?id=${encodeURIComponent(importId)}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to import");

      const imported: Item[] = (data.items || []).map((it: any) => ({
        id: it.id,
        name: it.name,
        exterior: it.exterior,
        icon: it.icon,
        qty: 1,
        source: "steam" as const,
      }));

      const byId = new Map<string, Item>();
      [...items, ...imported].forEach((i) => byId.set(i.id, i));
      const next = Array.from(byId.values());
      setItems(next);
      writeList(next);
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
      {mode === "guest" && (
        <div className="mb-4 rounded-md border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-300">
          Guest mode — items will be cleared when you close this page.{" "}
          <a href="/" className="underline">Create an account</a> to save permanently.
        </div>
      )}

      {/* ...the rest of your dashboard UI stays the same (import+manual forms, table, etc.) */}
      {/* keep your existing JSX below */}


