// src/lib/supabase.ts
// Temporary stub while migrating off Supabase.
// Intentionally does NOT import '@supabase/supabase-js'.
// Provides a minimal API so existing code compiles.

export type Session = null;

type AuthStub = {
  getSession: () => Promise<{ data: { session: Session } }>;
  onAuthStateChange: (
    _cb: (event: unknown, session: Session) => void
  ) => { data: { subscription: { unsubscribe: () => void } } };
  signOut: () => Promise<{ error: null }>;
};

export type SupabaseClientStub = {
  auth: AuthStub;
};

function makeClient(): SupabaseClientStub {
  return {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
      signOut: async () => ({ error: null }),
    },
  };
}

// Legacy names your code might import
export function createClient(): SupabaseClientStub {
  return makeClient();
}
export function getSupabaseClient(): SupabaseClientStub {
  return makeClient();
}

// If some code imports getSession directly:
export async function getSession(): Promise<{ session: Session }> {
  return { session: null };
}
