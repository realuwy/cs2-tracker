// Small wrapper for Upstash KV (Redis)
import { Redis } from "@upstash/redis";

export const kv = Redis.fromEnv();

export type PairRecord = {
  id: string;                 // local-first user ID from desktop
  status: "pending" | "claimed";
  createdAt: number;          // ms
  claimedAt?: number;         // ms
};

export const PAIR_TTL_SECONDS = 180; // 3 minutes
export const pairKey = (code: string) => `pair:${code}`;
