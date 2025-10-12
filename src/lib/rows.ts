import { supabase } from "@/lib/supabase";

export type RowsPayload = { rows: unknown[]; updated_at?: string };

export async function fetchAccountRows(): Promise<RowsPayload | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("cs2_rows")
    .select("rows,updated_at")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) return null;
  return data ? { rows: data.rows ?? [], updated_at: data.updated_at } : null;
}

export async function upsertAccountRows(rows: unknown[]): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { error } = await supabase
    .from("cs2_rows")
    .upsert({ user_id: user.id, rows, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  return !error;
}
