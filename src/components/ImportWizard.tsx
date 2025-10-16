// src/components/ImportWizard.tsx
"use client";

import { useRef, useState } from "react";

type Props = {
  /** Gets the parsed object (array of items, {items: [...]}, or raw Steam JSON). */
  onParsed: (data: any) => void;
};

export default function ImportWizard({ onParsed }: Props) {
  const [tab, setTab] = useState<"upload" | "paste">("upload");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function handleFilePick(f: File) {
    setError(null);
    try {
      const content = await f.text();
      const json = safeParseJSON(content);
      if (!json) throw new Error("Could not parse JSON file.");
      onParsed(json);
    } catch (e: any) {
      setError(e?.message || "Failed to import file.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function handlePasteImport() {
    setError(null);
    try {
      // Accept plain array, {items}, {rows}, {inventory}, or raw Steam JSON.
      const json = safeParseJSON(text);
      if (!json) throw new Error("Invalid JSON (couldn’t parse).");
      onParsed(json);
    } catch (e: any) {
      setError(e?.message || "Failed to parse pasted JSON.");
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold">Import from Steam</h3>

        <div className="inline-flex overflow-hidden rounded-lg border border-border">
          <button
            type="button"
            className={[
              "px-3 py-1 text-sm",
              tab === "upload" ? "bg-surface2 text-text" : "text-muted hover:bg-surface/60",
            ].join(" ")}
            onClick={() => setTab("upload")}
          >
            Upload file
          </button>
          <button
            type="button"
            className={[
              "px-3 py-1 text-sm border-l border-border",
              tab === "paste" ? "bg-surface2 text-text" : "text-muted hover:bg-surface/60",
            ].join(" ")}
            onClick={() => setTab("paste")}
          >
            Paste JSON
          </button>
        </div>
      </div>

      {tab === "upload" ? (
        <div className="space-y-2">
          <p className="text-sm text-muted">
            Upload the JSON you exported (via bookmarklet or Steam API dump). We’ll parse the items and add them to your table.
          </p>

          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="block w-full rounded-lg border border-border bg-surface2 p-2 text-sm"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFilePick(f);
            }}
          />
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-muted">
            Paste your inventory JSON here. Supports raw Steam <code>assets/descriptions</code>, arrays, or objects with{" "}
            <code>items</code>/<code>rows</code>/<code>inventory</code>.
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
            placeholder='{"assets":[...],"descriptions":[...]}  or  {"items":[...]}  or  [{"name":"..."}]'
            className="h-40 w-full resize-y rounded-lg border border-border bg-surface2 p-3 font-mono text-xs"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setText("")}
              className="rounded-lg border border-border bg-surface2 px-3 py-1.5 text-sm hover:bg-surface"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handlePasteImport}
              disabled={!text.trim()}
              className="btn-accent px-4 py-1.5 text-sm disabled:opacity-60"
            >
              Parse &amp; Import
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="mt-3 text-xs text-muted">
        Tip: If Steam shows a <strong>“Fetch failed: 400”</strong> popup, copy the JSON from your console or API response
        and use the <em>Paste JSON</em> tab.
      </div>
    </div>
  );
}

function safeParseJSON(s: string): any | null {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
