// src/lib/kv.ts
// Thin wrapper around Upstash Redis + handy key + rate-limit helpers

import { Redis } from "@upstash/redis";

// Ensure you’ve set:
//   UPSTASH_REDIS_REST_URL
//   UPSTASH_REDIS_REST_TOKEN
export const kv = Redis.fromEnv();

// ---- Key helpers -----------------------------------------------------------

const NS = "cs2"; // namespace prefix to keep keys tidy

export const codeKey = (email: string) =>
  `${NS}:auth:code:${email.trim().toLowerCase()}`;

export const userMetaKey = (email: string) =>
  `${NS}:user:meta:${email.trim().toLowerCase()}`;

// Inventory blob by ID (JSON string)
export const userDataKey = (userId: string) =>
  `${NS}:data:${userId.trim()}`;

// Rate-limit buckets
export const rlKeyIP = (ip: string) => `${NS}:rl:ip:${ip}`;
export const rlKeySend = (email: string) =>
  `${NS}:rl:send:${email.trim().toLowerCase()}`;

// ---- Rate limiting ---------------------------------------------------------

export type RateResult = {
  ok: boolean;          // within the limit?
  count: number;        // current count in the window
  remaining: number;    // how many left before blocking
  resetAt: number;      // epoch ms when the bucket will reset
};

/**
 * Sliding-window-ish limiter using INCR + EXPIRE.
 * First hit sets TTL; subsequent hits share that TTL.
 *
 * @param key        redis key for the bucket
 * @param limit      max hits allowed within windowSec
 * @param windowSec  window length in seconds
 */
export async function rlBump(
  key: string,
  limit: number,
  windowSec: number
): Promise<RateResult> {
  // INCR returns the incremented value
  const count = (await kv.incr<number>(key)) ?? 0;

  // If this is the first hit, attach TTL for the window
  if (count === 1) {
    await kv.expire(key, windowSec);
  }

  // Figure out remaining TTL to compute resetAt
  // Upstash doesn't expose TTL via the high-level SDK; use raw command.
  // Returns seconds to expire or -1 if no TTL (rare here).
  const ttlSec = (await kv.ttl<number>(key)) ?? windowSec;
  const resetAt = Date.now() + Math.max(0, ttlSec) * 1000;

  return {
    ok: count <= limit,
    count,
    remaining: Math.max(0, limit - count),
    resetAt,
  };
}
