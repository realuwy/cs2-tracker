// src/lib/kv.ts
import { Redis } from "@upstash/redis";

// --- Client -----------------------------------------------------------------
export const kv = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Some files import `redis`, so alias it for safety.
export const redis = kv;

// --- Key helpers -------------------------------------------------------------
const ns = (...parts: (string | number | undefined | null)[]) =>
  parts.filter(Boolean).join(":");

// Email login code (magic code) storage
export const codeKey = (email: string) => ns("auth", "code", email.toLowerCase());

// Per-user metadata (e.g., createdAt, lastLogin, etc.)
export const userMetaKey = (email: string) => ns("user", "meta", email.toLowerCase());

// Inventory rows blob (JSON) and a timestamp alongside it
export const rowsKey = (userId: string) => ns("rows", userId);
export const rowsTsKey = (userId: string) => ns("rows", userId, "ts");

// Optionally used by data load/save endpoints
export const userDataKey = (userId: string) => ns("data", userId);

// Rate-limit keys
export const rlKeyIP = (ip: string) => ns("rl", "ip", ip);
export const rlKeySend = (email: string) => ns("rl", "send", email.toLowerCase());

// --- Simple sliding-window-ish rate limiter ---------------------------------
type RateResult = {
  allowed: boolean;
  remaining: number;
  resetSec: number;
  count: number;
};

/**
 * Increment a counter and set an expiry for the key on first hit.
 * `limit` = max requests in `windowSec`.
 */
export async function rlBump(
  key: string,
  limit: number,
  windowSec: number
): Promise<RateResult> {
  // NOTE: `incr` has no generic type parameter.
  const count = (await kv.incr(key)) ?? 0;

  // First hit in window → set TTL
  if (count === 1) {
    await kv.expire(key, windowSec);
  }

  const remaining = Math.max(0, limit - count);

  // Upstash returns TTL in seconds; -1 = no expire, -2 = no key
  const ttl = await kv.ttl(key);
  const resetSec =
    typeof ttl === "number" ? (ttl < 0 ? 0 : ttl) : windowSec;

  return {
    allowed: count <= limit,
    remaining,
    resetSec,
    count,
  };
}
