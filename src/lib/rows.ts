// src/lib/rows.ts
// Local-first placeholder implementations (no Supabase).
// Keep the same function signatures the rest of the app expects.

export type Session = unknown;

// If you want to type rows more strictly, mirror the Row shape you use on the dashboard.
// For now, keep it generic to avoid coupling.
export type Row = Record<string, unknown>;

/**
 * Fetch user rows from a remote store.
 * Local-first version returns an empty list; the dashboard merges with localStorage.
 */
export async function fetchUserRows(_session?: Session): Promise<Row[]> {
  return [];
}

/**
 * Upsert user rows to a remote store.
 * Local-first version is a no-op.
 */
export async function upsertUserRows(_session: Session | undefined, _rows: Row[]): Promise<void> {
  // no-op
}
