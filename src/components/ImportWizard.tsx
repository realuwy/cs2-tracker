"use client";

import { useRef, useState } from "react";

/** Minimal, single-card import wizard with Upload / Paste tabs + compact help tooltip. */
type Props = {
  onParsed: (data: any) => void;
  density?: "normal" | "compact";
};

export default function ImportWizard({ onParsed, density = "compact" }: Props) {
  const [tab, setTab] = useState<"file" | "paste">("file");
  const [jsonText, setJsonText] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function parseAndSend(raw: any) {
    try {
      // Accept: raw Steam dump ({assets,descriptions}), arrays, or objects with items/rows/inventory
      const data =
        typeof raw === "string" ? JSON.parse(raw) : raw;
      onParsed(data);
      if (tab === "paste") setJsonText("");
    } catch (e) {
      alert("Invalid JSON. Please check and try again.");
      console.error(e);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const text = await f.text();
    await parseAndSend(text);
    // reset input so same file can be selected again if needed
    if (inputRef.current) inputRef.current.value = "";
  }

  const compact = density === "compact";

  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-4">
      {/* Header: title + controls */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold">Import</h3>

        <div className="flex items-center gap-2">
          {/* Segmented control */}
          <div className="inline-flex overflow-hidden rounded-lg border border-border">
            <button
              type="button"
              onClick={() => setTab("file")}
              className={[
                "px-3 py-1.5 text-sm",
                tab === "file" ? "bg-surface2 text-text" : "text-muted hover:bg-surface/60",
              ].join(" ")}
            >
              Upload
            </button>
            <button
              type="button"
              onClick={() => setTab("paste")}
              className={[
                "px-3 py-1.5 text-sm",
                tab === "paste" ? "bg-surface2 text-text" : "text-muted hover:bg-surface/60",
              ].join(" ")}
            >
              Paste JSON
            </button>
          </div>

          {/* Help tooltip */}
          <div className="relative">
            <button
              type="button"
              aria-label="Import help"
              className="h-8 w-8 rounded-lg border border-border bg-surface2 text-muted hover:bg-surface"
              onMouseEnter={(e) => {
                (e.currentTarget.nextSibling as HTMLDivElement)?.classList.remove("opacity-0", "pointer-events-none", "translate-y-1");
              }}
              onMouseLeave={(e) => {
                (e.currentTarget.nextSibling as HTMLDivElement)?.classList.add("opacity-0", "pointer-events-none", "translate-y-1");
              }}
            >
              {/* i icon */}
              <svg viewBox="0 0 24 24" className="mx-auto h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8h.01M11 12h2v4h-2z" />
              </svg>
            </button>
            <div className="absolute right-0 z-20 mt-2 w-[22rem] rounded-xl border border-border bg-surface p-3 text-sm leading-5 shadow-xl transition-all duration-150 opacity-0 pointer-events-none translate-y-1">
              <div className="mb-1 font-medium">Import tips</div>
              <ul className="list-disc pl-5 text-muted">
                <li>Upload your Steam bookmarklet export or Steam API dump.</li>
                <li>If you see <span className="font-medium">“Fetch failed: 400”</span> on Steam, open the browser console, copy the JSON from the response, then use <span className="italic">Paste JSON</span>.</li>
                <li>We accept raw Steam <code>{`{ assets, descriptions }`}</code>, arrays, or objects with <code>items</code>/<code>rows</code>/<code>inventory</code>.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      {tab === "file" ? (
        <div className="space-y-2">
          {!compact && (
            <p className="text-sm text-muted">
              Upload your JSON export. We’ll parse the items and add them to your table.
            </p>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="application/json,.json"
            className="w-full rounded-xl border border-border bg-surface2 px-3 py-2"
            onChange={handleFileChange}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {!compact && (
            <p className="text-sm text-muted">
              Paste your inventory JSON. Supports raw Steam dumps or arrays.
            </p>
          )}
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            className="min-h-[160px] w-full rounded-xl border border-border bg-surface2 p-3 font-mono text-sm"
            placeholder={`{ "assets": [...], "descriptions": [...] }  \n— or —\n{ "items": [...] }  \n— or —\n[ { "name": "..." } ]`}
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              className="rounded-lg border border-border bg-surface2 px-3 py-2 text-sm hover:bg-surface"
              onClick={() => setJsonText("")}
            >
              Clear
            </button>
            <button
              type="button"
              className="btn-accent px-4 py-2 text-sm"
              onClick={() => parseAndSend(jsonText)}
              disabled={!jsonText.trim()}
            >
              Parse &amp; Import
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
