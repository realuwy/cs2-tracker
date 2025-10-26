// src/lib/rows-sync.ts
export type Rows = any[];

/** Fetch remote rows for an id. Returns [] if none. */
export async function fetchRemoteRows(id: string): Promise<Rows> {
  const res = await fetch(`/api/rows/get?id=${encodeURIComponent(id)}`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  const j = await res.json();
  return Array.isArray(j?.rows) ? j.rows : [];
}

/** Save rows for an id (fire-and-forget safe). */
export async function saveRemoteRows(id: string, rows: Rows): Promise<void> {
  try {
    await fetch(`/api/rows/set`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, rows }),
    });
  } catch {
    // ignore network errors; we'll retry on next edit
  }
}
