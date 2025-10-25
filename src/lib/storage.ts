// src/lib/storage.ts
"use client";

export type PortfolioItem = {
  id: string;                 // uuid for local rows
  name: string;
  nameNoWear: string;
  wear?: "" | "FN" | "MW" | "FT" | "WW" | "BS";
  quantity?: number;
  pattern?: string | null;
  float?: string | null;
  image?: string | null;
  inspectLink?: string;
  notes?: string | null;
  createdAt?: number;
  updatedAt?: number;
  // add anything you already store on rows
};

const LS = {
  userId: "cs2.userId",
  items: "cs2.portfolio.items",
  meta: "cs2.portfolio.meta",
};

export function getUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LS.userId);
}

export function setUserId(id: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS.userId, id);
}

export function loadItems(): PortfolioItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS.items);
    return raw ? (JSON.parse(raw) as PortfolioItem[]) : [];
  } catch {
    return [];
  }
}

export function saveItems(items: PortfolioItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS.items, JSON.stringify(items));
  localStorage.setItem(LS.meta, JSON.stringify({ updatedAt: Date.now() }));
}

export function upsertItems(next: PortfolioItem[] | ((prev: PortfolioItem[]) => PortfolioItem[])) {
  const prev = loadItems();
  const value = typeof next === "function" ? (next as any)(prev) : next;
  saveItems(value);
  return value;
}

export function clearAllLocal() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LS.items);
  localStorage.removeItem(LS.meta);
  // keep userId unless you want a full reset
}
