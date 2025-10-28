// src/lib/id.ts

const ID_KEY = "cs2:userId";

/** Read the existing ID without creating one. Returns null if none. */
export function peekUserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(ID_KEY);
    return v && v.trim() ? v : null;
  } catch {
    return null;
  }
}

/** Create a fresh new ID (does NOT store it). */
export function generateNewId(): string {
  return (typeof crypto !== "undefined" && "randomUUID" in crypto)
    ? crypto.randomUUID()
    : "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}

/** Returns existing ID or creates & stores a new one (for flows that need it now). */
export function getExistingId(): string {
  const existing = peekUserId();
  if (existing) return existing;

  // Only runs on client
  const id = generateNewId();
  try {
    localStorage.setItem(ID_KEY, id);
  } catch {}
  return id;
}

/** Set or clear the current userId and broadcast a change event. */
export function setUserId(next: string | null) {
  if (typeof window === "undefined") return;

  if (next && next.trim() !== "") {
    try {
      localStorage.setItem(ID_KEY, next);
    } catch {}
    try {
      window.dispatchEvent(new CustomEvent("id:changed", { detail: { userId: next } }));
    } catch {}
  } else {
    try {
      localStorage.removeItem(ID_KEY);
    } catch {}
    try {
      window.dispatchEvent(new CustomEvent("id:changed", { detail: { userId: null } }));
    } catch {}
  }
}

/** Clear all local app data (keys starting with "cs2:") and broadcast ID change. */
export function clearAllLocalData() {
  if (typeof window === "undefined") return;

  try {
    const toDelete: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("cs2:")) toDelete.push(k);
    }
    toDelete.forEach((k) => localStorage.removeItem(k));
  } catch {}

  // Also clear user id key explicitly
  try {
    localStorage.removeItem(ID_KEY);
  } catch {}

  try {
    window.dispatchEvent(new CustomEvent("id:changed", { detail: { userId: null } }));
  } catch {}
}

/* -------------------------------------------------------------------------- */
/* Back-compat: older code imported `getUserId`                                */
/* -------------------------------------------------------------------------- */
export { getExistingId as getUserId };

