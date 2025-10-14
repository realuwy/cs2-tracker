// src/lib/supabase.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  _client = createClient(url, anon, {
    auth: {
      autoRefreshToken: true,
      persistSession: typeof window !== "undefined",              // SSR-safe
      storage: typeof window !== "undefined" ? window.localStorage : undefined as any,
    },
  });

  return _client;
}
