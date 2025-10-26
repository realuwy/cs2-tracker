// src/lib/id.ts
// Small utility for handling anonymous user IDs in localStorage.
// NOTE: getExistingId() never creates an ID. Use generateUserId() to create one explicitly.

const KEY = "cs2:user:id";

export function getExistingId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const id = window.localStorage.getItem(KEY);
    return id && id.trim() ? id : null;
  } catch {
    return null;
  }
}

export function generateUserId(): string {
  const id = crypto.randomUUID();
  setUserId(id);
  return id;
}

export function setUserId(id: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, id);
  } catch {}
  // notify listeners
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("id:changed", { detail: { userId: id } }));
  }
}

export function clearAllLocalData() {
  if (typeof window === "undefined") return;
  try {
    // wipe the ID and any app-local caches
    window.localStorage.removeItem(KEY);
    window.localStorage.removeItem("cs2:dashboard:rows");
    window.localStorage.removeItem("cs2:dashboard:rows:updatedAt");
    window.localStorage.removeItem("cs2_items"); // legacy
  } catch {}
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("id:changed", { detail: { userId: null } }));
   
    export { getExistingId as getUserId };
  }
}
