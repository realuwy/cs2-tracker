export type Row = any; // keep your Row type import if you have it

const KS = { cloudKeyFor(email: string) { return `cs2:rows:${email.toLowerCase()}`; } };

// --- Direct Upstash REST via your existing API proxy (adjust if needed)
export async function fetchRemoteRowsByEmail(email: string): Promise<Row[]> {
  const res = await fetch(`/api/rows/get?email=${encodeURIComponent(email)}`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json().catch(() => ({}));
  return Array.isArray(data?.rows) ? data.rows : [];
}

export async function saveRemoteRowsByEmail(email: string, rows: Row[]): Promise<void> {
  await fetch(`/api/rows/set`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, rows }),
  }).catch(() => {});
}
