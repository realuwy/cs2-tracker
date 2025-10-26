// src/lib/id.ts

const ID_KEY = "cs2:userId";

/** Returns existing ID or creates & stores a new one. */
export function getExistingId(): string {
  if (typeof window === "undefined") {
    // SSR safety: generate a deterministic placeholder (not persisted)
    return "server-" + "xxxxxxxxxxxx".replace(/x/g, () =>
      Math.floor(Math.random() * 16).toString(16)
    );
  }

  let id = localStorage.getItem(ID_KEY);
  if (!id || id.trim() === "") {
    id = (typeof crypto !== "undefined" && "randomUUID" in crypto)
      ? crypto.randomUUID()
      : "id-" +
        Date.now().toString(36) +
        "-" +
        Math.random().toString(36).slice(2, 8);

    try {
      localStorage.setItem(ID_KEY, id);
    } catch {}
  }
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

  // Also clear user id key if it exists but not prefixed (safety)
  try {
    localStorage.removeItem(ID_KEY);
  } catch {}

  try {
    window.dispatchEvent(new CustomEvent("id:changed", { detail: { userId: null } }));
  } catch {}
}

export { getExistingId as getUserId };

