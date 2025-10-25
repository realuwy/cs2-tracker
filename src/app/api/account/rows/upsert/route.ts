import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { upsertAccountRows } from "@/lib/rows"; // alias to upsertUserRows(session, rows)

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rows = Array.isArray(body?.rows) ? body.rows : [];
    if (!rows.length) return NextResponse.json({ ok: true });

    // get session
    const supabase = getSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
    }

    // NOTE: pass session + rows
    await upsertAccountRows(session, rows);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "fail" },
      { status: 500 }
    );
  }
}
