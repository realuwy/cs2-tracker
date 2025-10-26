// src/lib/kv.ts
import { Redis } from "@upstash/redis";

export const redis = Redis.fromEnv();

// Single place to define keys for rows storage
export const rowsKey = (id: string) => `rows:${id}`;
export const rowsTsKey = (id: string) => `rows:${id}:ts`;
