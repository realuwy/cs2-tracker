import type { Item } from "./types";

const KEY = "cs2_portfolio_guest_v1";

export function readGuestPortfolio(): Item[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveGuestPortfolio(items: Item[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {}
}
