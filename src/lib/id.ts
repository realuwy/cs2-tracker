// src/lib/id.ts
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

export function getUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LS.userId);
}

export function setUserId(id: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS.userId, id);
  localStorage.setItem(LS.meta, JSON.stringify({ updatedAt: Date.now() }));
}

export function clearAllLocalData(keepUserId = false) {
  if (typeof window === "undefined") return;
  if (!keepUserId) localStorage.removeItem(LS.userId);
  localStorage.removeItem(LS.items);
  localStorage.removeItem(LS.meta);
  localStorage.removeItem(LS.settings);
}
