"use client";
import { useState } from "react";


type Item = {
id: string;
assetid: string;
classid: string;
name: string;
exterior: string;
icon: string;
};


export default function UploadInventory({ onItems }: { onItems: (items: Item[]) => void }) {
const [err, setErr] = useState<string | null>(null);
const [count, setCount] = useState<number | null>(null);


return (
<div className="rounded-xl border border-border bg-surface p-4">
<div className="mb-2 text-sm text-muted">
Import the JSON you exported with the bookmarklet.
</div>


<input
type="file"
accept="application/json"
onChange={async (e) => {
setErr(null);
setCount(null);
const f = e.target.files?.[0];
if (!f) return;
try {
const txt = await f.text();
const j = JSON.parse(txt);
if (!j || !Array.isArray(j.items)) {
setErr("Invalid file. Expected { items: [] }.");
return;
}
const items = (j.items as Item[]).map((it) => ({
id: String(it.id),
assetid: String((it as any).assetid ?? ""),
classid: String(it.classid ?? ""),
name: String(it.name ?? "Unknown"),
exterior: String(it.exterior ?? ""),
icon: String(it.icon ?? ""),
}));


// Optional: persist locally with de-dupe
const key = "cs2_items";
const prev = JSON.parse(localStorage.getItem(key) || "[]");
const byId = new Map<string, Item>();
[...(prev as Item[]), ...items].forEach((it) => byId.set(it.id, it));
const merged = Array.from(byId.values());
localStorage.setItem(key, JSON.stringify(merged));


setCount(items.length);
onItems(merged);
} catch (e: any) {
setErr(e?.message || "Could not read file.");
}
}}
className="block w-full rounded-lg border border-border bg-surface2 px-3 py-2 text-text outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
/>


{count !== null && (
<p className="mt-2 text-sm text-muted">Imported <span className="font-medium text-text">{count}</span> items.</p>
)}
{err && <p className="mt-2 text-sm text-red-400">{err}</p>}
</div>
);
}
