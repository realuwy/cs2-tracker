import { getSupabaseClient } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

export type Row = {
  id?: string;
  user_id?: string;
  name: string;
  market_hash_name: string;
  wear?: "" | "FN" | "MW" | "FT" | "WW" | "BS";
  float_value?: number | null;
  pattern_index?: number | null;
  quantity?: number;
  image?: string | null;
  inspect_link?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
};

export async function fetchUserRows(session: Session) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("portfolio_items")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as Row[];
}

export async function upsertUserRows(session: Session, rows: Row[]) {
  const supabase = getSupabaseClient();
  const rowsWithUser = rows.map(r => ({ ...r, user_id: session.user.id }));
  const { data, error } = await supabase
    .from("portfolio_items")
    .upsert(rowsWithUser, { onConflict: "id" })
    .select();
  if (error) throw error;
  return data as Row[];
}

export async function deleteUserRow(session: Session, id: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("portfolio_items").delete().eq("id", id);
  if (error) throw error;
}

export async function clearUserRows(session: Session) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("portfolio_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) throw error;
}
// ---- Back-compat (legacy names still used by old routes) ----
export const upsertAccountRows = upsertUserRows;
export const fetchAccountRows = fetchUserRows;

