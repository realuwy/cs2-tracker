"use client";

const LS = {
  userId: "cs2.userId",
  items: "cs2.portfolio.items",
  meta: "cs2.portfolio.meta",
  settings: "cs2.settings",
};

export function generateUserId() {
  return crypto.randomUUID();
}

export function getUserId() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LS.userId);
}

export function setUserId(id: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS.userId, id);
  localStorage.setItem(LS.meta, JSON.stringify({ updatedAt: Date.now() }));
  // 🔔 tell the app the ID changed
  window.dispatchEvent(new CustomEvent("id:changed", { detail: { userId: id } }));
}

export function clearAllLocalData(keepUserId = false) {
  if (typeof window === "undefined") return;
  if (!keepUserId) localStorage.removeItem(LS.userId);
  localStorage.removeItem(LS.items);
  localStorage.removeItem(LS.meta);
  localStorage.removeItem(LS.settings);
  const next = keepUserId ? localStorage.getItem(LS.userId) : null;
  window.dispatchEvent(new CustomEvent("id:changed", { detail: { userId: next } }));
}
