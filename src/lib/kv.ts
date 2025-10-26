// src/lib/kv.ts
import { Redis } from "@upstash/redis";

export const kv = Redis.fromEnv();

// Pairing (QR handoff)
export type PairRecord = {
  id: string;
  status: "pending" | "claimed";
  createdAt: number;
  claimedAt?: number;
};

export const PAIR_TTL_SECONDS = 180;
export const pairKey = (code: string) => `pair:${code}`;

// Email ↔ ID linking
export const emailKey = (email: string) => `email:${email.toLowerCase()}`; // email -> id
export const idEmailKey = (id: string) => `id:${id}:email`;               // id -> email
