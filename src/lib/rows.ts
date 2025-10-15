import { getSupabaseClient } from "@/lib/supabase";

export type RowsPayload = { rows: unknown[]; updated_at?: string };

/** Fetch saved rows for the currently signed-in user. */
export async function fetchAccountRows(): Promise<RowsPayload | null> {
  const supabase = getSupabaseClient();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) return null;

  const { data, error } = await supabase
    .from("cs2_rows")
    .select("rows,updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return null;
  return { rows: data.rows ?? [], updated_at: data.updated_at };
}

/** Upsert rows for the current user. Returns true on success. */
export async function upsertAccountRows(rows: unknown[]): Promise<boolean> {
  const supabase = getSupabaseClient();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) return false;

  const { error } = await supabase
    .from("cs2_rows")
    .upsert(
      { user_id: user.id, rows, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );

  return !error;
}
