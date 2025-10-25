// src/lib/id.ts
export const USER_ID_KEY = "user_id_v1";

// 20-char Crockford base32-ish, easy to read/communicate
export function generateUserId() {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no I,L,O,0,1
  let out = "";
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  for (let i = 0; i < bytes.length; i++) {
    out += alphabet[bytes[i] % alphabet.length];
    if ((i + 1) % 4 === 0 && i !== bytes.length - 1) out += "-";
  }
  return out; // e.g., "8XFA-V27Q-KM3N-9PGC"
}

export function getUserId(): string | null {
  try {
    return localStorage.getItem(USER_ID_KEY);
  } catch {
    return null;
  }
}

export function setUserId(id: string) {
  localStorage.setItem(USER_ID_KEY, id);
}

export function clearAllLocalData() {
  try {
    localStorage.removeItem(USER_ID_KEY);
    // add other app keys here if you want a full local reset:
    // localStorage.removeItem("portfolio_items");
    // localStorage.removeItem("guest_mode");
  } catch {}
}
