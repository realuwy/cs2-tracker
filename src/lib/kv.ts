import { Redis } from "@upstash/redis";
import crypto from "crypto";

export const kv = Redis.fromEnv();

// --- email hashing (lowercased) so keys don't expose PII ---
export function emailHash(email: string) {
  return crypto.createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

// --- key builders ---
export const codeKey     = (email: string) => `code:${emailHash(email)}`;        // stores { code, tries }
export const userMetaKey = (email: string) => `user:${emailHash(email)}:meta`;   // { email, id }
export const userDataKey = (email: string) => `user:${emailHash(email)}:data`;   // dashboard JSON

// --- minimal rate limits (KV counters with TTL) ---
export async function rlBump(key: string, max: number, ttlSec: number) {
  const count = await kv.incr(key);
  if (count === 1) await kv.expire(key, ttlSec);
  if (count > max) return false;
  return true;
}
export const rlKeySend   = (email: string) => `rl:send:${emailHash(email)}`; // per-email send limit
export const rlKeyIP     = (ip: string)    => `rl:ip:${ip}`;                 // per-IP limit
