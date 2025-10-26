// src/lib/kv.ts
// Upstash Redis helpers + namespaced keys + simple rate limiter

import { Redis } from "@upstash/redis";

// Env vars required on Vercel:
//   UPSTASH_REDIS_REST_URL
//   UPSTASH_REDIS_REST_TOKEN
export const kv = Redis.fromEnv();
// Some older files import `redis` — keep a compatible alias:
export const redis = kv;

const NS = "cs2"; // namespace prefix

/* -------------------------- key helpers -------------------------- */

// email-based auth code storage
export const codeKey = (email: string) =>
  `${NS}:auth:code:${email.trim().toLowerCase()}`;

// per-email user meta (e.g., link userId <-> email)
export const userMetaKey = (email: string) =>
  `${NS}:user:meta:${email.trim().toLowerCase()}`;

// id-based inventory blob (JSON string)
export const userDataKey = (userId: string) =>
  `${NS}:data:${userId.trim()}`;

// new: id-based “rows” (inventory rows) + last-updated timestamp
export const rowsKey = (userId: string) =>
  `${NS}:rows:${userId.trim()}`;
export const rowsTsKey = (userId: string) =>
  `${NS}:rows:${userId.trim()}:ts`;

// rate-limit buckets
export const rlKeyIP = (ip: string) => `${NS}:rl:ip:${ip}`;
export const rlKeySend = (email: string) =>
  `${NS}:rl:send:${email.trim().toLowerCase()}`;

/* ------------------------ rate limiter -------------------------- */

export type RateResult = {
  ok: boolean;       // within limit?
  count: number;     // current hits in window
  remaining: number; // how many left
  resetAt: number;   // epoch ms when bucket resets
};

/**
 * Simple window limiter using INCR + EXPIRE.
 * First hit sets TTL; subsequent hits share it.
 */
export async function rlBump(
  key: string,
  limit: number,
  windowSec: number
): Promise<RateResult> {
  const count = (await kv.incr<number>(key)) ?? 0;
  if (count === 1) {
    await kv.expire(key, windowSec);
  }
  const ttlSec = (await kv.ttl<number>(key)) ?? windowSec;
  return {
    ok: count <= limit,
    count,
    remaining: Math.max(0, limit - count),
    resetAt: Date.now() + Math.max(0, ttlSec) * 1000,
  };
}
