import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { kv, userDataKey } from "@/lib/kv";

export const runtime = "nodejs";
const MAX_BYTES = 512 * 1024; // 512KB

export async function POST(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const email = token ? verifyToken(token) : null;
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.text();
  if (new TextEncoder().encode(body).length > MAX_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  // accept any JSON object; you can validate shape client-side
  let json: any;
  try { json = JSON.parse(body); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }

  await kv.set(userDataKey(email), json);
  return NextResponse.json({ ok: true });
}
