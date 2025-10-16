"use client";

import { useMemo, useRef, useState } from "react";
import clsx from "clsx";

type ParsedInventory = {
  assets?: any[];
  descriptions?: any[];
  total_inventory_count?: number;
  success?: number;
};

const BOOKMARKLET_JS = `(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));const onSteam=location.hostname.endsWith('steamcommunity.com');if(!onSteam){alert('Open your Steam inventory page first, then click me again.');return}function getSteamId64FromUrl(){const m=/\\/profiles\\/(\\d{17})\\//.exec(location.href);if(m)return m[1];const m2=/\\/id\\/([^\\/?#]+)\\//.exec(location.href);return m2?m2[1]:null}async function resolveVanity(v){try{const res=await fetch(\`https://steamcommunity.com/id/\${v}/?xml=1\`,{credentials:'include'});const txt=await res.text();const m=/<steamID64>(\\d{17})<\\/steamID64>/.exec(txt);return m?m[1]:null}catch{return null}}let sid=getSteamId64FromUrl();if(!sid){sid=prompt('Enter your SteamID64 or vanity ID');if(!sid)return}if(!/^\\d{17}$/.test(sid)){const resolved=await resolveVanity(sid);if(!resolved){alert('Could not resolve vanity ID to SteamID64. Open your profile as /profiles/<id>/inventory and retry.');return}sid=resolved}const appid=730,context=2;let url=\`https://steamcommunity.com/inventory/\${sid}/\${appid}/\${context}?l=english&count=5000\`;let all={success:1,total_inventory_count:0,assets:[],descriptions:[]},guard=0;while(url&&guard<5){const r=await fetch(url,{credentials:'include'});if(!r.ok){alert('Fetch failed: '+r.status);return}const j=await r.json();if(!j||!j.assets){alert('No inventory returned (is it public?)');return}all.assets.push(...(j.assets||[]));all.descriptions.push(...(j.descriptions||[]));all.total_inventory_count=all.assets.length;if(j.more_items&&j.last_assetid){url=\`https://steamcommunity.com/inventory/\${sid}/\${appid}/\${context}?l=english&count=5000&start_assetid=\${j.last_assetid}\`}else{url=null}guard++;await sleep(250)}const blob=new Blob([JSON.stringify(all,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);const ts=new Date().toISOString().replace(/[:.]/g,'-');a.download=\`steam_inventory_730_\${sid}_\${ts}.json\`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(a.href);alert('Inventory JSON downloaded. Import it in CS2 Tracker → Upload Inventory.');})();`;

export default function ImportWizard({
  onParsed,
}: {
  onParsed: (data: ParsedInventory) => void;
}) {
  const [tab, setTab] = useState<"upload" | "quick">("upload");
  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus] = useState<null | { kind: "ok" | "err"; msg: string }>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bookmarkletHref = useMemo(
    () => `javascript:${encodeURIComponent(BOOKMARKLET_JS)}`,
    []
  );

  async function parseFile(file: File) {
    setStatus(null);
    try {
      const text = await file.text();
      const json: ParsedInventory = JSON.parse(text);
      if (!json || !Array.isArray(json.assets) || !Array.isArray(json.descriptions)) {
        throw new Error("Invalid format: missing assets/descriptions.");
      }
      const count = json.total_inventory_count ?? json.assets.length ?? 0;
      setStatus({ kind: "ok", msg: `Imported ${count} item(s).` });
      setPreview(makePreview(json));
      onParsed(json);
    } catch (e: any) {
      setStatus({ kind: "err", msg: e?.message || "Failed to parse JSON." });
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) parseFile(f);
  }

  function makePreview(json: ParsedInventory) {
    const lookup = new Map<string, any>();
    json.descriptions?.forEach((d: any) => {
      lookup.set(`${d.classid}_${d.instanceid || "0"}`, d);
    });
    const items = (json.assets || []).slice(0, 6).map((a: any) => {
      const key = `${a.classid}_${a.instanceid || "0"}`;
      const d = lookup.get(key);
      const wearTag = d?.tags?.find((t: any) => t.category === "Exterior");
      const name = d?.market_hash_name || d?.name || "(Unknown)";
      return { name, wear: wearTag?.localized_tag_name || "", classid: a.classid, assetid: a.assetid };
    });
    return items;
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="mb-4 grid grid-cols-2 gap-2">
        <button
          className={clsx(
            "rounded-xl px-3 py-2 text-sm",
            tab === "upload" ? "bg-lime-500 text-black" : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
          )}
          onClick={() => setTab("upload")}
        >
          Upload JSON (Drag & Drop)
        </button>
        <button
          className={clsx(
            "rounded-xl px-3 py-2 text-sm",
            tab === "quick" ? "bg-lime-500 text-black" : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
          )}
          onClick={() => setTab("quick")}
        >
          Quick Import (Bookmark Button)
        </button>
      </div>

      {tab === "upload" && (
        <div>
          <div
            className={clsx(
              "mb-3 flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed text-center",
              dragOver ? "border-lime-500 bg-lime-500/10" : "border-zinc-700 bg-zinc-950/40"
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            aria-label="Upload inventory JSON"
          >
            <div className="text-sm text-zinc-300">
              Drop your <span className="font-semibold">steam_inventory_730_*.json</span> here<br />
              or <span className="underline">click to select a file</span>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) parseFile(f);
            }}
          />

          {status && (
            <div
              className={clsx(
                "mt-3 rounded-lg px-3 py-2 text-sm",
                status.kind === "ok" ? "bg-green-900/30 text-green-300" : "bg-red-900/30 text-red-300"
              )}
            >
              {status.msg}
            </div>
          )}

          {preview.length > 0 && (
            <div className="mt-4">
              <div className="mb-2 text-xs text-zinc-400">Preview (first few items)</div>
              <ul className="divide-y divide-zinc-800 overflow-hidden rounded-xl border border-zinc-800">
                {preview.map((it, i) => (
                  <li key={i} className="grid grid-cols-2 gap-2 bg-zinc-950/50 px-3 py-2 text-sm text-zinc-200">
                    <span className="truncate">{it.name}</span>
                    <span className="text-right text-zinc-400">{it.wear}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {tab === "quick" && (
        <div className="space-y-3">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 text-sm text-zinc-300">
            <ol className="list-inside list-decimal space-y-1">
              <li>Open your Steam inventory: <span className="text-zinc-100">steamcommunity.com → Profile → Inventory → CS2</span></li>
              <li>Drag the button below to your bookmarks bar.</li>
              <li>While on your CS2 inventory page, click the bookmark. A JSON file will download.</li>
              <li>Return here and use the <span className="text-zinc-100">Upload JSON</span> tab to import it.</li>
            </ol>
          </div>

          <a
            href={bookmarkletHref}
            className="inline-block rounded-xl bg-lime-500 px-4 py-2 text-sm font-semibold text-black hover:bg-lime-400"
            title="Drag me to your bookmarks bar"
          >
            ➕ Add “CS2 Quick Import” to bookmarks
          </a>

          <details className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3 text-xs text-zinc-400">
            <summary className="cursor-pointer text-zinc-300">Troubleshooting</summary>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Inventory must be set to <span className="text-zinc-100">Public</span>.</li>
              <li>If you use a vanity URL (like <code>/id/tom</code>), the button will auto-resolve it.</li>
              <li>Some browsers hide the bookmarks bar—enable it (Ctrl/Cmd+Shift+B).</li>
            </ul>
          </details>
        </div>
      )}
    </div>
  );
}
