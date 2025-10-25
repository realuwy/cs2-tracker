// src/lib/supabase.ts
// Temporary stub while migrating off Supabase.
// This file intentionally avoids importing '@supabase/supabase-js'.

export type Session = null; // minimal placeholder

export function getSession(): Promise<{ session: Session }> {
  return Promise.resolve({ session: null });
}

// If any code expects a client, return a no-op object.
export function createClient() {
  return {
    auth: {
      // No-op auth interface
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signOut: async () => ({ error: null }),
    },
  };
}
