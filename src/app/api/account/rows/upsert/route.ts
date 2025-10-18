import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { upsertAccountRows } from "@/lib/rows";

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseClient();
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user?.id) {
      return NextResponse.json({ ok: false, error: "not_authed" }, { status: 401 });
    }
    const body = await req.json();
    const rows = Array.isArray(body?.rows) ? body.rows : [];
    if (!rows.length) return NextResponse.json({ ok: true });
    await upsertAccountRows(rows);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "fail" }, { status: 500 });
  }
}
