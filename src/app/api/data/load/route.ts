import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { kv, userDataKey } from "@/lib/kv";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const email = token ? verifyToken(token) : null;
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = (await kv.get(userDataKey(email))) || { items: [] };
  return NextResponse.json(data);
}
