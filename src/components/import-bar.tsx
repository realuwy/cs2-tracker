"use client";

import { useState } from "react";

export default function ImportBar() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleImport() {
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch("/api/inventory", { method: "POST", body: JSON.stringify({ url }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Import failed");
      setResult(`Imported ${data.items.length} item(s). Go to Portfolio to save them.`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-2">
      <input
        value={url}
        onChange={e => setUrl(e.target.value)}
        placeholder="Paste your Steam profile URL or SteamID64"
        className="flex-1 rounded-md bg-neutral-900/60 border border-neutral-800 px-3 py-2 text-sm outline-none focus:border-neutral-600"
      />
      <button onClick={handleImport} disabled={loading || !url} className="rounded-md bg-white/10 hover:bg-white/15 px-4 text-sm">
        {loading ? "Importing..." : "Import"}
      </button>
      {result && <div className="text-sm text-emerald-400">{result}</div>}
      {error && <div className="text-sm text-red-400">{error}</div>}
    </div>
  );
}
