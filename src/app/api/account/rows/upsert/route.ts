// src/app/api/account/rows/upsert/route.ts
import { NextResponse } from "next/server";
export const runtime = "edge";

export async function POST() {
  return NextResponse.json(
    { ok: false, message: "Legacy Supabase endpoint removed." },
    { status: 410 }
  );
}

