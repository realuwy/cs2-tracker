import { Redis } from "@upstash/redis";

export const kv = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// keep prod/preview data separate
export const envPrefix = process.env.VERCEL_ENV === "preview" ? "preview" : "prod";
export const P = (k: string) => `${envPrefix}:${k}`;
